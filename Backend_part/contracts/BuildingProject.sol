// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TenderManagement.sol";

contract BuildingProject {
    // Import TenderManagement for tender and bid functionality
    TenderManagement public tenderManager;
    
    struct Progress {
        uint256 tenderId;
        string description;
        string evidenceHash;
        uint256 timestamp;
        bool isValidated;
        uint8 validationCount;
        mapping(address => bool) validators;
    }

    struct User {
        address userAddress;
        string role; // admin, contractor, engineer, validator
        bool isVerified;
        string certificateHash;
    }

    // Using TenderStatus from TenderManagement

    mapping(uint256 => Progress[]) public progressReports;
    mapping(address => User) public users;

    address public owner;

    event ProgressReported(uint256 indexed tenderId, string description);
    event ProgressValidated(uint256 indexed tenderId, uint256 progressId);
    event UserRegistered(address indexed userAddress, string role);
    event UserVerified(address indexed userAddress);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAdmin() {
        require(bytes(users[msg.sender].role).length > 0 && 
                keccak256(bytes(users[msg.sender].role)) == keccak256(bytes("admin")), 
                "Only admin can call this function");
        _;
    }

    modifier onlyVerifiedUser() {
        require(users[msg.sender].isVerified, "User must be verified");
        _;
    }

    constructor(address _tenderManagementAddress) {
        owner = msg.sender;
        tenderManager = TenderManagement(_tenderManagementAddress);
    }

    function registerUser(address _userAddress, string memory _role) public {
        require(bytes(users[_userAddress].role).length == 0, "User already registered");
        users[_userAddress] = User({
            userAddress: _userAddress,
            role: _role,
            isVerified: false,
            certificateHash: ""
        });
        emit UserRegistered(_userAddress, _role);
    }

    function verifyUser(address _userAddress, string memory _certificateHash) public onlyAdmin {
        require(bytes(users[_userAddress].role).length > 0, "User not registered");
        users[_userAddress].isVerified = true;
        users[_userAddress].certificateHash = _certificateHash;
        emit UserVerified(_userAddress);
    }

    function createTender(
        string memory _title,
        string memory _description,
        uint256 _budget,
        uint256 _deadline,
        uint256 _minQualificationScore,
        uint256 _maxBids,
        uint256 _minBidAmount,
        uint256 _maxBidAmount
    ) public onlyAdmin {
        // Use TenderManagement contract for tender creation
        tenderManager.createTender(
            _title,
            _description,
            _budget,
            _deadline,
            _minQualificationScore,
            _maxBids,
            _minBidAmount,
            _maxBidAmount
        );
    }

    function submitBid(
        uint256 _tenderId,
        uint256 _amount,
        string memory _proposal,
        uint256 _estimatedDuration
    ) public onlyVerifiedUser {
        // Use TenderManagement contract for bid submission
        tenderManager.submitBid(_tenderId, _amount, _estimatedDuration, _proposal);
    }

    function reportProgress(
        uint256 _tenderId,
        string memory _description,
        string memory _evidenceHash
    ) public {
        // Get tender info using a function call instead of direct mapping access
        // This avoids issues with complex struct mappings
        (,,,,,,,TenderManagement.TenderStatus status, address selectedContractor) = tenderManager.getTenderDetails(_tenderId);
        
        require(msg.sender == selectedContractor, "Only selected contractor can report progress");
        require(status == TenderManagement.TenderStatus.Awarded, "Tender not in progress");

        uint256 progressId = progressReports[_tenderId].length;
        progressReports[_tenderId].push();
        Progress storage newProgress = progressReports[_tenderId][progressId];
        newProgress.tenderId = _tenderId;
        newProgress.description = _description;
        newProgress.evidenceHash = _evidenceHash;
        newProgress.timestamp = block.timestamp;
        newProgress.isValidated = false;
        newProgress.validationCount = 0;

        emit ProgressReported(_tenderId, _description);
    }

    function validateProgress(
        uint256 _tenderId,
        uint256 _progressId
    ) public onlyVerifiedUser {
        Progress storage progress = progressReports[_tenderId][_progressId];
        require(!progress.validators[msg.sender], "Already validated");

        progress.validators[msg.sender] = true;
        progress.validationCount++;

        if (progress.validationCount >= 2) { // Requiring at least 2 validations
            progress.isValidated = true;
            emit ProgressValidated(_tenderId, _progressId);
        }
    }

    // Getter functions
    function getUser(address _userAddress) public view returns (User memory) {
        return users[_userAddress];
    }
}
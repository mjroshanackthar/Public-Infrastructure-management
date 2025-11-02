// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./CredentialVerification.sol";
import "./AuditLog.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract TenderManagement is ReentrancyGuard, Pausable {
    struct Tender {
        uint256 id;
        address owner;
        string title;
        string description;
        uint256 budget;
        uint256 deadline;
        uint256 minQualificationScore;
        TenderStatus status;
        address selectedContractor;
        uint256 createdAt;
        uint256[] bidIds;
        mapping(address => bool) hasContractorBid;
        uint256 maxBids;
        uint256 minBidAmount;
        uint256 maxBidAmount;
    }

    struct Bid {
        uint256 id;
        uint256 tenderId;
        address contractor;
        uint256 amount;
        uint256 estimatedDuration;
        string proposal;
        uint256 timestamp;
        bool selected;
        bool active;
    }

    enum TenderStatus {
        Open,
        UnderReview,
        Awarded,
        Completed,
        Cancelled
    }

    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => Bid) public bids;
    mapping(address => uint256[]) public contractorTenders;
    mapping(address => uint256[]) public contractorBids;
    
    uint256 public tenderCount;
    uint256 public bidCount;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 2000;
    uint256 public constant MAX_PROPOSAL_LENGTH = 5000;
    uint256 public constant DEFAULT_MAX_BIDS = 100;

    CredentialVerification public credentialVerification;
    AuditLog public auditLog;

    event TenderCreated(
        uint256 indexed tenderId,
        address indexed owner,
        string title,
        uint256 budget
    );
    event BidSubmitted(
        uint256 indexed tenderId,
        uint256 indexed bidId,
        address indexed contractor,
        uint256 amount
    );
    event TenderStatusUpdated(
        uint256 indexed tenderId,
        TenderStatus status
    );
    event ContractorSelected(
        uint256 indexed tenderId,
        address indexed contractor,
        uint256 amount
    );
    event BidWithdrawn(
        uint256 indexed tenderId,
        uint256 indexed bidId,
        address indexed contractor
    );

    modifier onlyTenderOwner(uint256 _tenderId) {
        require(
            tenders[_tenderId].owner == msg.sender,
            "Only tender owner can call this function"
        );
        _;
    }

    modifier tenderExists(uint256 _tenderId) {
        require(_tenderId < tenderCount, "Tender does not exist");
        _;
    }

    modifier bidExists(uint256 _bidId) {
        require(_bidId < bidCount, "Bid does not exist");
        _;
    }

    modifier validTenderStatus(uint256 _tenderId, TenderStatus _status) {
        require(
            tenders[_tenderId].status == _status,
            "Invalid tender status for this operation"
        );
        _;
    }

    constructor(
        address _credentialVerificationAddress,
        address _auditLogAddress
    ) {
        require(_credentialVerificationAddress != address(0), "Invalid credential verification address");
        require(_auditLogAddress != address(0), "Invalid audit log address");
        
        credentialVerification = CredentialVerification(_credentialVerificationAddress);
        auditLog = AuditLog(_auditLogAddress);
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
    ) public whenNotPaused nonReentrant returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length <= MAX_DESCRIPTION_LENGTH, "Description too long");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_budget > 0, "Budget must be greater than 0");
        require(_minBidAmount <= _maxBidAmount, "Invalid bid amount range");
        require(_maxBidAmount <= _budget, "Max bid amount exceeds budget");
        require(_maxBids > 0 && _maxBids <= DEFAULT_MAX_BIDS, "Invalid max bids");

        uint256 tenderId = tenderCount++;
        Tender storage newTender = tenders[tenderId];

        newTender.id = tenderId;
        newTender.owner = msg.sender;
        newTender.title = _title;
        newTender.description = _description;
        newTender.budget = _budget;
        newTender.deadline = _deadline;
        newTender.minQualificationScore = _minQualificationScore;
        newTender.status = TenderStatus.Open;
        newTender.createdAt = block.timestamp;
        newTender.maxBids = _maxBids;
        newTender.minBidAmount = _minBidAmount;
        newTender.maxBidAmount = _maxBidAmount;

        contractorTenders[msg.sender].push(tenderId);

        emit TenderCreated(tenderId, msg.sender, _title, _budget);

        auditLog.addLog(
            msg.sender,
            "TENDER_CREATED",
            string(abi.encodePacked("Created tender: ", _title)),
            AuditLog.LogCategory.TenderOperations
        );

        return tenderId;
    }

    function submitBid(
        uint256 _tenderId,
        uint256 _amount,
        uint256 _estimatedDuration,
        string memory _proposal
    ) public whenNotPaused nonReentrant tenderExists(_tenderId) returns (uint256) {
        Tender storage tender = tenders[_tenderId];

        require(
            tender.status == TenderStatus.Open,
            "Tender is not open for bidding"
        );
        require(
            block.timestamp < tender.deadline,
            "Tender deadline has passed"
        );
        require(
            !tender.hasContractorBid[msg.sender],
            "Contractor has already bid"
        );
        require(
            credentialVerification.isVerifiedContractor(msg.sender),
            "Only verified contractors can bid"
        );
        require(
            credentialVerification.getContractorScore(msg.sender) >= tender.minQualificationScore,
            "Contractor does not meet minimum qualification score"
        );
        require(
            tender.bidIds.length < tender.maxBids,
            "Maximum number of bids reached"
        );
        require(
            _amount >= tender.minBidAmount && _amount <= tender.maxBidAmount,
            "Bid amount out of range"
        );
        require(
            bytes(_proposal).length <= MAX_PROPOSAL_LENGTH,
            "Proposal too long"
        );
        require(_estimatedDuration > 0, "Invalid duration");

        uint256 bidId = bidCount++;
        Bid storage newBid = bids[bidId];

        newBid.id = bidId;
        newBid.tenderId = _tenderId;
        newBid.contractor = msg.sender;
        newBid.amount = _amount;
        newBid.estimatedDuration = _estimatedDuration;
        newBid.proposal = _proposal;
        newBid.timestamp = block.timestamp;
        newBid.selected = false;
        newBid.active = true;

        tender.bidIds.push(bidId);
        tender.hasContractorBid[msg.sender] = true;
        contractorBids[msg.sender].push(bidId);

        emit BidSubmitted(_tenderId, bidId, msg.sender, _amount);

        auditLog.addLog(
            msg.sender,
            "BID_SUBMITTED",
            string(abi.encodePacked("Submitted bid for tender: ", tender.title)),
            AuditLog.LogCategory.Bidding
        );

        return bidId;
    }

    function withdrawBid(
        uint256 _bidId
    ) public whenNotPaused nonReentrant bidExists(_bidId) {
        Bid storage bid = bids[_bidId];
        Tender storage tender = tenders[bid.tenderId];

        require(bid.contractor == msg.sender, "Not bid owner");
        require(bid.active, "Bid already withdrawn");
        require(
            tender.status == TenderStatus.Open,
            "Cannot withdraw bid after tender closed"
        );
        require(!bid.selected, "Cannot withdraw selected bid");

        bid.active = false;
        tender.hasContractorBid[msg.sender] = false;

        emit BidWithdrawn(bid.tenderId, _bidId, msg.sender);

        auditLog.addLog(
            msg.sender,
            "BID_WITHDRAWN",
            string(abi.encodePacked("Withdrawn bid from tender: ", tender.title)),
            AuditLog.LogCategory.Bidding
        );
    }

    function selectContractor(uint256 _tenderId, uint256 _bidId)
        public
        whenNotPaused
        nonReentrant
        tenderExists(_tenderId)
        bidExists(_bidId)
        onlyTenderOwner(_tenderId)
        validTenderStatus(_tenderId, TenderStatus.Open)
    {
        Tender storage tender = tenders[_tenderId];
        Bid storage selectedBid = bids[_bidId];

        require(
            selectedBid.tenderId == _tenderId,
            "Bid does not belong to this tender"
        );
        require(selectedBid.active, "Bid is withdrawn");
        require(!selectedBid.selected, "Bid is already selected");

        tender.status = TenderStatus.Awarded;
        tender.selectedContractor = selectedBid.contractor;
        selectedBid.selected = true;

        emit ContractorSelected(
            _tenderId,
            selectedBid.contractor,
            selectedBid.amount
        );
        emit TenderStatusUpdated(_tenderId, TenderStatus.Awarded);

        auditLog.addLog(
            msg.sender,
            "CONTRACTOR_SELECTED",
            string(abi.encodePacked("Selected contractor for tender: ", tender.title)),
            AuditLog.LogCategory.TenderOperations
        );
    }

    function updateTenderStatus(uint256 _tenderId, TenderStatus _status)
        public
        whenNotPaused
        nonReentrant
        tenderExists(_tenderId)
        onlyTenderOwner(_tenderId)
    {
        Tender storage tender = tenders[_tenderId];
        require(
            _status != TenderStatus.Open,
            "Cannot set status back to Open"
        );
        require(
            uint8(_status) > uint8(tender.status),
            "Invalid status transition"
        );

        tender.status = _status;
        emit TenderStatusUpdated(_tenderId, _status);

        auditLog.addLog(
            msg.sender,
            "TENDER_STATUS_UPDATED",
            string(abi.encodePacked("Updated tender status: ", tender.title)),
            AuditLog.LogCategory.TenderOperations
        );
    }

    function getTenderBids(uint256 _tenderId)
        public
        view
        tenderExists(_tenderId)
        returns (Bid[] memory)
    {
        Tender storage tender = tenders[_tenderId];
        Bid[] memory tenderBids = new Bid[](tender.bidIds.length);

        for (uint256 i = 0; i < tender.bidIds.length; i++) {
            tenderBids[i] = bids[tender.bidIds[i]];
        }

        return tenderBids;
    }

    function getActiveBids(uint256 _tenderId)
        public
        view
        tenderExists(_tenderId)
        returns (Bid[] memory)
    {
        Tender storage tender = tenders[_tenderId];
        uint256 activeCount = 0;

        for (uint256 i = 0; i < tender.bidIds.length; i++) {
            if (bids[tender.bidIds[i]].active) {
                activeCount++;
            }
        }

        Bid[] memory activeBids = new Bid[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < tender.bidIds.length; i++) {
            if (bids[tender.bidIds[i]].active) {
                activeBids[currentIndex] = bids[tender.bidIds[i]];
                currentIndex++;
            }
        }

        return activeBids;
    }

    function getContractorBids(address _contractor)
        public
        view
        returns (Bid[] memory)
    {
        uint256[] storage contractorBidIds = contractorBids[_contractor];
        Bid[] memory contractorBidList = new Bid[](contractorBidIds.length);

        for (uint256 i = 0; i < contractorBidIds.length; i++) {
            contractorBidList[i] = bids[contractorBidIds[i]];
        }

        return contractorBidList;
    }

    function getContractorTenders(address _contractor)
        public
        view
        returns (uint256[] memory)
    {
        return contractorTenders[_contractor];
    }

    function getTenderDetails(uint256 _tenderId) 
        public 
        view 
        tenderExists(_tenderId) 
        returns (
            uint256 id,
            address owner,
            string memory title,
            string memory description,
            uint256 budget,
            uint256 deadline,
            uint256 minQualificationScore,
            TenderStatus status,
            address selectedContractor
        ) 
    {
        Tender storage tender = tenders[_tenderId];
        return (
            tender.id,
            tender.owner,
            tender.title,
            tender.description,
            tender.budget,
            tender.deadline,
            tender.minQualificationScore,
            tender.status,
            tender.selectedContractor
        );
    }

    function getBidDetails(uint256 _bidId)
        public
        view
        bidExists(_bidId)
        returns (
            uint256 tenderId,
            address contractor,
            uint256 amount,
            uint256 estimatedDuration,
            string memory proposal,
            uint256 timestamp,
            bool selected,
            bool active
        )
    {
        Bid storage bid = bids[_bidId];
        return (
            bid.tenderId,
            bid.contractor,
            bid.amount,
            bid.estimatedDuration,
            bid.proposal,
            bid.timestamp,
            bid.selected,
            bid.active
        );
    }

    function pause() public {
        require(msg.sender == address(credentialVerification), "Not authorized");
        _pause();
    }

    function unpause() public {
        require(msg.sender == address(credentialVerification), "Not authorized");
        _unpause();
    }
}
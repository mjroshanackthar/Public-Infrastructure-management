// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IContractInterfaces.sol";

contract CredentialVerification is ICredentialVerification {
    struct Certificate {
        string certificateHash;
        string issuer;
        uint256 issueDate;
        uint256 expiryDate;
        bool isVerified;
        string certificateType;
        mapping(address => bool) verifiers;
        uint256 verificationCount;
    }

    struct Verifier {
        bool isActive;
        string organization;
        uint256 verificationCount;
    }

    mapping(address => mapping(string => Certificate)) public userCertificates;
    mapping(address => Verifier) public verifiers;
    mapping(address => string[]) public userCertificateTypes;
    
    // Dynamic verifier tracking
    address[] public activeVerifierList;
    mapping(address => uint256) public verifierIndex; // 1-based index
    
    address public owner;
    uint256 public minimumVerifications;

    event CertificateSubmitted(address indexed user, string certificateType, string certificateHash);
    event CertificateVerified(address indexed user, string certificateType, address verifier);
    event VerifierAdded(address indexed verifier, string organization);
    event VerifierRemoved(address indexed verifier);
    event MinimumVerificationsUpdated(uint256 newMinimum);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender].isActive, "Only active verifiers can call this function");
        _;
    }

    constructor(uint256 _minimumVerifications) {
        owner = msg.sender;
        minimumVerifications = _minimumVerifications;
        
        // Add owner as first verifier
        _addVerifierInternal(msg.sender, "Contract Owner");
    }

    function addVerifier(address _verifier, string memory _organization) public onlyOwner {
        require(!verifiers[_verifier].isActive, "Verifier already exists");
        require(_verifier != address(0), "Invalid verifier address");
        
        _addVerifierInternal(_verifier, _organization);
        emit VerifierAdded(_verifier, _organization);
    }

    function _addVerifierInternal(address _verifier, string memory _organization) internal {
        verifiers[_verifier] = Verifier({
            isActive: true,
            organization: _organization,
            verificationCount: 0
        });
        
        // Add to active verifier list
        activeVerifierList.push(_verifier);
        verifierIndex[_verifier] = activeVerifierList.length; // 1-based index
    }

    function removeVerifier(address _verifier) public onlyOwner {
        require(verifiers[_verifier].isActive, "Verifier does not exist");
        
        verifiers[_verifier].isActive = false;
        
        // Remove from active verifier list
        uint256 indexToRemove = verifierIndex[_verifier] - 1; // Convert to 0-based
        require(indexToRemove < activeVerifierList.length, "Verifier index out of bounds");
        
        // Swap with last element and pop
        if (indexToRemove < activeVerifierList.length - 1) {
            address lastVerifier = activeVerifierList[activeVerifierList.length - 1];
            activeVerifierList[indexToRemove] = lastVerifier;
            verifierIndex[lastVerifier] = indexToRemove + 1;
        }
        
        activeVerifierList.pop();
        delete verifierIndex[_verifier];
        
        emit VerifierRemoved(_verifier);
    }

    function submitCertificate(
        string memory _certificateType,
        string memory _certificateHash,
        string memory _issuer,
        uint256 _issueDate,
        uint256 _expiryDate
    ) public {
        require(bytes(_certificateHash).length > 0, "Certificate hash cannot be empty");
        require(_issueDate < _expiryDate, "Invalid date range");
        require(bytes(_certificateType).length > 0, "Certificate type cannot be empty");

        Certificate storage cert = userCertificates[msg.sender][_certificateType];
        
        // If certificate doesn't exist, add to user's certificate types list
        if (bytes(cert.certificateHash).length == 0) {
            userCertificateTypes[msg.sender].push(_certificateType);
        }
        
        cert.certificateHash = _certificateHash;
        cert.issuer = _issuer;
        cert.issueDate = _issueDate;
        cert.expiryDate = _expiryDate;
        cert.certificateType = _certificateType;
        
        // Reset verification status when certificate is updated
        cert.isVerified = false;
        cert.verificationCount = 0;
        
        emit CertificateSubmitted(msg.sender, _certificateType, _certificateHash);
    }

    function verifyCertificate(address _user, string memory _certificateType) public onlyVerifier {
        Certificate storage cert = userCertificates[_user][_certificateType];
        require(bytes(cert.certificateHash).length > 0, "Certificate does not exist");
        require(!cert.verifiers[msg.sender], "Already verified by this verifier");
        require(block.timestamp < cert.expiryDate, "Certificate has expired");
        require(!cert.isVerified, "Certificate is already fully verified");

        cert.verifiers[msg.sender] = true;
        cert.verificationCount++;
        verifiers[msg.sender].verificationCount++;

        // Check if minimum verifications reached
        if (cert.verificationCount >= minimumVerifications) {
            cert.isVerified = true;
        }

        emit CertificateVerified(_user, _certificateType, msg.sender);
    }

    function getCertificateStatus(
        address _user,
        string memory _certificateType
    ) public view returns (
        bool exists,
        bool isVerified,
        string memory issuer,
        uint256 issueDate,
        uint256 expiryDate,
        uint256 currentVerificationCount
    ) {
        Certificate storage cert = userCertificates[_user][_certificateType];
        exists = bytes(cert.certificateHash).length > 0;
        isVerified = cert.isVerified;
        issuer = cert.issuer;
        issueDate = cert.issueDate;
        expiryDate = cert.expiryDate;
        currentVerificationCount = cert.verificationCount;
    }

    function getUserCertificates(address _user) public view returns (string[] memory) {
        return userCertificateTypes[_user];
    }

    function getVerifierInfo(address _verifier) public view returns (
        bool isActive,
        string memory organization,
        uint256 verificationCount
    ) {
        Verifier storage verifier = verifiers[_verifier];
        return (verifier.isActive, verifier.organization, verifier.verificationCount);
    }

    function getActiveVerifiers() public view returns (address[] memory) {
        return activeVerifierList;
    }

    function getActiveVerifierCount() public view returns (uint256) {
        return activeVerifierList.length;
    }

    function setMinimumVerifications(uint256 _newMinimum) public onlyOwner {
        require(_newMinimum > 0, "Minimum verifications must be greater than 0");
        require(_newMinimum <= activeVerifierList.length, "Minimum cannot exceed active verifier count");
        
        minimumVerifications = _newMinimum;
        emit MinimumVerificationsUpdated(_newMinimum);
    }

    function getCertificateVerifiers(
        address _user, 
        string memory _certificateType
    ) public view returns (address[] memory, bool[] memory) {
        Certificate storage cert = userCertificates[_user][_certificateType];
        require(bytes(cert.certificateHash).length > 0, "Certificate does not exist");
        
        address[] memory allVerifiers = activeVerifierList;
        bool[] memory hasVerified = new bool[](allVerifiers.length);
        
        for (uint256 i = 0; i < allVerifiers.length; i++) {
            hasVerified[i] = cert.verifiers[allVerifiers[i]];
        }
        
        return (allVerifiers, hasVerified);
    }

    // Implementation of ICredentialVerification interface methods
    function isVerifiedContractor(address _contractor) external view override returns (bool) {
        (bool exists, bool isVerified, , , uint256 expiryDate, ) = getCertificateStatus(_contractor, "contractor_license");
        return exists && isVerified && block.timestamp < expiryDate;
    }

    function getContractorScore(address _contractor) external view override returns (uint256) {
        uint256 score = 0;
        string[] memory certTypes = getUserCertificates(_contractor);
        
        for (uint256 i = 0; i < certTypes.length; i++) {
            (bool exists, bool isVerified, , , uint256 expiryDate, ) = getCertificateStatus(_contractor, certTypes[i]);
            if (exists && isVerified && block.timestamp < expiryDate) {
                if (keccak256(bytes(certTypes[i])) == keccak256(bytes("contractor_license"))) {
                    score += 50;
                } else if (keccak256(bytes(certTypes[i])) == keccak256(bytes("safety_certification"))) {
                    score += 20;
                } else if (keccak256(bytes(certTypes[i])) == keccak256(bytes("quality_certification"))) {
                    score += 15;
                } else if (keccak256(bytes(certTypes[i])) == keccak256(bytes("specialization"))) {
                    score += 25;
                } else {
                    score += 10;
                }
            }
        }
        return score;
    }

    function isVerifiedValidator(address _validator) external view override returns (bool) {
        (bool exists, bool isVerified, , , uint256 expiryDate, ) = getCertificateStatus(_validator, "validator_certification");
        return exists && isVerified && block.timestamp < expiryDate;
    }

    function isVerifiedSupervisor(address _supervisor) external view override returns (bool) {
        (bool exists, bool isVerified, , , uint256 expiryDate, ) = getCertificateStatus(_supervisor, "supervisor_certification");
        return exists && isVerified && block.timestamp < expiryDate;
    }

    // Emergency function to fix verification count (only for contract owner)
    function fixVerificationCount(
        address _user, 
        string memory _certificateType
    ) public onlyOwner {
        Certificate storage cert = userCertificates[_user][_certificateType];
        require(bytes(cert.certificateHash).length > 0, "Certificate does not exist");
        
        // Recalculate verification count
        uint256 actualCount = 0;
        for (uint256 i = 0; i < activeVerifierList.length; i++) {
            if (cert.verifiers[activeVerifierList[i]]) {
                actualCount++;
            }
        }
        
        cert.verificationCount = actualCount;
        cert.isVerified = (actualCount >= minimumVerifications);
    }

    // Check if specific verifier has verified a certificate
    function hasVerifierApproved(
        address _user,
        string memory _certificateType,
        address _verifier
    ) public view returns (bool) {
        Certificate storage cert = userCertificates[_user][_certificateType];
        return cert.verifiers[_verifier];
    }
}
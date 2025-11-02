// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICredentialVerification {
    function getCertificateStatus(address _user, string memory _certificateType)
        external view returns (bool exists, bool isVerified, string memory issuer, uint256 issueDate, uint256 expiryDate);
}

contract ProgressValidation {
    struct Progress {
        uint256 tenderId;
        string description;
        string evidenceHash;
        uint256 completionPercentage;
        uint256 timestamp;
        address contractor;
        ProgressStatus status;
        uint256 validationCount;
        uint256 requiredValidations;
        mapping(address => Validation) validations;
        address[] validators;
    }

    struct Validation {
        bool hasValidated;
        bool approved;
        string comments;
        string evidenceHash;
        uint256 timestamp;
    }

    struct Validator {
        bool isActive;
        uint256 validationCount;
        uint256 reputation;
        uint256 lastAssignedTime;
    }

    enum ProgressStatus { Pending, InValidation, Approved, Rejected, Disputed }

    mapping(uint256 => mapping(uint256 => Progress)) public progressReports; // tenderId => progressId => Progress
    mapping(uint256 => uint256) public progressCounter; // tenderId => count
    mapping(address => Validator) public validators;
    mapping(uint256 => address[]) public tenderValidators; // tenderId => validators

    address public owner;
    ICredentialVerification public credentialVerification;
    uint256 public minValidationsRequired;
    uint256 public validatorCooldown;

    event ProgressSubmitted(uint256 indexed tenderId, uint256 progressId, address contractor);
    event ValidatorAssigned(uint256 indexed tenderId, uint256 progressId, address validator);
    event ProgressValidated(uint256 indexed tenderId, uint256 progressId, address validator, bool approved);
    event ProgressStatusUpdated(uint256 indexed tenderId, uint256 progressId, ProgressStatus status);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyValidator() {
        require(validators[msg.sender].isActive, "Only active validators can call this function");
        _;
    }

    constructor(address _credentialVerification, uint256 _minValidations, uint256 _validatorCooldown) {
        owner = msg.sender;
        credentialVerification = ICredentialVerification(_credentialVerification);
        minValidationsRequired = _minValidations;
        validatorCooldown = _validatorCooldown;
    }

    function submitProgress(
        uint256 _tenderId,
        string memory _description,
        string memory _evidenceHash,
        uint256 _completionPercentage
    ) public {
        require(_completionPercentage <= 100, "Invalid completion percentage");
        
        uint256 progressId = progressCounter[_tenderId];
        Progress storage progress = progressReports[_tenderId][progressId];
        
        progress.tenderId = _tenderId;
        progress.description = _description;
        progress.evidenceHash = _evidenceHash;
        progress.completionPercentage = _completionPercentage;
        progress.timestamp = block.timestamp;
        progress.contractor = msg.sender;
        progress.status = ProgressStatus.Pending;
        progress.requiredValidations = minValidationsRequired;
        
        progressCounter[_tenderId]++;
        
        // Assign validators
        assignValidators(_tenderId, progressId);
        
        emit ProgressSubmitted(_tenderId, progressId, msg.sender);
    }

    function assignValidators(uint256 _tenderId, uint256 _progressId) internal {
        Progress storage progress = progressReports[_tenderId][_progressId];
        address[] storage availableValidators = tenderValidators[_tenderId];
        
        uint256 assigned = 0;
        uint256 index = 0;
        
        while (assigned < minValidationsRequired && index < availableValidators.length) {
            address validator = availableValidators[index];
            if (isValidatorEligible(validator)) {
                progress.validators.push(validator);
                validators[validator].lastAssignedTime = block.timestamp;
                assigned++;
                emit ValidatorAssigned(_tenderId, _progressId, validator);
            }
            index++;
        }
        
        if (assigned > 0) {
            progress.status = ProgressStatus.InValidation;
            emit ProgressStatusUpdated(_tenderId, _progressId, ProgressStatus.InValidation);
        }
    }

    function validateProgress(
        uint256 _tenderId,
        uint256 _progressId,
        bool _approved,
        string memory _comments,
        string memory _evidenceHash
    ) public onlyValidator {
        Progress storage progress = progressReports[_tenderId][_progressId];
        require(progress.status == ProgressStatus.InValidation, "Progress not in validation state");
        require(!progress.validations[msg.sender].hasValidated, "Already validated");
        require(isAssignedValidator(_tenderId, _progressId, msg.sender), "Not assigned as validator");

        progress.validations[msg.sender] = Validation({
            hasValidated: true,
            approved: _approved,
            comments: _comments,
            evidenceHash: _evidenceHash,
            timestamp: block.timestamp
        });

        progress.validationCount++;
        validators[msg.sender].validationCount++;

        emit ProgressValidated(_tenderId, _progressId, msg.sender, _approved);

        // Check if enough validations received
        if (progress.validationCount >= progress.requiredValidations) {
            updateProgressStatus(_tenderId, _progressId);
        }
    }

    function updateProgressStatus(uint256 _tenderId, uint256 _progressId) internal {
        Progress storage progress = progressReports[_tenderId][_progressId];
        uint256 approvalCount = 0;

        for (uint256 i = 0; i < progress.validators.length; i++) {
            address validator = progress.validators[i];
            if (progress.validations[validator].hasValidated && 
                progress.validations[validator].approved) {
                approvalCount++;
            }
        }

        // Calculate approval threshold (e.g., 2/3 majority)
        if (approvalCount * 3 >= progress.validationCount * 2) {
            progress.status = ProgressStatus.Approved;
        } else {
            progress.status = ProgressStatus.Rejected;
        }

        emit ProgressStatusUpdated(_tenderId, _progressId, progress.status);
    }

    function addValidator(address _validator) public onlyOwner {
        require(!validators[_validator].isActive, "Validator already exists");
        validators[_validator] = Validator({
            isActive: true,
            validationCount: 0,
            reputation: 100,
            lastAssignedTime: 0
        });
        emit ValidatorAdded(_validator);
    }

    function removeValidator(address _validator) public onlyOwner {
        require(validators[_validator].isActive, "Validator not active");
        validators[_validator].isActive = false;
        emit ValidatorRemoved(_validator);
    }

    function isProgressValidated(uint256 _tenderId, uint256 _progressId) public view returns (bool) {
        return progressReports[_tenderId][_progressId].status == ProgressStatus.Approved;
    }

    function getProgressDetails(uint256 _tenderId, uint256 _progressId) public view returns (
        string memory description,
        uint256 completionPercentage,
        uint256 timestamp,
        address contractor,
        ProgressStatus status,
        uint256 validationCount,
        address[] memory validatorList
    ) {
        Progress storage progress = progressReports[_tenderId][_progressId];
        return (
            progress.description,
            progress.completionPercentage,
            progress.timestamp,
            progress.contractor,
            progress.status,
            progress.validationCount,
            progress.validators
        );
    }

    function isValidatorEligible(address _validator) internal view returns (bool) {
        return validators[_validator].isActive &&
               block.timestamp >= validators[_validator].lastAssignedTime + validatorCooldown;
    }

    function isAssignedValidator(uint256 _tenderId, uint256 _progressId, address _validator) internal view returns (bool) {
        address[] storage progressValidators = progressReports[_tenderId][_progressId].validators;
        for (uint256 i = 0; i < progressValidators.length; i++) {
            if (progressValidators[i] == _validator) {
                return true;
            }
        }
        return false;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IProgressValidation {
    function getProgressDetails(uint256 _tenderId, uint256 _progressId) external view returns (
        string memory description,
        uint256 completionPercentage,
        uint256 timestamp,
        address contractor,
        uint8 status,
        uint256 validationCount,
        address[] memory validators
    );
}

contract DisputeResolution {
    struct Dispute {
        uint256 tenderId;
        uint256 progressId;
        address initiator;
        string reason;
        string evidenceHash;
        DisputeStatus status;
        uint256 timestamp;
        uint256 resolutionTime;
        address resolver;
        string resolution;
        mapping(address => bool) supervisorVotes;
        uint256 supervisorVoteCount;
        bool isClosed;
    }

    struct Supervisor {
        bool isActive;
        uint256 resolutionCount;
        string department;
    }

    enum DisputeStatus { Pending, UnderReview, Resolved, Escalated }

    mapping(uint256 => mapping(uint256 => Dispute)) public disputes; // tenderId => progressId => Dispute
    mapping(address => Supervisor) public supervisors;
    mapping(uint256 => uint256) public disputeCounter; // tenderId => count

    address public owner;
    IProgressValidation public progressValidation;
    uint256 public minSupervisorVotes;
    uint256 public resolutionTimeLimit;

    event DisputeRaised(uint256 indexed tenderId, uint256 progressId, address initiator);
    event SupervisorAssigned(uint256 indexed tenderId, uint256 progressId, address supervisor);
    event DisputeResolved(uint256 indexed tenderId, uint256 progressId, DisputeStatus status);
    event SupervisorVoted(uint256 indexed tenderId, uint256 progressId, address supervisor);
    event DisputeEscalated(uint256 indexed tenderId, uint256 progressId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlySupervisor() {
        require(supervisors[msg.sender].isActive, "Only active supervisors can call this function");
        _;
    }

    constructor(
        address _progressValidation,
        uint256 _minSupervisorVotes,
        uint256 _resolutionTimeLimit
    ) {
        owner = msg.sender;
        progressValidation = IProgressValidation(_progressValidation);
        minSupervisorVotes = _minSupervisorVotes;
        resolutionTimeLimit = _resolutionTimeLimit;
    }

    function raiseDispute(
        uint256 _tenderId,
        uint256 _progressId,
        string memory _reason,
        string memory _evidenceHash
    ) public {
        require(bytes(_reason).length > 0, "Reason cannot be empty");
        require(bytes(_evidenceHash).length > 0, "Evidence hash cannot be empty");

        Dispute storage dispute = disputes[_tenderId][_progressId];
        require(!dispute.isClosed, "Dispute already exists and is closed");

        dispute.tenderId = _tenderId;
        dispute.progressId = _progressId;
        dispute.initiator = msg.sender;
        dispute.reason = _reason;
        dispute.evidenceHash = _evidenceHash;
        dispute.status = DisputeStatus.Pending;
        dispute.timestamp = block.timestamp;
        dispute.supervisorVoteCount = 0;
        dispute.isClosed = false;

        disputeCounter[_tenderId]++;

        emit DisputeRaised(_tenderId, _progressId, msg.sender);
    }

    function assignSupervisor(uint256 _tenderId, uint256 _progressId, address _supervisor) public onlyOwner {
        require(supervisors[_supervisor].isActive, "Invalid supervisor");
        
        Dispute storage dispute = disputes[_tenderId][_progressId];
        require(dispute.status == DisputeStatus.Pending, "Dispute not in pending state");

        dispute.status = DisputeStatus.UnderReview;
        emit SupervisorAssigned(_tenderId, _progressId, _supervisor);
    }

    function voteSupervisor(
        uint256 _tenderId,
        uint256 _progressId,
        bool _approved,
        string memory _comments
    ) public onlySupervisor {
        Dispute storage dispute = disputes[_tenderId][_progressId];
        require(dispute.status == DisputeStatus.UnderReview, "Dispute not under review");
        require(!dispute.supervisorVotes[msg.sender], "Already voted");

        dispute.supervisorVotes[msg.sender] = _approved;
        dispute.supervisorVoteCount++;

        emit SupervisorVoted(_tenderId, _progressId, msg.sender);

        if (dispute.supervisorVoteCount >= minSupervisorVotes) {
            finalizeDispute(_tenderId, _progressId, _comments);
        }
    }

    function finalizeDispute(
        uint256 _tenderId,
        uint256 _progressId,
        string memory _resolution
    ) internal {
        Dispute storage dispute = disputes[_tenderId][_progressId];
        uint256 approvalCount = 0;

        // Count supervisor approvals
        address[] memory activeSupervisors = getActiveSupervisors();
        for (uint256 i = 0; i < activeSupervisors.length; i++) {
            if (dispute.supervisorVotes[activeSupervisors[i]]) {
                approvalCount++;
            }
        }

        // Determine resolution based on majority vote
        if (approvalCount * 2 > dispute.supervisorVoteCount) {
            dispute.status = DisputeStatus.Resolved;
        } else {
            dispute.status = DisputeStatus.Escalated;
            emit DisputeEscalated(_tenderId, _progressId);
        }

        dispute.resolution = _resolution;
        dispute.resolutionTime = block.timestamp;
        dispute.isClosed = true;

        emit DisputeResolved(_tenderId, _progressId, dispute.status);
    }

    function addSupervisor(address _supervisor, string memory _department) public onlyOwner {
        require(!supervisors[_supervisor].isActive, "Supervisor already exists");
        
        supervisors[_supervisor] = Supervisor({
            isActive: true,
            resolutionCount: 0,
            department: _department
        });
    }

    function removeSupervisor(address _supervisor) public onlyOwner {
        require(supervisors[_supervisor].isActive, "Supervisor not active");
        supervisors[_supervisor].isActive = false;
    }

    function getDisputeDetails(uint256 _tenderId, uint256 _progressId) public view returns (
        address initiator,
        string memory reason,
        DisputeStatus status,
        uint256 timestamp,
        uint256 resolutionTime,
        string memory resolution,
        uint256 supervisorVoteCount,
        bool isClosed
    ) {
        Dispute storage dispute = disputes[_tenderId][_progressId];
        return (
            dispute.initiator,
            dispute.reason,
            dispute.status,
            dispute.timestamp,
            dispute.resolutionTime,
            dispute.resolution,
            dispute.supervisorVoteCount,
            dispute.isClosed
        );
    }

    function getActiveSupervisors() public view returns (address[] memory) {
        uint256 count = 0;
        address[] memory tempSupervisors = new address[](100); // Arbitrary limit

        // First pass: count active supervisors
        for (uint256 i = 0; i < tempSupervisors.length; i++) {
            if (supervisors[tempSupervisors[i]].isActive) {
                count++;
            }
        }

        // Second pass: create correctly sized array
        address[] memory activeSupervisors = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < tempSupervisors.length; i++) {
            if (supervisors[tempSupervisors[i]].isActive) {
                activeSupervisors[index] = tempSupervisors[i];
                index++;
            }
        }

        return activeSupervisors;
    }
}
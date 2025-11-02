// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IProgressValidation {
    function isProgressValidated(uint256 _tenderId, uint256 _progressId) external view returns (bool);
}

contract ProjectEscrow {
    struct Project {
        uint256 tenderId;
        address payable contractor;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 nextMilestoneAmount;
        bool isActive;
        mapping(uint256 => bool) milestonePaid; // progressId => paid status
    }

    struct Payment {
        uint256 tenderId;
        uint256 progressId;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        string paymentType; // milestone, labor, material
    }

    mapping(uint256 => Project) public projects;
    mapping(uint256 => Payment[]) public projectPayments;
    mapping(address => uint256[]) public contractorProjects;

    address public owner;
    IProgressValidation public progressValidation;
    uint256 public platformFee; // in basis points (1% = 100)

    event ProjectCreated(uint256 indexed tenderId, address contractor, uint256 amount);
    event PaymentReleased(uint256 indexed tenderId, address recipient, uint256 amount);
    event MilestonePaid(uint256 indexed tenderId, uint256 progressId, uint256 amount);
    event ProjectClosed(uint256 indexed tenderId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier projectExists(uint256 _tenderId) {
        require(projects[_tenderId].isActive, "Project does not exist or is inactive");
        _;
    }

    constructor(address _progressValidation, uint256 _platformFee) {
        owner = msg.sender;
        progressValidation = IProgressValidation(_progressValidation);
        platformFee = _platformFee;
    }

    function createProject(
        uint256 _tenderId,
        address payable _contractor,
        uint256 _totalAmount,
        uint256 _nextMilestoneAmount
    ) public payable onlyOwner {
        require(msg.value == _totalAmount, "Incorrect fund amount");
        require(_nextMilestoneAmount <= _totalAmount, "Milestone amount exceeds total");
        require(!projects[_tenderId].isActive, "Project already exists");

        Project storage project = projects[_tenderId];
        project.tenderId = _tenderId;
        project.contractor = _contractor;
        project.totalAmount = _totalAmount;
        project.releasedAmount = 0;
        project.nextMilestoneAmount = _nextMilestoneAmount;
        project.isActive = true;

        contractorProjects[_contractor].push(_tenderId);

        emit ProjectCreated(_tenderId, _contractor, _totalAmount);
    }

    function releaseMilestonePayment(
        uint256 _tenderId,
        uint256 _progressId
    ) public projectExists(_tenderId) {
        Project storage project = projects[_tenderId];
        require(!project.milestonePaid[_progressId], "Milestone already paid");
        require(
            progressValidation.isProgressValidated(_tenderId, _progressId),
            "Progress not validated"
        );

        uint256 paymentAmount = project.nextMilestoneAmount;
        require(paymentAmount <= address(this).balance, "Insufficient contract balance");

        // Calculate platform fee
        uint256 fee = (paymentAmount * platformFee) / 10000;
        uint256 contractorAmount = paymentAmount - fee;

        // Transfer payment
        project.contractor.transfer(contractorAmount);
        payable(owner).transfer(fee); // Platform fee to owner

        // Update project state
        project.releasedAmount += paymentAmount;
        project.milestonePaid[_progressId] = true;

        // Record payment
        projectPayments[_tenderId].push(Payment({
            tenderId: _tenderId,
            progressId: _progressId,
            recipient: project.contractor,
            amount: contractorAmount,
            timestamp: block.timestamp,
            paymentType: "milestone"
        }));

        emit MilestonePaid(_tenderId, _progressId, paymentAmount);

        // Check if project is complete
        if (project.releasedAmount >= project.totalAmount) {
            project.isActive = false;
            emit ProjectClosed(_tenderId);
        }
    }

    function releasePayment(
        uint256 _tenderId,
        address payable _recipient,
        uint256 _amount,
        string memory _paymentType
    ) public onlyOwner projectExists(_tenderId) {
        Project storage project = projects[_tenderId];
        require(_amount <= address(this).balance, "Insufficient contract balance");
        require(
            project.releasedAmount + _amount <= project.totalAmount,
            "Payment exceeds project budget"
        );

        // Transfer payment
        _recipient.transfer(_amount);
        project.releasedAmount += _amount;

        // Record payment
        projectPayments[_tenderId].push(Payment({
            tenderId: _tenderId,
            progressId: 0, // Not milestone-specific
            recipient: _recipient,
            amount: _amount,
            timestamp: block.timestamp,
            paymentType: _paymentType
        }));

        emit PaymentReleased(_tenderId, _recipient, _amount);
    }

    function getProjectPayments(uint256 _tenderId) public view returns (Payment[] memory) {
        return projectPayments[_tenderId];
    }

    function getContractorProjects(address _contractor) public view returns (uint256[] memory) {
        return contractorProjects[_contractor];
    }

    function getProjectBalance(uint256 _tenderId) public view returns (
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 remainingAmount
    ) {
        Project storage project = projects[_tenderId];
        return (
            project.totalAmount,
            project.releasedAmount,
            project.totalAmount - project.releasedAmount
        );
    }

    // Emergency fund recovery (only for inactive projects)
    function recoverFunds(uint256 _tenderId) public onlyOwner {
        Project storage project = projects[_tenderId];
        require(!project.isActive, "Project is still active");
        require(address(this).balance > 0, "No funds to recover");

        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
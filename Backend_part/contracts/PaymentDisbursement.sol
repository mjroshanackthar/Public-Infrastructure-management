// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ProgressValidation.sol";
import "./AuditLog.sol";

contract PaymentDisbursement is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant PAYMENT_MANAGER_ROLE = keccak256("PAYMENT_MANAGER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");

    struct Payment {
        uint256 id;
        address recipient;
        uint256 amount;
        PaymentType paymentType;
        PaymentStatus status;
        uint256 createdAt;
        uint256 processedAt;
        uint256 tenderId;
        uint256 milestoneId;
        string metadata;
        uint256 platformFee;
        address createdBy;
    }

    struct PaymentBatch {
        uint256 id;
        uint256[] paymentIds;
        PaymentStatus status;
        uint256 createdAt;
        uint256 processedAt;
        address createdBy;
        string metadata;
    }

    enum PaymentType {
        Milestone,
        Bonus,
        Refund,
        Other
    }

    enum PaymentStatus {
        Pending,
        Processing,
        Completed,
        Failed,
        Cancelled
    }

    mapping(uint256 => Payment) public payments;
    mapping(uint256 => PaymentBatch) public paymentBatches;
    mapping(address => uint256[]) public recipientPayments;
    mapping(uint256 => uint256[]) public tenderPayments;

    uint256 public paymentCount;
    uint256 public batchCount;
    uint256 public platformFeePercentage;
    uint256 public constant MAX_PLATFORM_FEE = 500; // 5%
    uint256 public constant MAX_BATCH_SIZE = 50;

    ProgressValidation public progressValidation;
    AuditLog public auditLog;

    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed recipient,
        uint256 amount,
        PaymentType paymentType
    );
    event PaymentProcessed(
        uint256 indexed paymentId,
        PaymentStatus status
    );
    event BatchCreated(
        uint256 indexed batchId,
        uint256 paymentCount
    );
    event BatchProcessed(
        uint256 indexed batchId,
        PaymentStatus status
    );
    event PlatformFeeUpdated(uint256 newFeePercentage);
    event PaymentMetadataAdded(
        uint256 indexed paymentId,
        string metadata
    );

    modifier onlyPaymentManager() {
        require(
            hasRole(PAYMENT_MANAGER_ROLE, msg.sender),
            "Caller is not a payment manager"
        );
        _;
    }

    modifier onlyFeeManager() {
        require(
            hasRole(FEE_MANAGER_ROLE, msg.sender),
            "Caller is not a fee manager"
        );
        _;
    }

    modifier validPayment(uint256 _paymentId) {
        require(_paymentId < paymentCount, "Payment does not exist");
        _;
    }

    modifier validBatch(uint256 _batchId) {
        require(_batchId < batchCount, "Batch does not exist");
        _;
    }

    constructor(
        address _progressValidationAddress,
        address _auditLogAddress,
        uint256 _initialFeePercentage
    ) {
        require(_progressValidationAddress != address(0), "Invalid progress validation address");
        require(_auditLogAddress != address(0), "Invalid audit log address");
        require(_initialFeePercentage <= MAX_PLATFORM_FEE, "Fee percentage too high");

        progressValidation = ProgressValidation(_progressValidationAddress);
        auditLog = AuditLog(_auditLogAddress);
        platformFeePercentage = _initialFeePercentage;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAYMENT_MANAGER_ROLE, msg.sender);
        _grantRole(FEE_MANAGER_ROLE, msg.sender);
    }

    function createPayment(
        address _recipient,
        uint256 _amount,
        PaymentType _paymentType,
        uint256 _tenderId,
        uint256 _milestoneId,
        string memory _metadata
    ) public onlyPaymentManager whenNotPaused nonReentrant returns (uint256) {
        require(_recipient != address(0), "Invalid recipient address");
        require(_amount > 0, "Amount must be greater than 0");
        require(bytes(_metadata).length > 0, "Metadata cannot be empty");

        if (_paymentType == PaymentType.Milestone) {
            require(
                progressValidation.isProgressValidated(_tenderId, _milestoneId),
                "Milestone not validated"
            );
        }

        uint256 fee = (_amount * platformFeePercentage) / 10000;
        uint256 paymentId = paymentCount++;

        Payment storage newPayment = payments[paymentId];
        newPayment.id = paymentId;
        newPayment.recipient = _recipient;
        newPayment.amount = _amount;
        newPayment.paymentType = _paymentType;
        newPayment.status = PaymentStatus.Pending;
        newPayment.createdAt = block.timestamp;
        newPayment.tenderId = _tenderId;
        newPayment.milestoneId = _milestoneId;
        newPayment.metadata = _metadata;
        newPayment.platformFee = fee;
        newPayment.createdBy = msg.sender;

        recipientPayments[_recipient].push(paymentId);
        if (_tenderId > 0) {
            tenderPayments[_tenderId].push(paymentId);
        }

        emit PaymentCreated(paymentId, _recipient, _amount, _paymentType);

        auditLog.addLog(
            msg.sender,
            "PAYMENT_CREATED",
            string(abi.encodePacked("Created payment for recipient: ", addressToString(_recipient))),
            AuditLog.LogCategory.Payments
        );

        return paymentId;
    }

    function createBatchPayment(
        address[] memory _recipients,
        uint256[] memory _amounts,
        PaymentType[] memory _paymentTypes,
        uint256[] memory _tenderIds,
        uint256[] memory _milestoneIds,
        string memory _metadata
    ) public onlyPaymentManager whenNotPaused nonReentrant returns (uint256) {
        require(_recipients.length > 0, "Empty recipients array");
        require(_recipients.length <= MAX_BATCH_SIZE, "Batch size too large");
        require(
            _recipients.length == _amounts.length &&
            _recipients.length == _paymentTypes.length &&
            _recipients.length == _tenderIds.length &&
            _recipients.length == _milestoneIds.length,
            "Array lengths mismatch"
        );
        require(bytes(_metadata).length > 0, "Metadata cannot be empty");

        uint256 batchId = batchCount++;
        PaymentBatch storage newBatch = paymentBatches[batchId];
        newBatch.id = batchId;
        newBatch.status = PaymentStatus.Pending;
        newBatch.createdAt = block.timestamp;
        newBatch.createdBy = msg.sender;
        newBatch.metadata = _metadata;

        for (uint256 i = 0; i < _recipients.length; i++) {
            uint256 paymentId = createPayment(
                _recipients[i],
                _amounts[i],
                _paymentTypes[i],
                _tenderIds[i],
                _milestoneIds[i],
                _metadata
            );
            newBatch.paymentIds.push(paymentId);
        }

        emit BatchCreated(batchId, _recipients.length);

        auditLog.addLog(
            msg.sender,
            "BATCH_PAYMENT_CREATED",
            string(abi.encodePacked("Created batch payment with ", uint256ToString(_recipients.length), " payments")),
            AuditLog.LogCategory.Payments
        );

        return batchId;
    }

    function processPayment(
        uint256 _paymentId
    ) public onlyPaymentManager validPayment(_paymentId) whenNotPaused nonReentrant {
        Payment storage payment = payments[_paymentId];

        require(
            payment.status == PaymentStatus.Pending,
            "Payment not in pending status"
        );

        payment.status = PaymentStatus.Processing;

        // Here you would integrate with your actual payment processing system
        // For now, we'll simulate successful processing
        bool success = true;

        if (success) {
            payment.status = PaymentStatus.Completed;
            payment.processedAt = block.timestamp;
        } else {
            payment.status = PaymentStatus.Failed;
        }

        emit PaymentProcessed(_paymentId, payment.status);

        auditLog.addLog(
            msg.sender,
            "PAYMENT_PROCESSED",
            string(abi.encodePacked("Processed payment for recipient: ", addressToString(payment.recipient))),
            AuditLog.LogCategory.Payments
        );
    }

    function processBatchPayment(
        uint256 _batchId
    ) public onlyPaymentManager validBatch(_batchId) whenNotPaused nonReentrant {
        PaymentBatch storage batch = paymentBatches[_batchId];

        require(
            batch.status == PaymentStatus.Pending,
            "Batch not in pending status"
        );

        batch.status = PaymentStatus.Processing;

        bool allSuccess = true;
        for (uint256 i = 0; i < batch.paymentIds.length; i++) {
            uint256 paymentId = batch.paymentIds[i];
            if (payments[paymentId].status == PaymentStatus.Pending) {
                processPayment(paymentId);
                if (payments[paymentId].status != PaymentStatus.Completed) {
                    allSuccess = false;
                }
            }
        }

        batch.status = allSuccess
            ? PaymentStatus.Completed
            : PaymentStatus.Failed;
        batch.processedAt = block.timestamp;

        emit BatchProcessed(_batchId, batch.status);

        auditLog.addLog(
            msg.sender,
            "BATCH_PAYMENT_PROCESSED",
            string(abi.encodePacked("Processed batch payment: ", uint256ToString(_batchId))),
            AuditLog.LogCategory.Payments
        );
    }

    function updatePlatformFee(
        uint256 _newFeePercentage
    ) public onlyFeeManager whenNotPaused {
        require(
            _newFeePercentage <= MAX_PLATFORM_FEE,
            "Fee percentage too high"
        );

        platformFeePercentage = _newFeePercentage;
        emit PlatformFeeUpdated(_newFeePercentage);

        auditLog.addLog(
            msg.sender,
            "PLATFORM_FEE_UPDATED",
            string(abi.encodePacked("Updated platform fee to: ", uint256ToString(_newFeePercentage))),
            AuditLog.LogCategory.Payments
        );
    }

    function addPaymentMetadata(
        uint256 _paymentId,
        string memory _metadata
    ) public onlyPaymentManager validPayment(_paymentId) whenNotPaused {
        require(bytes(_metadata).length > 0, "Metadata cannot be empty");

        payments[_paymentId].metadata = _metadata;
        emit PaymentMetadataAdded(_paymentId, _metadata);

        auditLog.addLog(
            msg.sender,
            "PAYMENT_METADATA_ADDED",
            string(abi.encodePacked("Added metadata to payment: ", uint256ToString(_paymentId))),
            AuditLog.LogCategory.Payments
        );
    }

    function getPaymentDetails(
        uint256 _paymentId
    )
        public
        view
        validPayment(_paymentId)
        returns (
            address recipient,
            uint256 amount,
            PaymentType paymentType,
            PaymentStatus status,
            uint256 createdAt,
            uint256 processedAt,
            uint256 tenderId,
            uint256 milestoneId,
            string memory metadata,
            uint256 platformFee
        )
    {
        Payment storage payment = payments[_paymentId];
        return (
            payment.recipient,
            payment.amount,
            payment.paymentType,
            payment.status,
            payment.createdAt,
            payment.processedAt,
            payment.tenderId,
            payment.milestoneId,
            payment.metadata,
            payment.platformFee
        );
    }

    function getBatchDetails(
        uint256 _batchId
    )
        public
        view
        validBatch(_batchId)
        returns (
            uint256[] memory paymentIds,
            PaymentStatus status,
            uint256 createdAt,
            uint256 processedAt,
            address createdBy,
            string memory metadata
        )
    {
        PaymentBatch storage batch = paymentBatches[_batchId];
        return (
            batch.paymentIds,
            batch.status,
            batch.createdAt,
            batch.processedAt,
            batch.createdBy,
            batch.metadata
        );
    }

    function getRecipientPayments(
        address _recipient
    ) public view returns (uint256[] memory) {
        return recipientPayments[_recipient];
    }

    function getTenderPayments(
        uint256 _tenderId
    ) public view returns (uint256[] memory) {
        return tenderPayments[_tenderId];
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function addressToString(
        address _addr
    ) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";

        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }

        return string(str);
    }

    function uint256ToString(
        uint256 _value
    ) internal pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }

        uint256 temp = _value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);

        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (_value % 10)));
            _value /= 10;
        }

        return string(buffer);
    }
}
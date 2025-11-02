// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TenderPayment is ReentrancyGuard, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Payment {
        uint256 tenderId;
        address contractor;
        uint256 amount;
        uint256 timestamp;
        address paidBy;
        string tenderTitle;
        bool completed;
    }

    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) public contractorPayments;
    uint256 public paymentCount;

    event PaymentMade(
        uint256 indexed paymentId,
        uint256 indexed tenderId,
        address indexed contractor,
        uint256 amount,
        address paidBy,
        string tenderTitle
    );

    event PaymentReceived(address indexed from, uint256 amount);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Allow contract to receive ETH
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    // Admin pays contractor for winning tender
    function payContractor(
        uint256 _tenderId,
        address payable _contractor,
        uint256 _amount,
        string memory _tenderTitle
    ) public payable onlyRole(ADMIN_ROLE) nonReentrant returns (uint256) {
        require(_contractor != address(0), "Invalid contractor address");
        require(_amount > 0, "Amount must be greater than 0");
        require(msg.value >= _amount, "Insufficient ETH sent");

        // Transfer ETH to contractor
        (bool success, ) = _contractor.call{value: _amount}("");
        require(success, "ETH transfer failed");

        // Record payment
        uint256 paymentId = paymentCount++;
        Payment storage newPayment = payments[paymentId];
        newPayment.tenderId = _tenderId;
        newPayment.contractor = _contractor;
        newPayment.amount = _amount;
        newPayment.timestamp = block.timestamp;
        newPayment.paidBy = msg.sender;
        newPayment.tenderTitle = _tenderTitle;
        newPayment.completed = true;

        contractorPayments[_contractor].push(paymentId);

        emit PaymentMade(
            paymentId,
            _tenderId,
            _contractor,
            _amount,
            msg.sender,
            _tenderTitle
        );

        // Refund excess ETH to admin
        if (msg.value > _amount) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - _amount}("");
            require(refundSuccess, "Refund failed");
        }

        return paymentId;
    }

    // Get payment details
    function getPayment(uint256 _paymentId) public view returns (
        uint256 tenderId,
        address contractor,
        uint256 amount,
        uint256 timestamp,
        address paidBy,
        string memory tenderTitle,
        bool completed
    ) {
        Payment storage payment = payments[_paymentId];
        return (
            payment.tenderId,
            payment.contractor,
            payment.amount,
            payment.timestamp,
            payment.paidBy,
            payment.tenderTitle,
            payment.completed
        );
    }

    // Get all payments for a contractor
    function getContractorPayments(address _contractor) public view returns (uint256[] memory) {
        return contractorPayments[_contractor];
    }

    // Get total payments received by contractor
    function getContractorTotalEarnings(address _contractor) public view returns (uint256) {
        uint256[] memory paymentIds = contractorPayments[_contractor];
        uint256 total = 0;
        
        for (uint256 i = 0; i < paymentIds.length; i++) {
            total += payments[paymentIds[i]].amount;
        }
        
        return total;
    }

    // Get all payments (for admin dashboard)
    function getAllPayments() public view returns (uint256) {
        return paymentCount;
    }

    // Grant admin role to address
    function grantAdminRole(address _admin) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, _admin);
    }

    // Revoke admin role from address
    function revokeAdminRole(address _admin) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, _admin);
    }

    // Get contract balance
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

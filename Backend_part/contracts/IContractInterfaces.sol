// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICredentialVerification {
    function isVerifiedContractor(address _contractor) external view returns (bool);
    function getContractorScore(address _contractor) external view returns (uint256);
    function isVerifiedValidator(address _validator) external view returns (bool);
    function isVerifiedSupervisor(address _supervisor) external view returns (bool);
}

interface IProgressValidation {
    function isProgressReportValidated(uint256 _reportId) external view returns (bool);
    function getValidationStatus(uint256 _reportId) external view returns (uint8);
    function getValidatorCount(uint256 _reportId) external view returns (uint256);
    function isValidatorAssigned(uint256 _reportId, address _validator) external view returns (bool);
}

interface IDisputeResolution {
    function hasActiveDispute(uint256 _tenderId) external view returns (bool);
    function getDisputeStatus(uint256 _disputeId) external view returns (uint8);
    function getDisputeSupervisors(uint256 _disputeId) external view returns (address[] memory);
}

interface ITenderManagement {
    function getTenderStatus(uint256 _tenderId) external view returns (uint8);
    function getSelectedContractor(uint256 _tenderId) external view returns (address);
    function getTenderBudget(uint256 _tenderId) external view returns (uint256);
}

interface IPaymentDisbursement {
    function getPaymentStatus(uint256 _paymentId) external view returns (uint8);
    function getTotalPaidAmount(uint256 _tenderId) external view returns (uint256);
    function getRecipientPayments(address _recipient) external view returns (uint256[] memory);
}

interface IAuditLog {
    function addLog(
        address _actor,
        string memory _eventType,
        string memory _details,
        uint8 _category
    ) external returns (uint256);
    
    function addLogMetadata(
        uint256 _logId,
        string memory _key,
        string memory _value
    ) external;
    
    function getLogMetadata(
        uint256 _logId,
        string memory _key
    ) external view returns (string memory);
}
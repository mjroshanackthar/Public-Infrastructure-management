// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AuditLog.sol";

contract PlatformUpgrade is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant UPGRADE_MANAGER_ROLE = keccak256("UPGRADE_MANAGER_ROLE");
    bytes32 public constant MIGRATION_MANAGER_ROLE = keccak256("MIGRATION_MANAGER_ROLE");

    struct ContractVersion {
        uint256 id;
        string name;
        string version;
        address implementation;
        address proxy;
        string metadata;
        bool active;
        uint256 createdAt;
        address createdBy;
    }

    struct MigrationPlan {
        uint256 id;
        string name;
        string description;
        mapping(address => address) contractAddresses; // old => new
        MigrationStatus status;
        bool emergency;
        uint256 createdAt;
        uint256 scheduledAt;
        uint256 executedAt;
        address createdBy;
        string metadata;
    }

    enum MigrationStatus {
        Planned,
        Scheduled,
        InProgress,
        Completed,
        Failed,
        Cancelled
    }

    uint256 public constant EMERGENCY_DELAY = 1 hours;
    uint256 public constant STANDARD_DELAY = 24 hours;
    uint256 public constant MAX_CONTRACTS_PER_MIGRATION = 10;

    mapping(uint256 => ContractVersion[]) public contractVersions; // contractId => versions
    mapping(uint256 => MigrationPlan) public migrationPlans;
    mapping(address => uint256) public contractIds; // implementation => contractId

    uint256 public contractCount;
    uint256 public migrationCount;

    ProxyAdmin public proxyAdmin;
    AuditLog public auditLog;

    event ProxyDeployed(
        uint256 indexed contractId,
        address implementation,
        address proxy,
        string version
    );
    event ProxyUpgraded(
        uint256 indexed contractId,
        address oldImplementation,
        address newImplementation,
        string version
    );
    event MigrationPlanCreated(
        uint256 indexed planId,
        string name,
        bool emergency
    );
    event ContractAddedToMigration(
        uint256 indexed planId,
        address oldContract,
        address newContract
    );
    event MigrationStatusUpdated(
        uint256 indexed planId,
        MigrationStatus status
    );

    modifier validMigrationPlan(uint256 _planId) {
        require(_planId < migrationCount, "Invalid migration plan");
        _;
    }

    modifier validContractId(uint256 _contractId) {
        require(_contractId < contractCount, "Invalid contract ID");
        _;
    }

    constructor(address _proxyAdmin, address _auditLogAddress) {
        require(_proxyAdmin != address(0), "Invalid proxy admin address");
        require(_auditLogAddress != address(0), "Invalid audit log address");

        proxyAdmin = ProxyAdmin(_proxyAdmin);
        auditLog = AuditLog(_auditLogAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADE_MANAGER_ROLE, msg.sender);
        _grantRole(MIGRATION_MANAGER_ROLE, msg.sender);
    }

    function deployProxy(
        string memory _name,
        string memory _version,
        address _implementation,
        bytes memory _data,
        string memory _metadata
    ) public onlyRole(UPGRADE_MANAGER_ROLE) whenNotPaused nonReentrant returns (address) {
        require(_implementation != address(0), "Invalid implementation address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_version).length > 0, "Version cannot be empty");

        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            _implementation,
            address(proxyAdmin),
            _data
        );

        uint256 contractId;
        if (contractIds[_implementation] == 0) {
            contractId = contractCount++;
            contractIds[_implementation] = contractId;
        } else {
            contractId = contractIds[_implementation];
        }

        ContractVersion memory version = ContractVersion({
            id: contractVersions[contractId].length,
            name: _name,
            version: _version,
            implementation: _implementation,
            proxy: address(proxy),
            metadata: _metadata,
            active: true,
            createdAt: block.timestamp,
            createdBy: msg.sender
        });

        contractVersions[contractId].push(version);

        emit ProxyDeployed(contractId, _implementation, address(proxy), _version);

        auditLog.addLog(
            msg.sender,
            "PROXY_DEPLOYED",
            string(abi.encodePacked("Deployed proxy for contract: ", _name, " version: ", _version)),
            AuditLog.LogCategory.System
        );

        return address(proxy);
    }

    function upgradeProxy(
        uint256 _contractId,
        address _newImplementation,
        string memory _version,
        string memory _metadata
    ) public onlyRole(UPGRADE_MANAGER_ROLE) validContractId(_contractId) whenNotPaused nonReentrant {
        require(_newImplementation != address(0), "Invalid implementation address");
        require(bytes(_version).length > 0, "Version cannot be empty");

        ContractVersion[] storage versions = contractVersions[_contractId];
        require(versions.length > 0, "No versions found");

        ContractVersion storage currentVersion = versions[versions.length - 1];
        require(currentVersion.active, "Current version is not active");

        address proxy = currentVersion.proxy;
        address oldImplementation = currentVersion.implementation;

        proxyAdmin.upgradeAndCall(ITransparentUpgradeableProxy(payable(proxy)), _newImplementation, "");

        currentVersion.active = false;

        ContractVersion memory newVersion = ContractVersion({
            id: versions.length,
            name: currentVersion.name,
            version: _version,
            implementation: _newImplementation,
            proxy: proxy,
            metadata: _metadata,
            active: true,
            createdAt: block.timestamp,
            createdBy: msg.sender
        });

        versions.push(newVersion);

        emit ProxyUpgraded(_contractId, oldImplementation, _newImplementation, _version);

        auditLog.addLog(
            msg.sender,
            "PROXY_UPGRADED",
            string(abi.encodePacked("Upgraded proxy for contract: ", currentVersion.name, " to version: ", _version)),
            AuditLog.LogCategory.System
        );
    }

    function createMigrationPlan(
        string memory _name,
        string memory _description,
        bool _emergency,
        string memory _metadata
    ) public onlyRole(MIGRATION_MANAGER_ROLE) whenNotPaused returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        uint256 planId = migrationCount++;
        MigrationPlan storage plan = migrationPlans[planId];

        plan.id = planId;
        plan.name = _name;
        plan.description = _description;
        plan.status = MigrationStatus.Planned;
        plan.emergency = _emergency;
        plan.createdAt = block.timestamp;
        plan.createdBy = msg.sender;
        plan.metadata = _metadata;

        uint256 delay = _emergency ? EMERGENCY_DELAY : STANDARD_DELAY;
        plan.scheduledAt = block.timestamp + delay;

        emit MigrationPlanCreated(planId, _name, _emergency);

        auditLog.addLog(
            msg.sender,
            "MIGRATION_PLAN_CREATED",
            string(abi.encodePacked("Created migration plan: ", _name)),
            AuditLog.LogCategory.System
        );

        return planId;
    }

    function addContractToMigration(
        uint256 _planId,
        address _oldContract,
        address _newContract
    ) public onlyRole(MIGRATION_MANAGER_ROLE) validMigrationPlan(_planId) whenNotPaused {
        require(_oldContract != address(0), "Invalid old contract address");
        require(_newContract != address(0), "Invalid new contract address");

        MigrationPlan storage plan = migrationPlans[_planId];

        require(
            plan.status == MigrationStatus.Planned,
            "Migration plan not in planned status"
        );

        plan.contractAddresses[_oldContract] = _newContract;

        emit ContractAddedToMigration(_planId, _oldContract, _newContract);

        auditLog.addLog(
            msg.sender,
            "CONTRACT_ADDED_TO_MIGRATION",
            string(abi.encodePacked("Added contract to migration plan: ", plan.name)),
            AuditLog.LogCategory.System
        );
    }

    function updateMigrationStatus(
        uint256 _planId,
        MigrationStatus _status
    ) public onlyRole(MIGRATION_MANAGER_ROLE) validMigrationPlan(_planId) whenNotPaused {
        MigrationPlan storage plan = migrationPlans[_planId];

        require(
            _status != MigrationStatus.Planned,
            "Cannot set status to Planned"
        );

        require(
            _isValidStatusTransition(plan.status, _status),
            "Invalid status transition"
        );

        if (_status == MigrationStatus.InProgress) {
            require(
                block.timestamp >= plan.scheduledAt,
                "Migration not ready to start"
            );
        }

        plan.status = _status;
        if (_status == MigrationStatus.Completed || _status == MigrationStatus.Failed) {
            plan.executedAt = block.timestamp;
        }

        emit MigrationStatusUpdated(_planId, _status);

        auditLog.addLog(
            msg.sender,
            "MIGRATION_STATUS_UPDATED",
            string(abi.encodePacked("Updated migration plan status: ", plan.name)),
            AuditLog.LogCategory.System
        );
    }

    function executeMigration(
        uint256 _planId
    ) public onlyRole(MIGRATION_MANAGER_ROLE) validMigrationPlan(_planId) whenNotPaused nonReentrant {
        MigrationPlan storage plan = migrationPlans[_planId];

        require(
            plan.status == MigrationStatus.InProgress,
            "Migration not in progress"
        );

        require(
            block.timestamp >= plan.scheduledAt,
            "Migration not ready to execute"
        );

        // Execute migration logic here
        // This would involve updating contract references and performing necessary data migrations
        // The actual implementation would depend on your specific migration requirements

        plan.status = MigrationStatus.Completed;
        plan.executedAt = block.timestamp;

        emit MigrationStatusUpdated(_planId, MigrationStatus.Completed);

        auditLog.addLog(
            msg.sender,
            "MIGRATION_EXECUTED",
            string(abi.encodePacked("Executed migration plan: ", plan.name)),
            AuditLog.LogCategory.System
        );
    }

    function getContractVersions(
        uint256 _contractId
    ) public view validContractId(_contractId) returns (ContractVersion[] memory) {
        return contractVersions[_contractId];
    }

    function getLatestVersion(
        uint256 _contractId
    ) public view validContractId(_contractId) returns (ContractVersion memory) {
        ContractVersion[] storage versions = contractVersions[_contractId];
        require(versions.length > 0, "No versions found");
        return versions[versions.length - 1];
    }

    function getMigrationPlanInfo(
        uint256 _planId
    )
        public
        view
        validMigrationPlan(_planId)
        returns (
            string memory name,
            string memory description,
            MigrationStatus status,
            bool emergency,
            uint256 createdAt,
            uint256 scheduledAt,
            uint256 executedAt,
            address createdBy,
            string memory metadata
        )
    {
        MigrationPlan storage plan = migrationPlans[_planId];
        return (
            plan.name,
            plan.description,
            plan.status,
            plan.emergency,
            plan.createdAt,
            plan.scheduledAt,
            plan.executedAt,
            plan.createdBy,
            plan.metadata
        );
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _isValidStatusTransition(
        MigrationStatus _current,
        MigrationStatus _next
    ) internal pure returns (bool) {
        if (_current == MigrationStatus.Planned) {
            return _next == MigrationStatus.Scheduled || _next == MigrationStatus.Cancelled;
        }
        if (_current == MigrationStatus.Scheduled) {
            return _next == MigrationStatus.InProgress || _next == MigrationStatus.Cancelled;
        }
        if (_current == MigrationStatus.InProgress) {
            return _next == MigrationStatus.Completed || _next == MigrationStatus.Failed;
        }
        return false;
    }
}
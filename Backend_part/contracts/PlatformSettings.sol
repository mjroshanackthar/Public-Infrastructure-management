// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PlatformSettings {
    struct Role {
        bool exists;
        string name;
        string description;
        mapping(address => bool) members;
        mapping(bytes32 => bool) permissions;
    }

    struct Setting {
        string name;
        string description;
        string dataType;
        bytes value;
        bool isPublic;
        bool isActive;
        uint256 lastUpdated;
    }

    mapping(bytes32 => Role) public roles;
    mapping(bytes32 => Setting) public settings;
    mapping(address => bool) public administrators;
    
    bytes32[] public roleKeys;
    bytes32[] public settingKeys;
    
    address public owner;
    bool public paused;

    event RoleCreated(bytes32 indexed roleId, string name);
    event RoleMemberAdded(bytes32 indexed roleId, address indexed member);
    event RoleMemberRemoved(bytes32 indexed roleId, address indexed member);
    event RolePermissionGranted(bytes32 indexed roleId, bytes32 indexed permission);
    event RolePermissionRevoked(bytes32 indexed roleId, bytes32 indexed permission);
    event SettingCreated(bytes32 indexed settingId, string name);
    event SettingUpdated(bytes32 indexed settingId, bytes value);
    event AdministratorAdded(address indexed admin);
    event AdministratorRemoved(address indexed admin);
    event PlatformPaused(address indexed by);
    event PlatformUnpaused(address indexed by);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAdmin() {
        require(administrators[msg.sender], "Only admin can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Platform is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        administrators[msg.sender] = true;
        emit AdministratorAdded(msg.sender);
    }

    // Role Management Functions
    function createRole(
        bytes32 _roleId,
        string memory _name,
        string memory _description
    ) public onlyAdmin {
        require(!roles[_roleId].exists, "Role already exists");

        Role storage newRole = roles[_roleId];
        newRole.exists = true;
        newRole.name = _name;
        newRole.description = _description;

        roleKeys.push(_roleId);
        emit RoleCreated(_roleId, _name);
    }

    function addRoleMember(bytes32 _roleId, address _member) public onlyAdmin {
        require(roles[_roleId].exists, "Role does not exist");
        require(!roles[_roleId].members[_member], "Member already has role");

        roles[_roleId].members[_member] = true;
        emit RoleMemberAdded(_roleId, _member);
    }

    function removeRoleMember(bytes32 _roleId, address _member) public onlyAdmin {
        require(roles[_roleId].exists, "Role does not exist");
        require(roles[_roleId].members[_member], "Member does not have role");

        roles[_roleId].members[_member] = false;
        emit RoleMemberRemoved(_roleId, _member);
    }

    function grantRolePermission(bytes32 _roleId, bytes32 _permission) public onlyAdmin {
        require(roles[_roleId].exists, "Role does not exist");
        require(!roles[_roleId].permissions[_permission], "Permission already granted");

        roles[_roleId].permissions[_permission] = true;
        emit RolePermissionGranted(_roleId, _permission);
    }

    function revokeRolePermission(bytes32 _roleId, bytes32 _permission) public onlyAdmin {
        require(roles[_roleId].exists, "Role does not exist");
        require(roles[_roleId].permissions[_permission], "Permission not granted");

        roles[_roleId].permissions[_permission] = false;
        emit RolePermissionRevoked(_roleId, _permission);
    }

    // Setting Management Functions
    function createSetting(
        bytes32 _settingId,
        string memory _name,
        string memory _description,
        string memory _dataType,
        bytes memory _initialValue,
        bool _isPublic
    ) public onlyAdmin {
        require(!settings[_settingId].isActive, "Setting already exists");

        Setting storage newSetting = settings[_settingId];
        newSetting.name = _name;
        newSetting.description = _description;
        newSetting.dataType = _dataType;
        newSetting.value = _initialValue;
        newSetting.isPublic = _isPublic;
        newSetting.isActive = true;
        newSetting.lastUpdated = block.timestamp;

        settingKeys.push(_settingId);
        emit SettingCreated(_settingId, _name);
    }

    function updateSetting(bytes32 _settingId, bytes memory _value) public onlyAdmin {
        require(settings[_settingId].isActive, "Setting does not exist");

        settings[_settingId].value = _value;
        settings[_settingId].lastUpdated = block.timestamp;
        emit SettingUpdated(_settingId, _value);
    }

    // Administrator Management Functions
    function addAdministrator(address _admin) public onlyOwner {
        require(!administrators[_admin], "Already an administrator");
        administrators[_admin] = true;
        emit AdministratorAdded(_admin);
    }

    function removeAdministrator(address _admin) public onlyOwner {
        require(_admin != owner, "Cannot remove owner");
        require(administrators[_admin], "Not an administrator");
        administrators[_admin] = false;
        emit AdministratorRemoved(_admin);
    }

    // Platform Control Functions
    function pausePlatform() public onlyAdmin whenNotPaused {
        paused = true;
        emit PlatformPaused(msg.sender);
    }

    function unpausePlatform() public onlyAdmin {
        require(paused, "Platform not paused");
        paused = false;
        emit PlatformUnpaused(msg.sender);
    }

    // View Functions
    function hasRole(bytes32 _roleId, address _member) public view returns (bool) {
        return roles[_roleId].exists && roles[_roleId].members[_member];
    }

    function hasPermission(bytes32 _roleId, bytes32 _permission) public view returns (bool) {
        return roles[_roleId].exists && roles[_roleId].permissions[_permission];
    }

    function getRoleInfo(bytes32 _roleId)
        public
        view
        returns (
            bool exists,
            string memory name,
            string memory description
        )
    {
        Role storage role = roles[_roleId];
        return (role.exists, role.name, role.description);
    }

    function getSettingValue(bytes32 _settingId) public view returns (bytes memory) {
        require(
            settings[_settingId].isActive &&
                (settings[_settingId].isPublic || administrators[msg.sender]),
            "Setting not accessible"
        );
        return settings[_settingId].value;
    }

    function getSettingInfo(bytes32 _settingId)
        public
        view
        returns (
            string memory name,
            string memory description,
            string memory dataType,
            bool isPublic,
            bool isActive,
            uint256 lastUpdated
        )
    {
        Setting storage setting = settings[_settingId];
        return (
            setting.name,
            setting.description,
            setting.dataType,
            setting.isPublic,
            setting.isActive,
            setting.lastUpdated
        );
    }

    function getAllRoleKeys() public view returns (bytes32[] memory) {
        return roleKeys;
    }

    function getAllSettingKeys() public view returns (bytes32[] memory) {
        return settingKeys;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        owner = _newOwner;
    }
}
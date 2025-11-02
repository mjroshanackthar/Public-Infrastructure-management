// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AuditLog.sol";

contract PlatformToken is ERC20, ERC20Burnable, Pausable, ReentrancyGuard, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");
    bytes32 public constant BLACKLIST_MANAGER_ROLE = keccak256("BLACKLIST_MANAGER_ROLE");

    struct RewardScheme {
        uint256 id;
        string name;
        uint256 rewardAmount;
        uint256 cooldownPeriod;
        bool active;
        uint256 createdAt;
        address createdBy;
    }

    struct UserReward {
        uint256 totalRewards;
        mapping(uint256 => uint256) schemeLastClaim; // schemeId => lastClaimTimestamp
        bool blacklisted;
    }

    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant MIN_REWARD_COOLDOWN = 1 days;
    uint256 public constant MAX_REWARD_AMOUNT = 1000 * 10**18; // 1000 tokens

    mapping(uint256 => RewardScheme) public rewardSchemes;
    mapping(address => UserReward) public userRewards;
    uint256 public rewardSchemeCount;

    AuditLog public auditLog;

    event RewardSchemeMinted(
        uint256 indexed schemeId,
        string name,
        uint256 rewardAmount,
        uint256 cooldownPeriod
    );
    event RewardSchemeUpdated(
        uint256 indexed schemeId,
        string name,
        uint256 rewardAmount,
        uint256 cooldownPeriod,
        bool active
    );
    event RewardClaimed(
        address indexed user,
        uint256 indexed schemeId,
        uint256 amount
    );
    event UserBlacklistStatusUpdated(
        address indexed user,
        bool blacklisted
    );

    modifier notBlacklisted(address _user) {
        require(!userRewards[_user].blacklisted, "User is blacklisted");
        _;
    }

    modifier validRewardScheme(uint256 _schemeId) {
        require(_schemeId < rewardSchemeCount, "Invalid reward scheme");
        require(rewardSchemes[_schemeId].active, "Reward scheme is not active");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _auditLogAddress
    ) ERC20(_name, _symbol) {
        require(_auditLogAddress != address(0), "Invalid audit log address");

        auditLog = AuditLog(_auditLogAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);
        _grantRole(BLACKLIST_MANAGER_ROLE, msg.sender);
    }

    function mint(
        address _to,
        uint256 _amount
    ) public onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(_to != address(0), "Invalid address");
        require(_amount > 0, "Amount must be greater than 0");
        require(
            totalSupply() + _amount <= MAX_SUPPLY,
            "Would exceed max supply"
        );

        _mint(_to, _amount);

        auditLog.addLog(
            msg.sender,
            "TOKEN_MINTED",
            string(abi.encodePacked("Minted ", uint256ToString(_amount), " tokens to ", addressToString(_to))),
            AuditLog.LogCategory.System
        );
    }

    function createRewardScheme(
        string memory _name,
        uint256 _rewardAmount,
        uint256 _cooldownPeriod
    ) public onlyRole(REWARD_MANAGER_ROLE) whenNotPaused returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_rewardAmount > 0, "Reward amount must be greater than 0");
        require(
            _rewardAmount <= MAX_REWARD_AMOUNT,
            "Reward amount too high"
        );
        require(
            _cooldownPeriod >= MIN_REWARD_COOLDOWN,
            "Cooldown period too short"
        );

        uint256 schemeId = rewardSchemeCount++;
        RewardScheme storage scheme = rewardSchemes[schemeId];

        scheme.id = schemeId;
        scheme.name = _name;
        scheme.rewardAmount = _rewardAmount;
        scheme.cooldownPeriod = _cooldownPeriod;
        scheme.active = true;
        scheme.createdAt = block.timestamp;
        scheme.createdBy = msg.sender;

        emit RewardSchemeMinted(schemeId, _name, _rewardAmount, _cooldownPeriod);

        auditLog.addLog(
            msg.sender,
            "REWARD_SCHEME_CREATED",
            string(abi.encodePacked("Created reward scheme: ", _name)),
            AuditLog.LogCategory.System
        );

        return schemeId;
    }

    function updateRewardScheme(
        uint256 _schemeId,
        string memory _name,
        uint256 _rewardAmount,
        uint256 _cooldownPeriod,
        bool _active
    ) public onlyRole(REWARD_MANAGER_ROLE) whenNotPaused validRewardScheme(_schemeId) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_rewardAmount > 0, "Reward amount must be greater than 0");
        require(
            _rewardAmount <= MAX_REWARD_AMOUNT,
            "Reward amount too high"
        );
        require(
            _cooldownPeriod >= MIN_REWARD_COOLDOWN,
            "Cooldown period too short"
        );

        RewardScheme storage scheme = rewardSchemes[_schemeId];
        scheme.name = _name;
        scheme.rewardAmount = _rewardAmount;
        scheme.cooldownPeriod = _cooldownPeriod;
        scheme.active = _active;

        emit RewardSchemeUpdated(
            _schemeId,
            _name,
            _rewardAmount,
            _cooldownPeriod,
            _active
        );

        auditLog.addLog(
            msg.sender,
            "REWARD_SCHEME_UPDATED",
            string(abi.encodePacked("Updated reward scheme: ", _name)),
            AuditLog.LogCategory.System
        );
    }

    function claimReward(
        uint256 _schemeId
    ) public whenNotPaused nonReentrant notBlacklisted(msg.sender) validRewardScheme(_schemeId) {
        RewardScheme storage scheme = rewardSchemes[_schemeId];
        UserReward storage userReward = userRewards[msg.sender];

        require(
            block.timestamp >= userReward.schemeLastClaim[_schemeId] + scheme.cooldownPeriod,
            "Cooldown period not elapsed"
        );

        require(
            totalSupply() + scheme.rewardAmount <= MAX_SUPPLY,
            "Would exceed max supply"
        );

        userReward.schemeLastClaim[_schemeId] = block.timestamp;
        userReward.totalRewards += scheme.rewardAmount;

        _mint(msg.sender, scheme.rewardAmount);

        emit RewardClaimed(msg.sender, _schemeId, scheme.rewardAmount);

        auditLog.addLog(
            msg.sender,
            "REWARD_CLAIMED",
            string(abi.encodePacked("Claimed reward from scheme: ", scheme.name)),
            AuditLog.LogCategory.System
        );
    }

    function updateBlacklist(
        address _user,
        bool _blacklisted
    ) public onlyRole(BLACKLIST_MANAGER_ROLE) whenNotPaused {
        require(_user != address(0), "Invalid address");

        userRewards[_user].blacklisted = _blacklisted;
        emit UserBlacklistStatusUpdated(_user, _blacklisted);

        auditLog.addLog(
            msg.sender,
            "USER_BLACKLIST_UPDATED",
            string(abi.encodePacked(
                "Updated blacklist status for user: ",
                addressToString(_user),
                " to: ",
                _blacklisted ? "true" : "false"
            )),
            AuditLog.LogCategory.System
        );
    }

    function getUserRewardInfo(
        address _user
    ) public view returns (
        uint256 totalRewards,
        bool blacklisted
    ) {
        UserReward storage userReward = userRewards[_user];
        return (userReward.totalRewards, userReward.blacklisted);
    }

    function getRewardSchemeInfo(
        uint256 _schemeId
    ) public view validRewardScheme(_schemeId) returns (
        string memory name,
        uint256 rewardAmount,
        uint256 cooldownPeriod,
        bool active,
        uint256 createdAt,
        address createdBy
    ) {
        RewardScheme storage scheme = rewardSchemes[_schemeId];
        return (
            scheme.name,
            scheme.rewardAmount,
            scheme.cooldownPeriod,
            scheme.active,
            scheme.createdAt,
            scheme.createdBy
        );
    }

    function canClaimReward(
        address _user,
        uint256 _schemeId
    ) public view validRewardScheme(_schemeId) returns (bool) {
        if (userRewards[_user].blacklisted) {
            return false;
        }

        UserReward storage userReward = userRewards[_user];
        RewardScheme storage scheme = rewardSchemes[_schemeId];

        return block.timestamp >= userReward.schemeLastClaim[_schemeId] + scheme.cooldownPeriod;
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
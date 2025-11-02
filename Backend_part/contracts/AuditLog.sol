// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

contract AuditLog {
    struct LogEntry {
        uint256 timestamp;
        address actor;
        string eventType;
        string details;
        bytes32 transactionHash;
        LogCategory category;
        mapping(string => string) metadata;
        string[] metadataKeys;
    }

    enum LogCategory {
        UserManagement,
        TenderOperations,
        Bidding,
        Progress,
        Validation,
        Payments,
        Disputes,
        System
    }

    struct LogSummary {
        uint256 timestamp;
        address actor;
        string eventType;
        string details;
        bytes32 transactionHash;
        LogCategory category;
    }

    mapping(uint256 => LogEntry) public logs;
    uint256 public logCount;
    mapping(address => uint256[]) public userLogs;
    mapping(LogCategory => uint256[]) public categoryLogs;
    mapping(string => uint256[]) public eventTypeLogs;

    address public owner;
    mapping(address => bool) public authorizedLoggers;

    event LogAdded(
        uint256 indexed logId,
        address indexed actor,
        string eventType,
        LogCategory category
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedLoggers[msg.sender],
            "Not authorized to log events"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedLoggers[msg.sender] = true;
    }

    function addAuthorizedLogger(address _logger) public onlyOwner {
        authorizedLoggers[_logger] = true;
    }

    function removeAuthorizedLogger(address _logger) public onlyOwner {
        require(_logger != owner, "Cannot remove owner");
        authorizedLoggers[_logger] = false;
    }

    function addLog(
        address _actor,
        string memory _eventType,
        string memory _details,
        LogCategory _category
    ) public onlyAuthorized returns (uint256) {
        uint256 logId = logCount++;
        LogEntry storage newLog = logs[logId];

        newLog.timestamp = block.timestamp;
        newLog.actor = _actor;
        newLog.eventType = _eventType;
        newLog.details = _details;
        newLog.transactionHash = blockhash(block.number - 1);
        newLog.category = _category;

        // Index the log
        userLogs[_actor].push(logId);
        categoryLogs[_category].push(logId);
        eventTypeLogs[_eventType].push(logId);

        emit LogAdded(logId, _actor, _eventType, _category);
        return logId;
    }

    function addLogMetadata(
        uint256 _logId,
        string memory _key,
        string memory _value
    ) public onlyAuthorized {
        require(_logId < logCount, "Log does not exist");
        LogEntry storage log = logs[_logId];

        // Add new metadata key if it doesn't exist
        if (bytes(log.metadata[_key]).length == 0) {
            log.metadataKeys.push(_key);
        }

        log.metadata[_key] = _value;
    }

    function getLogMetadata(uint256 _logId, string memory _key)
        public
        view
        returns (string memory)
    {
        require(_logId < logCount, "Log does not exist");
        return logs[_logId].metadata[_key];
    }

    function getLogMetadataKeys(uint256 _logId)
        public
        view
        returns (string[] memory)
    {
        require(_logId < logCount, "Log does not exist");
        return logs[_logId].metadataKeys;
    }

    function getLogsByUser(address _user)
        public
        view
        returns (LogSummary[] memory)
    {
        uint256[] storage userLogIds = userLogs[_user];
        LogSummary[] memory summaries = new LogSummary[](userLogIds.length);

        for (uint256 i = 0; i < userLogIds.length; i++) {
            LogEntry storage log = logs[userLogIds[i]];
            summaries[i] = LogSummary({
                timestamp: log.timestamp,
                actor: log.actor,
                eventType: log.eventType,
                details: log.details,
                transactionHash: log.transactionHash,
                category: log.category
            });
        }

        return summaries;
    }

    function getLogsByCategory(LogCategory _category)
        public
        view
        returns (LogSummary[] memory)
    {
        uint256[] storage categoryLogIds = categoryLogs[_category];
        LogSummary[] memory summaries = new LogSummary[](categoryLogIds.length);

        for (uint256 i = 0; i < categoryLogIds.length; i++) {
            LogEntry storage log = logs[categoryLogIds[i]];
            summaries[i] = LogSummary({
                timestamp: log.timestamp,
                actor: log.actor,
                eventType: log.eventType,
                details: log.details,
                transactionHash: log.transactionHash,
                category: log.category
            });
        }

        return summaries;
    }

    function getLogsByEventType(string memory _eventType)
        public
        view
        returns (LogSummary[] memory)
    {
        uint256[] storage typeLogIds = eventTypeLogs[_eventType];
        LogSummary[] memory summaries = new LogSummary[](typeLogIds.length);

        for (uint256 i = 0; i < typeLogIds.length; i++) {
            LogEntry storage log = logs[typeLogIds[i]];
            summaries[i] = LogSummary({
                timestamp: log.timestamp,
                actor: log.actor,
                eventType: log.eventType,
                details: log.details,
                transactionHash: log.transactionHash,
                category: log.category
            });
        }

        return summaries;
    }

    function getLogSummary(uint256 _logId)
        public
        view
        returns (LogSummary memory)
    {
        require(_logId < logCount, "Log does not exist");
        LogEntry storage log = logs[_logId];

        return
            LogSummary({
                timestamp: log.timestamp,
                actor: log.actor,
                eventType: log.eventType,
                details: log.details,
                transactionHash: log.transactionHash,
                category: log.category
            });
    }

    function getLogCount() public view returns (uint256) {
        return logCount;
    }

    function isAuthorizedLogger(address _logger) public view returns (bool) {
        return authorizedLoggers[_logger];
    }
}
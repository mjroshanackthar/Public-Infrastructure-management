import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Shield, 
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Settings
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusCard from '../components/StatusCard';
import { systemAPI, debugAPI } from '../services/api';
import { ensureArray } from '../utils/errorHandler';

const SystemStatus = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [contractFunctions, setContractFunctions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [runningTest, setRunningTest] = useState(false);

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthResponse, blockchainResponse, contractsResponse] = await Promise.all([
        systemAPI.getHealth().catch(err => ({ data: null })),
        systemAPI.getBlockchainStatus().catch(err => ({ data: null })),
        systemAPI.getContracts().catch(err => ({ data: [] }))
      ]);

      setSystemHealth(healthResponse.data);
      setBlockchainStatus(blockchainResponse.data);
      
      // Ensure contracts is always an array using utility function
      setContracts(ensureArray(contractsResponse.data));

    } catch (err) {
      setError('Failed to load system status');
      console.error(err);
      // Ensure contracts is set to empty array on error
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadContractFunctions = async () => {
    try {
      const response = await systemAPI.getContractFunctions();
      setContractFunctions(response.data);
    } catch (err) {
      console.error('Failed to load contract functions:', err);
      alert('Failed to load contract functions');
    }
  };

  const testContractConnectivity = async () => {
    try {
      const response = await systemAPI.testContractConnectivity();
      alert('Contract connectivity test passed: ' + JSON.stringify(response.data, null, 2));
    } catch (err) {
      alert('Contract connectivity test failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const restartBlockchain = async () => {
    try {
      await systemAPI.restartBlockchain();
      alert('Blockchain connection restarted successfully');
      loadSystemStatus();
    } catch (err) {
      alert('Failed to restart blockchain: ' + (err.response?.data?.error || err.message));
    }
  };

  const runCompleteTest = async () => {
    try {
      setRunningTest(true);
      const response = await debugAPI.testCompleteFlow({
        userAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
      });
      setTestResults(response.data);
    } catch (err) {
      console.error('Complete test failed:', err);
      setTestResults({
        success: false,
        error: err.response?.data?.error || err.message
      });
    } finally {
      setRunningTest(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'OK' || status === true || status === 'active') {
      return <CheckCircle className="h-5 w-5 text-success-600" />;
    } else if (status === 'warning') {
      return <AlertTriangle className="h-5 w-5 text-warning-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-danger-600" />;
    }
  };

  const getStatusColor = (status) => {
    if (status === 'OK' || status === true || status === 'active') {
      return 'success';
    } else if (status === 'warning') {
      return 'warning';
    } else {
      return 'error';
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading system status..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600">Monitor platform health and performance</p>
        </div>
        <button
          onClick={loadSystemStatus}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard
          title="Server Health"
          status={getStatusColor(systemHealth?.status)}
          description={`API Server: ${systemHealth?.status || 'Unknown'}`}
          icon={Server}
        />
        <StatusCard
          title="Blockchain"
          status={getStatusColor(blockchainStatus?.connected)}
          description={`Network: ${blockchainStatus?.network || 'Unknown'}`}
          icon={Shield}
        />
        <StatusCard
          title="Contracts"
          status={Array.isArray(contracts) && contracts.length > 0 ? 'success' : 'error'}
          description={`${Array.isArray(contracts) ? contracts.length : 0} contracts loaded`}
          icon={Database}
        />
        <StatusCard
          title="System"
          status={systemHealth?.status === 'OK' && blockchainStatus?.connected ? 'success' : 'error'}
          description="Overall system status"
          icon={Activity}
        />
      </div>

      {/* Detailed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Server Status</h2>
          {systemHealth ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <div className="flex items-center">
                  {getStatusIcon(systemHealth.status)}
                  <span className="ml-2 text-sm font-medium">{systemHealth.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Timestamp</span>
                <span className="text-sm font-medium">{systemHealth.timestamp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium">
                  {systemHealth.uptime ? `${Math.floor(systemHealth.uptime / 3600)}h ${Math.floor((systemHealth.uptime % 3600) / 60)}m` : 'N/A'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No server data available</p>
          )}
        </div>

        {/* Blockchain Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Blockchain Status</h2>
          {blockchainStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection</span>
                <div className="flex items-center">
                  {getStatusIcon(blockchainStatus.connected)}
                  <span className="ml-2 text-sm font-medium">
                    {blockchainStatus.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Network</span>
                <span className="text-sm font-medium">{blockchainStatus.network}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Chain ID</span>
                <span className="text-sm font-medium">{blockchainStatus.chainId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Block Number</span>
                <span className="text-sm font-medium">{blockchainStatus.blockNumber}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No blockchain data available</p>
          )}
        </div>
      </div>

      {/* Smart Contracts */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Smart Contracts</h2>
          <button
            onClick={loadContractFunctions}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Load Functions
          </button>
        </div>
        
        {!Array.isArray(contracts) || contracts.length === 0 ? (
          <p className="text-gray-500">No contracts loaded</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts.map((contract, index) => (
              <div key={index} className="border border-gray-200 rounded p-4">
                <div className="flex items-center mb-2">
                  <Database className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="font-medium text-gray-900">{contract.name}</h3>
                </div>
                <p className="text-sm text-gray-600 font-mono mb-2">
                  {contract.address ? `${contract.address.slice(0, 10)}...` : 'No address'}
                </p>
                <div className="flex items-center">
                  {getStatusIcon(contract.loaded)}
                  <span className="ml-2 text-sm">
                    {contract.loaded ? 'Loaded' : 'Not Loaded'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {contractFunctions && (
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-medium text-gray-900 mb-2">Available Functions</h3>
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify(contractFunctions, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* System Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={testContractConnectivity}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-6 w-6 text-primary-600 mr-2" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Test Contracts</h3>
              <p className="text-sm text-gray-600">Verify contract connectivity</p>
            </div>
          </button>
          
          <button
            onClick={restartBlockchain}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-6 w-6 text-warning-600 mr-2" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Restart Blockchain</h3>
              <p className="text-sm text-gray-600">Reconnect to blockchain</p>
            </div>
          </button>
          
          <button
            onClick={runCompleteTest}
            disabled={runningTest}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Play className="h-6 w-6 text-success-600 mr-2" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900">
                {runningTest ? 'Running...' : 'Complete Test'}
              </h3>
              <p className="text-sm text-gray-600">Test entire system flow</p>
            </div>
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Test Results</h2>
          <div className={`p-4 rounded ${testResults.success ? 'bg-success-50 border border-success-200' : 'bg-danger-50 border border-danger-200'}`}>
            <div className="flex items-center mb-2">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-danger-600 mr-2" />
              )}
              <h3 className={`font-medium ${testResults.success ? 'text-success-800' : 'text-danger-800'}`}>
                {testResults.success ? 'Test Passed' : 'Test Failed'}
              </h3>
            </div>
            <pre className={`text-sm ${testResults.success ? 'text-success-700' : 'text-danger-700'} overflow-x-auto`}>
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Backend Components</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Node.js Express API Server</li>
              <li>• Hardhat Ethereum Development Environment</li>
              <li>• Smart Contract Integration Layer</li>
              <li>• Multi-signature Verification System</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Blockchain Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Immutable Tender Records</li>
              <li>• Decentralized Contractor Verification</li>
              <li>• Transparent Bidding Process</li>
              <li>• Automated Smart Contract Execution</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Security Measures</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Multi-verifier Credential System</li>
              <li>• Blockchain-based Audit Trail</li>
              <li>• Qualification Score Requirements</li>
              <li>• Automated Fraud Prevention</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Performance Benefits</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 10-15% Cost Reduction Through Competition</li>
              <li>• 50% Faster Contractor Verification</li>
              <li>• 100% Transparent Process</li>
              <li>• Zero Single Point of Failure</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
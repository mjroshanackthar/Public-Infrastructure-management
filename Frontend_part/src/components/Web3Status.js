import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  Wallet, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react';

const Web3Status = () => {
  const {
    account,
    chainId,
    isConnected,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchToLocalNetwork,
    formatAddress,
    isCorrectNetwork,
    web3Available
  } = useWeb3();

  // If Web3 is not available, show a simple message
  if (!web3Available) {
    return (
      <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md">
        <XCircle className="h-4 w-4 mr-2 text-gray-500" />
        <span className="text-sm text-gray-600">Web3 Not Available</span>
      </div>
    );
  }

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 31337: return 'Hardhat Local';
      default: return `Chain ${chainId}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md">
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center px-3 py-2 bg-danger-100 text-danger-700 rounded-md">
        <XCircle className="h-4 w-4 mr-2" />
        <span className="text-sm">Web3 Error</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
      >
        <Wallet className="h-4 w-4 mr-2" />
        <span className="text-sm">Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Network Status */}
      <div className={`flex items-center px-2 py-1 rounded text-xs ${
        isCorrectNetwork() 
          ? 'bg-success-100 text-success-700' 
          : 'bg-warning-100 text-warning-700'
      }`}>
        {isCorrectNetwork() ? (
          <CheckCircle className="h-3 w-3 mr-1" />
        ) : (
          <AlertTriangle className="h-3 w-3 mr-1" />
        )}
        <span>{getNetworkName(chainId)}</span>
      </div>

      {/* Account */}
      <div className="flex items-center px-2 py-1 bg-gray-100 rounded text-xs">
        <Wallet className="h-3 w-3 mr-1" />
        <span>{formatAddress(account)}</span>
      </div>

      {/* Switch Network Button */}
      {!isCorrectNetwork() && (
        <button
          onClick={switchToLocalNetwork}
          className="px-2 py-1 bg-warning-600 text-white rounded text-xs hover:bg-warning-700"
        >
          Switch to Local
        </button>
      )}

      {/* Disconnect Button */}
      <button
        onClick={disconnectWallet}
        className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
      >
        Disconnect
      </button>
    </div>
  );
};

export default Web3Status;
import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { hybridService } from '../services/api';

export const useWeb3Service = () => {
  const { contracts, signer, isConnected, web3Available } = useWeb3();
  const [web3Service, setWeb3Service] = useState(null);
  const [isWeb3Mode, setIsWeb3Mode] = useState(false);

  useEffect(() => {
    // For now, we'll keep Web3 mode disabled until dependencies are installed
    if (web3Available && isConnected && contracts && signer) {
      // Web3Service would be initialized here when dependencies are available
      setIsWeb3Mode(false); // Keep false for now
    } else {
      setWeb3Service(null);
      setIsWeb3Mode(false);
    }
  }, [isConnected, contracts, signer, web3Available]);

  const toggleMode = () => {
    if (!web3Available) {
      console.warn('Web3 dependencies not installed. Install with: npm install ethers @metamask/detect-provider');
      return false;
    }
    // For now, always return false to keep in API mode
    return false;
  };

  return {
    web3Service,
    hybridService,
    isWeb3Mode: false, // Always false until Web3 dependencies are installed
    toggleMode,
    canUseWeb3: false // Always false until Web3 dependencies are installed
  };
};
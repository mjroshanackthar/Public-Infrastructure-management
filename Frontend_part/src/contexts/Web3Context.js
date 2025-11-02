import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState('0');

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(accounts[0]);

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setChainId(network.chainId.toString());
      setBalance(ethers.formatEther(balance));
      setIsConnected(true);

      console.log('✅ Wallet Connected');
      console.log('Address:', accounts[0]);
      console.log('Chain ID:', network.chainId.toString());
      console.log('Balance:', ethers.formatEther(balance), 'ETH');

      // Check if on Hardhat network
      if (network.chainId.toString() !== '31337') {
        alert('⚠️ Please switch to Hardhat Local network (Chain ID: 31337)');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance('0');
    setIsConnected(false);
    console.log('🔌 Wallet Disconnected');
  };

  const switchToHardhat = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 in hex
      });
    } catch (error) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        await addHardhatNetwork();
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  };

  const addHardhatNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x7A69', // 31337 in hex
          chainName: 'Hardhat Local',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['http://127.0.0.1:8545'],
        }]
      });
    } catch (error) {
      console.error('Failed to add network:', error);
      alert('Failed to add Hardhat network: ' + error.message);
    }
  };

  const updateBalance = async () => {
    if (provider && account) {
      const balance = await provider.getBalance(account);
      setBalance(ethers.formatEther(balance));
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateBalance();
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <Web3Context.Provider value={{
      account,
      provider,
      signer,
      chainId,
      balance,
      isConnected,
      connectWallet,
      disconnectWallet,
      switchToHardhat,
      addHardhatNetwork,
      updateBalance
    }}>
      {children}
    </Web3Context.Provider>
  );
};

import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const ConnectWallet = () => {
  const { 
    account, 
    balance,
    isConnected, 
    connectWallet, 
    disconnectWallet, 
    chainId,
    switchToHardhat,
    addHardhatNetwork
  } = useWeb3();

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const isHardhatNetwork = chainId === '31337';

  const styles = {
    container: {
      padding: '15px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      transition: 'all 0.3s'
    },
    connectButton: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    disconnectButton: {
      backgroundColor: '#f44336',
      color: 'white',
      marginTop: '10px'
    },
    switchButton: {
      backgroundColor: '#FF9800',
      color: 'white',
      marginTop: '10px',
      marginRight: '10px'
    },
    addButton: {
      backgroundColor: '#2196F3',
      color: 'white',
      marginTop: '10px'
    },
    info: {
      marginBottom: '10px',
      fontSize: '14px'
    },
    warning: {
      color: '#FF9800',
      fontWeight: 'bold',
      marginBottom: '10px',
      padding: '10px',
      backgroundColor: '#FFF3E0',
      borderRadius: '5px'
    },
    success: {
      color: '#4CAF50',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    balance: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#2196F3',
      marginTop: '5px'
    }
  };

  if (!isConnected) {
    return (
      <div style={styles.container}>
        <div style={styles.info}>
          <strong>🦊 MetaMask Not Connected</strong>
        </div>
        <button 
          onClick={connectWallet}
          style={{...styles.button, ...styles.connectButton}}
        >
          Connect MetaMask Wallet
        </button>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Connect to enable blockchain features
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.success}>
        ✅ Wallet Connected
      </div>
      
      <div style={styles.info}>
        <strong>Address:</strong> {formatAddress(account)}
      </div>
      
      <div style={styles.balance}>
        💰 Balance: {parseFloat(balance).toFixed(4)} ETH
      </div>

      {!isHardhatNetwork ? (
        <>
          <div style={styles.warning}>
            ⚠️ Wrong Network! Please switch to Hardhat Local (Chain ID: 31337)
          </div>
          <button 
            onClick={switchToHardhat}
            style={{...styles.button, ...styles.switchButton}}
          >
            Switch to Hardhat
          </button>
          <button 
            onClick={addHardhatNetwork}
            style={{...styles.button, ...styles.addButton}}
          >
            Add Hardhat Network
          </button>
        </>
      ) : (
        <div style={{ ...styles.info, color: '#4CAF50', marginTop: '10px' }}>
          ✅ Connected to Hardhat Local Network
        </div>
      )}

      <button 
        onClick={disconnectWallet}
        style={{...styles.button, ...styles.disconnectButton}}
      >
        Disconnect Wallet
      </button>
    </div>
  );
};

export default ConnectWallet;

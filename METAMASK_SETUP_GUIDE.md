# MetaMask Setup Guide for Hardhat Local Blockchain

## Overview
This guide will help you connect MetaMask to your local Hardhat blockchain network and enable real ETH transfers and smart contract interactions.

## Prerequisites
- MetaMask browser extension installed
- Hardhat local blockchain running (`npx hardhat node`)
- Smart contracts deployed

---

## Step 1: Add Hardhat Network to MetaMask

### Method 1: Manual Configuration
1. Open MetaMask extension
2. Click the network dropdown (top center)
3. Click "Add Network" or "Add a network manually"
4. Enter the following details:

```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
Block Explorer URL: (leave empty)
```

5. Click "Save"

### Method 2: Automatic via Frontend
Add this button to your frontend to auto-add the network:

```javascript
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
  }
};
```

---

## Step 2: Import Test Accounts

Hardhat provides 20 test accounts, each with 10,000 ETH. Here are the first 5:

### Account #0 (Admin/Deployer)
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Account #1
```
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

### Account #2
```
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

### Account #3
```
Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
```

### Account #4
```
Address: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
```

### How to Import:
1. Open MetaMask
2. Click the account icon (top right)
3. Select "Import Account"
4. Paste the private key
5. Click "Import"

**Repeat for each account you want to use**

---

## Step 3: Connect Wallet to Frontend

### Update Your Frontend Code

#### 1. Install ethers.js (if not already installed)
```bash
cd Frontend_part
npm install ethers
```

#### 2. Create Web3 Context

Create `Frontend_part/src/contexts/Web3Context.js`:

```javascript
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

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setChainId(network.chainId.toString());
      setIsConnected(true);

      console.log('Connected to:', accounts[0]);
      console.log('Chain ID:', network.chainId.toString());
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
    setIsConnected(false);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
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
      isConnected,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </Web3Context.Provider>
  );
};
```

#### 3. Update App.js

Wrap your app with the Web3Provider:

```javascript
import { Web3Provider } from './contexts/Web3Context';

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <Router>
          {/* Your routes */}
        </Router>
      </Web3Provider>
    </AuthProvider>
  );
}
```

#### 4. Create Connect Wallet Button Component

Create `Frontend_part/src/components/ConnectWallet.js`:

```javascript
import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const ConnectWallet = () => {
  const { account, isConnected, connectWallet, disconnectWallet, chainId } = useWeb3();

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const isHardhatNetwork = chainId === '31337';

  return (
    <div style={{ padding: '10px' }}>
      {!isConnected ? (
        <button 
          onClick={connectWallet}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Connect MetaMask
        </button>
      ) : (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Connected:</strong> {formatAddress(account)}
          </div>
          {!isHardhatNetwork && (
            <div style={{ color: 'orange', marginBottom: '10px' }}>
              ⚠️ Please switch to Hardhat Local network (Chain ID: 31337)
            </div>
          )}
          <button 
            onClick={disconnectWallet}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
```

---

## Step 4: Enable Real ETH Transfers

### Update Payment Processing

Modify `Frontend_part/src/pages/Payments.js` to use real blockchain transactions:

```javascript
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const Payments = () => {
  const { signer, isConnected, account } = useWeb3();

  const processPayment = async (payment) => {
    if (!isConnected) {
      alert('Please connect your MetaMask wallet first!');
      return;
    }

    try {
      // Create transaction
      const tx = await signer.sendTransaction({
        to: payment.contractorWallet,
        value: ethers.parseEther(payment.amount.toString())
      });

      console.log('Transaction sent:', tx.hash);
      alert('Transaction submitted! Hash: ' + tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Update backend
      await axios.post(`http://localhost:5000/api/payments/${payment._id}/confirm`, {
        transactionHash: tx.hash
      });

      alert('Payment processed successfully!');
      fetchPayments();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed: ' + error.message);
    }
  };

  // Rest of your component...
};
```

---

## Step 5: Smart Contract Interactions

### Deploy and Interact with TenderPayment Contract

#### 1. Update Deployment Script

Create `Backend_part/scripts/deploy-with-accounts.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const TenderPayment = await hre.ethers.getContractFactory("TenderPayment");
  const tenderPayment = await TenderPayment.deploy();
  await tenderPayment.waitForDeployment();

  const address = await tenderPayment.getAddress();
  console.log("TenderPayment deployed to:", address);

  // Save contract address
  const fs = require('fs');
  const contractInfo = {
    address: address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    './contract-address.json',
    JSON.stringify(contractInfo, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

#### 2. Create Contract Interaction Service

Create `Frontend_part/src/services/contractService.js`:

```javascript
import { ethers } from 'ethers';
import TenderPaymentABI from '../contracts/TenderPayment.json';

const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS'; // Update after deployment

export const getContract = (signer) => {
  return new ethers.Contract(CONTRACT_ADDRESS, TenderPaymentABI.abi, signer);
};

export const processPaymentViaContract = async (signer, tenderId, contractorAddress, amount) => {
  try {
    const contract = getContract(signer);
    
    const tx = await contract.processPayment(
      tenderId,
      contractorAddress,
      { value: ethers.parseEther(amount.toString()) }
    );

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    return { success: true, hash: tx.hash, receipt };
  } catch (error) {
    console.error('Contract interaction failed:', error);
    return { success: false, error: error.message };
  }
};

export const getPaymentHistory = async (provider, tenderId) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, TenderPaymentABI.abi, provider);
    const payment = await contract.payments(tenderId);
    return payment;
  } catch (error) {
    console.error('Failed to fetch payment:', error);
    return null;
  }
};
```

---

## Step 6: Complete Setup Checklist

### Backend Setup
- [ ] Start Hardhat node: `cd Backend_part && npx hardhat node`
- [ ] Deploy contracts: `npx hardhat run scripts/deploy-with-accounts.js --network localhost`
- [ ] Start backend server: `node server.js`
- [ ] Note the deployed contract address

### MetaMask Setup
- [ ] Add Hardhat Local network to MetaMask
- [ ] Import at least 3 test accounts (Admin, Contractor, Verifier)
- [ ] Verify each account has 10,000 ETH
- [ ] Switch to Hardhat Local network

### Frontend Setup
- [ ] Install ethers.js: `npm install ethers`
- [ ] Add Web3Context to your app
- [ ] Add ConnectWallet component to Layout
- [ ] Update contract address in contractService.js
- [ ] Start frontend: `npm start`

### Testing
- [ ] Connect MetaMask to frontend
- [ ] Verify correct account is connected
- [ ] Test ETH transfer between accounts
- [ ] Test smart contract payment processing
- [ ] Check transaction history in console

---

## Troubleshooting

### Issue: MetaMask shows "Nonce too high"
**Solution:** Reset account in MetaMask:
1. Settings → Advanced → Clear activity tab data
2. Or manually reset: Settings → Advanced → Reset Account

### Issue: "Chain ID mismatch"
**Solution:** 
1. Ensure Hardhat node is running
2. Verify Chain ID is 31337
3. Restart MetaMask if needed

### Issue: "Insufficient funds"
**Solution:**
1. Verify you're using imported Hardhat test accounts
2. Check account balance in MetaMask
3. Restart Hardhat node if balances are depleted

### Issue: Contract not found
**Solution:**
1. Redeploy contracts after restarting Hardhat node
2. Update contract address in frontend
3. Clear browser cache

---

## Security Notes

⚠️ **IMPORTANT:**
- These private keys are for LOCAL TESTING ONLY
- NEVER use these accounts on mainnet or testnets
- NEVER send real ETH to these addresses
- The Hardhat network resets when you restart the node

---

## Next Steps

Once everything is connected:
1. Test basic ETH transfers between accounts
2. Test smart contract payment processing
3. Verify transaction history is recorded
4. Test all user roles with different MetaMask accounts
5. Monitor blockchain events in Hardhat console

Happy building! 🚀

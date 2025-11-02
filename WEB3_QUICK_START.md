# Web3 Quick Start Guide

## ✅ What's Been Set Up

Your blockchain building platform now has **full Web3 integration** with MetaMask! Here's what's ready:

### 1. Web3 Context ✅
- Manages wallet connection
- Tracks account, balance, and network
- Auto-detects account/network changes

### 2. ConnectWallet Component ✅
- Visible at the top of every page
- Shows connection status
- Displays ETH balance
- Network validation (Hardhat Local)

### 3. Contract Service ✅
- Direct ETH transfers
- Smart contract interactions
- Transaction monitoring
- Balance checking

### 4. Payments Integration ✅
- Real MetaMask transactions
- Transaction hash recording
- Balance updates
- Error handling

---

## 🚀 How to Use

### Step 1: Start Your Blockchain

Open a terminal and run:

```bash
cd Backend_part
npx hardhat node
```

Keep this terminal open! You should see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### Step 2: Add Hardhat Network to MetaMask

1. Open MetaMask
2. Click network dropdown (top center)
3. Click "Add network manually"
4. Enter:
   - **Network Name:** Hardhat Local
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH
5. Click "Save"

### Step 3: Import Test Accounts

Import these accounts to MetaMask (each has 10,000 ETH):

**Admin Account:**
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Contractor 1:**
```
Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
Address: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc
```

**Contractor 2:**
```
Private Key: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
Address: 0x976EA74026E726554dB657fA54763abd0C3a0aa9
```

### Step 4: Start Your Application

```bash
# Terminal 1 - Backend
cd Backend_part
node server.js

# Terminal 2 - Frontend
cd Frontend_part
npm start
```

### Step 5: Connect MetaMask

1. Login to your app (admin@platform.com / admin123)
2. Look for "Connect MetaMask" button at the top
3. Click it and approve the connection
4. You should see your ETH balance!

---

## 💰 Making Real Payments

### As Admin:

1. **Login** as admin (admin@platform.com / admin123)
2. **Connect MetaMask** with the admin account
3. **Go to Tenders** page
4. **Assign a winner** to a tender
5. **Go to Payments** page
6. **Click "Pay with MetaMask"** on pending payment
7. **Approve transaction** in MetaMask popup
8. **Wait for confirmation** (instant on local network)
9. **Check balance** - it should decrease by payment amount

### As Contractor:

1. **Login** as contractor (contractor2@platform.com / contractor123)
2. **Connect MetaMask** with contractor account
3. **Go to Payments** page
4. **See your payments** when admin processes them
5. **Check balance** - it should increase!

---

## 🔍 Verifying Transactions

### In MetaMask:
1. Click "Activity" tab
2. See all your transactions
3. Click any transaction for details

### In Console:
Open browser console (F12) to see:
- Transaction hashes
- Block numbers
- Gas used
- Success/failure messages

### In Hardhat Terminal:
Watch real-time blockchain activity:
```
eth_sendTransaction
eth_getTransactionReceipt
Block mined: #123
```

---

## 🎯 Testing Scenarios

### Scenario 1: Simple Payment
1. Admin assigns tender to contractor
2. Admin processes payment via MetaMask
3. Contractor sees payment in their account
4. Both balances update correctly

### Scenario 2: Multiple Payments
1. Create multiple tenders
2. Assign to different contractors
3. Process all payments
4. Verify all transactions

### Scenario 3: Network Switching
1. Switch MetaMask to different network
2. See warning message
3. Switch back to Hardhat Local
4. Everything works again

### Scenario 4: Account Switching
1. Switch MetaMask account
2. App detects new account
3. Balance updates automatically
4. Can make transactions from new account

---

## ⚠️ Troubleshooting

### "Please connect your MetaMask wallet first"
**Solution:** Click the "Connect MetaMask" button at the top of the page

### "Wrong Network! Please switch to Hardhat Local"
**Solution:** 
1. Click "Switch to Hardhat" button
2. Or manually select "Hardhat Local" in MetaMask

### "Insufficient ETH balance"
**Solution:**
1. Make sure you imported a test account with 10,000 ETH
2. Check you're on Hardhat Local network
3. Restart Hardhat node if balances are depleted

### "Transaction failed"
**Solution:**
1. Check Hardhat node is running
2. Check you're on correct network (Chain ID: 31337)
3. Check you have enough ETH
4. Try resetting MetaMask account (Settings → Advanced → Reset Account)

### "Nonce too high"
**Solution:**
1. MetaMask → Settings → Advanced
2. Click "Clear activity tab data"
3. Or click "Reset Account"

### Balance shows 0 ETH
**Solution:**
1. Make sure Hardhat node is running
2. Make sure you're on "Hardhat Local" network
3. Make sure you imported a test account (not created new one)
4. Refresh MetaMask

---

## 🔐 Security Notes

### ⚠️ IMPORTANT:
- These private keys are for **LOCAL TESTING ONLY**
- **NEVER** use these accounts on mainnet or public testnets
- **NEVER** send real ETH to these addresses
- The Hardhat network **resets** when you restart the node
- All data is **lost** when Hardhat stops

### Safe Practices:
- Only use test accounts for development
- Keep test and production wallets separate
- Never commit private keys to git
- Use environment variables for sensitive data

---

## 📊 What You Can Do Now

✅ **Real ETH Transfers** - Send ETH between accounts via MetaMask
✅ **Smart Contract Payments** - Process payments through contracts
✅ **Transaction Tracking** - See all transactions on blockchain
✅ **Balance Management** - Real-time balance updates
✅ **Multi-Account Testing** - Test with different roles
✅ **Network Validation** - Ensure correct network usage
✅ **Error Handling** - Graceful failure management
✅ **Transaction History** - View all past transactions

---

## 🎓 Learning Resources

### Understanding the Code:

**Web3Context.js** - Manages wallet connection and state
**ConnectWallet.js** - UI for connecting/disconnecting wallet
**contractService.js** - Blockchain interaction functions
**Payments.js** - Real payment processing with MetaMask

### Key Concepts:

- **Provider** - Read-only connection to blockchain
- **Signer** - Can sign and send transactions
- **Transaction Hash** - Unique ID for each transaction
- **Block Number** - Which block contains the transaction
- **Gas** - Fee for processing transaction (free on local network)
- **Nonce** - Transaction counter for each account

---

## 🚀 Next Steps

Want to add more features?

1. **Smart Contract Deployment** - Deploy TenderPayment contract
2. **Event Listening** - Listen to blockchain events
3. **Multi-Signature** - Require multiple approvals
4. **Payment Scheduling** - Automated payment releases
5. **Escrow System** - Hold funds until conditions met
6. **Token Payments** - Use ERC20 tokens instead of ETH

---

## 📞 Need Help?

If you encounter issues:

1. Check Hardhat terminal for errors
2. Check browser console (F12) for logs
3. Check MetaMask for transaction status
4. Verify network and account settings
5. Try restarting Hardhat node

---

## 🎉 You're Ready!

Your platform now has full blockchain integration with:
- Real ETH transfers via MetaMask
- Transaction tracking and history
- Multi-account support
- Network validation
- Error handling

Start testing and building! 🚀

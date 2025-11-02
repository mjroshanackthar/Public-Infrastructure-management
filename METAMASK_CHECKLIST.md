# MetaMask Setup Checklist ✅

Follow these steps in order to enable Web3 features:

## 1️⃣ Install Dependencies

```bash
cd Frontend_part
npm install ethers
```

- [ ] ethers.js installed

---

## 2️⃣ Start Hardhat Blockchain

```bash
cd Backend_part
npx hardhat node
```

**Keep this terminal open!**

- [ ] Hardhat node running
- [ ] See "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/"
- [ ] See list of 20 accounts with 10,000 ETH each

---

## 3️⃣ Configure MetaMask

### Add Hardhat Local Network:

1. Open MetaMask extension
2. Click network dropdown (top center)
3. Click "Add network manually"
4. Enter these details:

```
Network Name: Hardhat Local
New RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
Block Explorer URL: (leave empty)
```

5. Click "Save"

- [ ] Hardhat Local network added to MetaMask
- [ ] Can see "Hardhat Local" in network list

---

## 4️⃣ Import Test Accounts

### Import Admin Account:

1. Click account icon (top right in MetaMask)
2. Click "Import Account"
3. Paste this private key:

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

4. Click "Import"
5. Should see **10,000 ETH** balance!

- [ ] Admin account imported
- [ ] Shows 10,000 ETH balance
- [ ] Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

### Import Contractor Accounts (Optional):

**Contractor 1:**
```
0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
```

**Contractor 2:**
```
0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
```

- [ ] Contractor accounts imported (optional)

---

## 5️⃣ Start Your Application

### Terminal 1 - Backend:
```bash
cd Backend_part
node server.js
```

- [ ] Backend running on port 5002

### Terminal 2 - Frontend:
```bash
cd Frontend_part
npm start
```

- [ ] Frontend running on port 3000
- [ ] Browser opens automatically

---

## 6️⃣ Connect MetaMask to App

1. Login to app (admin@platform.com / admin123)
2. Look for "Connect MetaMask" button at top
3. Click it
4. MetaMask popup appears
5. Click "Next" then "Connect"
6. Should see your address and balance!

- [ ] Logged into app
- [ ] "Connect MetaMask" button visible
- [ ] Clicked and approved connection
- [ ] See "✅ Wallet Connected"
- [ ] See your ETH balance
- [ ] See "✅ Connected to Hardhat Local Network"

---

## 7️⃣ Test Payment

1. Go to **Tenders** page
2. Create a tender (if none exist)
3. Assign a winner to a tender
4. Go to **Payments** page
5. Find pending payment
6. Click **"Pay with MetaMask"** button
7. MetaMask popup appears
8. Review transaction details
9. Click **"Confirm"**
10. Wait for confirmation (instant on local network)
11. See success message with transaction hash!

- [ ] Tender created
- [ ] Winner assigned
- [ ] Pending payment visible
- [ ] Clicked "Pay with MetaMask"
- [ ] Approved transaction in MetaMask
- [ ] Transaction confirmed
- [ ] Success message shown
- [ ] Payment marked as "Completed"
- [ ] Balance decreased (admin) / increased (contractor)

---

## 8️⃣ Verify Everything Works

### Check in App:
- [ ] Payment status changed to "Completed"
- [ ] Transaction hash visible
- [ ] Balance updated in ConnectWallet component

### Check in MetaMask:
- [ ] Click "Activity" tab
- [ ] See the transaction
- [ ] Transaction shows "Confirmed"
- [ ] Balance decreased by payment amount

### Check in Hardhat Terminal:
- [ ] See transaction logs
- [ ] See block mined
- [ ] See gas used

---

## 🎉 Success Criteria

You've successfully set up Web3 if:

✅ MetaMask shows 10,000 ETH (or less after transactions)
✅ App shows "✅ Wallet Connected"
✅ Can see your balance in the app
✅ "Pay with MetaMask" button is enabled (not grayed out)
✅ Can process payment and see MetaMask popup
✅ Transaction confirms successfully
✅ Balance updates after payment
✅ Transaction hash is recorded

---

## ⚠️ Troubleshooting

### Problem: "Could not fetch chain ID"
**Solution:** Start Hardhat node first (`npx hardhat node`)

### Problem: "0 ETH balance"
**Solution:** 
1. Make sure you're on "Hardhat Local" network
2. Make sure you imported test account (not created new)
3. Restart Hardhat node

### Problem: "Please connect your MetaMask wallet first"
**Solution:** Click "Connect MetaMask" button at top of page

### Problem: "Wrong Network"
**Solution:** Click "Switch to Hardhat" button or manually select "Hardhat Local"

### Problem: "Nonce too high"
**Solution:** 
1. MetaMask → Settings → Advanced
2. Click "Clear activity tab data"
3. Or click "Reset Account"

### Problem: Button says "Connect Wallet" instead of "Pay with MetaMask"
**Solution:** You're not connected. Click the "Connect MetaMask" button at the top first.

---

## 📝 Quick Reference

### Hardhat Local Network:
- **RPC URL:** http://127.0.0.1:8545
- **Chain ID:** 31337
- **Currency:** ETH

### Admin Account:
- **Email:** admin@platform.com
- **Password:** admin123
- **Private Key:** 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
- **Address:** 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

### Contractor Accounts:
- **Email:** contractor@platform.com / contractor123
- **Email:** contractor2@platform.com / contractor123

---

## 🚀 You're Done!

Once all checkboxes are ✅, you have:
- Full MetaMask integration
- Real blockchain transactions
- ETH transfers working
- Transaction tracking
- Multi-account support

**Start testing and enjoy your blockchain-powered platform!** 🎉

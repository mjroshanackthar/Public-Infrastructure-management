# Starting the Blockchain Development Environment

## Step 1: Start Hardhat Local Node

Open a terminal and run:

```bash
cd Backend_part
npx hardhat node
```

This will:
- Start a local Ethereum node on http://127.0.0.1:8545
- Create 20 test accounts with 10000 ETH each
- Keep running in the background (don't close this terminal)

You should see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...
```

## Step 2: Deploy Smart Contracts

Open a NEW terminal (keep the first one running) and run:

```bash
cd Backend_part
npx hardhat run scripts/deploy.js --network localhost
```

This will deploy your smart contracts to the local blockchain.

## Step 3: Start Backend Server

After contracts are deployed, start the backend server:

```bash
cd Backend_part
npm start
```

## Step 4: Start Frontend

In another terminal:

```bash
cd Frontend_part
npm start
```

## Important Notes

- **Keep the Hardhat node running** - If you close it, you'll need to redeploy contracts
- **Restart order**: If you restart the Hardhat node, you must redeploy contracts
- **Port 8545**: Make sure nothing else is using port 8545

## Troubleshooting

### Error: Cannot connect to network localhost
**Solution**: Start the Hardhat node first (Step 1)

### Error: Port 8545 already in use
**Solution**: Kill the process using port 8545:
```bash
# Windows
netstat -ano | findstr :8545
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8545 | xargs kill -9
```

### Contracts not found
**Solution**: Make sure you deployed contracts (Step 2) after starting the node
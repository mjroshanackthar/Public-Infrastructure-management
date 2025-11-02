const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy TenderPayment contract
  console.log("📦 Deploying TenderPayment contract...");
  const TenderPayment = await hre.ethers.getContractFactory("TenderPayment");
  const tenderPayment = await TenderPayment.deploy();
  await tenderPayment.waitForDeployment();

  const contractAddress = await tenderPayment.getAddress();
  console.log("✅ TenderPayment deployed to:", contractAddress);
  console.log("🔗 Transaction hash:", tenderPayment.deploymentTransaction().hash);
  console.log("📍 Block number:", tenderPayment.deploymentTransaction().blockNumber, "\n");

  // Save contract information
  const contractInfo = {
    address: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    network: "localhost",
    chainId: 31337,
    transactionHash: tenderPayment.deploymentTransaction().hash
  };
  
  const infoPath = path.join(__dirname, '..', 'contract-address.json');
  fs.writeFileSync(infoPath, JSON.stringify(contractInfo, null, 2));
  console.log("💾 Contract info saved to:", infoPath);

  // Save ABI for frontend
  const artifact = await hre.artifacts.readArtifact("TenderPayment");
  const abiPath = path.join(__dirname, '..', '..', 'Frontend_part', 'src', 'contracts', 'TenderPayment.json');
  
  // Create directory if it doesn't exist
  const abiDir = path.dirname(abiPath);
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }
  
  fs.writeFileSync(abiPath, JSON.stringify(artifact, null, 2));
  console.log("💾 Contract ABI saved to:", abiPath, "\n");

  // Display test accounts
  console.log("👥 Available Test Accounts:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const accounts = await hre.ethers.getSigners();
  for (let i = 0; i < Math.min(5, accounts.length); i++) {
    const balance = await accounts[i].provider.getBalance(accounts[i].address);
    console.log(`Account #${i}: ${accounts[i].address}`);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH\n`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✅ Deployment Complete!");
  console.log("\n📋 Next Steps:");
  console.log("1. Update Frontend_part/src/services/contractService.js with contract address");
  console.log("2. Add Hardhat network to MetaMask (Chain ID: 31337, RPC: http://127.0.0.1:8545)");
  console.log("3. Import test accounts to MetaMask using private keys from Hardhat output");
  console.log("4. Start your frontend and connect MetaMask");
  console.log("\n🎉 Happy building!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

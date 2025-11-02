const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Deploying Contracts...\n");

    try {
        const [deployer] = await hre.ethers.getSigners();
        const network = await hre.ethers.provider.getNetwork();
        const balance = await hre.ethers.provider.getBalance(deployer.address);

        console.log(`Deployer Address: ${deployer.address}`);
        console.log(`Network: ${network.name || "local"} (Chain ID: ${network.chainId})`);
        console.log(`Account Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

        // Deploy CredentialVerification
        console.log("📄 Deploying CredentialVerification...");
        const CredentialVerification = await hre.ethers.getContractFactory("CredentialVerification");
        const minimumVerifications = 2;
        const credentialVerification = await CredentialVerification.deploy(minimumVerifications);
        await credentialVerification.waitForDeployment();
        console.log(`✅ CredentialVerification Deployed: ${credentialVerification.target}\n`);

        // Deploy AuditLog
        console.log("📄 Deploying AuditLog...");
        const AuditLog = await hre.ethers.getContractFactory("AuditLog");
        const auditLog = await AuditLog.deploy();
        await auditLog.waitForDeployment();
        console.log(`✅ AuditLog Deployed: ${auditLog.target}\n`);

        // Deploy PlatformSettings
        console.log("📄 Deploying PlatformSettings...");
        const PlatformSettings = await hre.ethers.getContractFactory("PlatformSettings");
        const platformSettings = await PlatformSettings.deploy();
        await platformSettings.waitForDeployment();
        console.log(`✅ PlatformSettings Deployed: ${platformSettings.target}\n`);

        // Deploy PlatformToken (name, symbol, auditLog address)
        console.log("💰 Deploying PlatformToken...");
        const PlatformToken = await hre.ethers.getContractFactory("PlatformToken");
        const tokenName = "YourTokenName";
        const tokenSymbol = "YTN";
        const platformToken = await PlatformToken.deploy(tokenName, tokenSymbol, auditLog.target);
        await platformToken.waitForDeployment();
        console.log(`✅ PlatformToken Deployed: ${platformToken.target}\n`);

        // Grant PlatformToken permission to use AuditLog
        console.log("🔐 Granting PlatformToken permission to use AuditLog...");
        const grantTx1 = await auditLog.addAuthorizedLogger(platformToken.target);
        await grantTx1.wait();
        console.log("✅ PlatformToken granted logger role\n");

        // Now mint tokens (this should work after granting permission)
        console.log("🪙 Minting initial token supply...");
        const initialMint = hre.ethers.parseEther("1000000");
        const mintTx = await platformToken.mint(deployer.address, initialMint);
        await mintTx.wait();
        console.log(`✅ Minted ${hre.ethers.formatEther(initialMint)} tokens to ${deployer.address}\n`);

        // Deploy TenderManagement
        console.log("🏗️ Deploying TenderManagement...");
        const TenderManagement = await hre.ethers.getContractFactory("TenderManagement");
        const tenderManagement = await TenderManagement.deploy(
            credentialVerification.target,
            auditLog.target
        );
        await tenderManagement.waitForDeployment();
        console.log(`✅ TenderManagement Deployed: ${tenderManagement.target}\n`);

        // Grant TenderManagement permission to use AuditLog
        console.log("🔐 Granting TenderManagement permission to use AuditLog...");
        const grantTx2 = await auditLog.addAuthorizedLogger(tenderManagement.target);
        await grantTx2.wait();
        console.log("✅ TenderManagement granted logger role\n");

        // Deploy ProgressValidation
        console.log("📷 Deploying ProgressValidation...");
        const ProgressValidation = await hre.ethers.getContractFactory("ProgressValidation");
        const minValidations = 3;
        const validatorCooldown = 3600;
        const progressValidation = await ProgressValidation.deploy(
            credentialVerification.target,
            minValidations,
            validatorCooldown
        );
        await progressValidation.waitForDeployment();
        console.log(`✅ ProgressValidation Deployed: ${progressValidation.target}\n`);

        // Grant ProgressValidation permission to use AuditLog
        console.log("🔐 Granting ProgressValidation permission to use AuditLog...");
        const grantTx3 = await auditLog.addAuthorizedLogger(progressValidation.target);
        await grantTx3.wait();
        console.log("✅ ProgressValidation granted logger role\n");

        // Deploy ProjectEscrow
        console.log("💼 Deploying ProjectEscrow...");
        const ProjectEscrow = await hre.ethers.getContractFactory("ProjectEscrow");
        const platformFee = 100; // 1% platform fee (100 basis points = 1%)
        const projectEscrow = await ProjectEscrow.deploy(
            progressValidation.target,
            platformFee
        );
        await projectEscrow.waitForDeployment();
        console.log(`✅ ProjectEscrow Deployed: ${projectEscrow.target}\n`);

        // Grant ProjectEscrow permission to use AuditLog
        console.log("🔐 Granting ProjectEscrow permission to use AuditLog...");
        const grantTx4 = await auditLog.addAuthorizedLogger(projectEscrow.target);
        await grantTx4.wait();
        console.log("✅ ProjectEscrow granted logger role\n");

        // Deploy PaymentDisbursement
        console.log("💲 Deploying PaymentDisbursement...");
        const PaymentDisbursement = await hre.ethers.getContractFactory("PaymentDisbursement");
        const initialFeePercentage = 100; // 1% initial fee (100 basis points = 1%)
        const paymentDisbursement = await PaymentDisbursement.deploy(
            progressValidation.target,
            auditLog.target,
            initialFeePercentage
        );
        await paymentDisbursement.waitForDeployment();
        console.log(`✅ PaymentDisbursement Deployed: ${paymentDisbursement.target}\n`);

        // Grant PaymentDisbursement permission to use AuditLog
        console.log("🔐 Granting PaymentDisbursement permission to use AuditLog...");
        const grantTx5 = await auditLog.addAuthorizedLogger(paymentDisbursement.target);
        await grantTx5.wait();
        console.log("✅ PaymentDisbursement granted logger role\n");

        // Deploy TenderPayment (Simple payment contract for tender awards)
        console.log("💰 Deploying TenderPayment...");
        const TenderPayment = await hre.ethers.getContractFactory("TenderPayment");
        const tenderPayment = await TenderPayment.deploy();
        await tenderPayment.waitForDeployment();
        console.log(`✅ TenderPayment Deployed: ${tenderPayment.target}\n`);

        // Deploy BuildingProject - FIXED CONSTRUCTOR PARAMETER
        console.log("🏛️ Deploying BuildingProject...");
        const BuildingProject = await hre.ethers.getContractFactory("BuildingProject");
        const buildingProject = await BuildingProject.deploy(
            tenderManagement.target  // Only one parameter required
        );
        await buildingProject.waitForDeployment();
        console.log(`✅ BuildingProject Deployed: ${buildingProject.target}\n`);

        // Save all contract addresses to JSON file
        const contractAddresses = {
            credentialVerification: credentialVerification.target,
            auditLog: auditLog.target,
            platformSettings: platformSettings.target,
            platformToken: platformToken.target,
            tenderManagement: tenderManagement.target,
            progressValidation: progressValidation.target,
            projectEscrow: projectEscrow.target,
            paymentDisbursement: paymentDisbursement.target,
            tenderPayment: tenderPayment.target,
            buildingProject: buildingProject.target
        };

        const addressesPath = path.join(__dirname, '..', 'contract-addresses.json');
        fs.writeFileSync(addressesPath, JSON.stringify(contractAddresses, null, 2));
        console.log(`📝 Contract addresses saved to ${addressesPath}\n`);

        // Update or create .env file with main contract address
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, '') + `\nCONTRACT_ADDRESS=${buildingProject.target}\n`;
        fs.writeFileSync(envPath, envContent);
        console.log("🔧 .env updated with main contract address\n");

        // Verify all authorized loggers
        console.log("🔍 Verifying authorized loggers...");
        const authorizedLoggers = [
            platformToken.target,
            tenderManagement.target,
            progressValidation.target,
            projectEscrow.target,
            paymentDisbursement.target
        ];
        
        for (const logger of authorizedLoggers) {
            const isAuthorized = await auditLog.isAuthorizedLogger(logger);
            console.log(`   ${logger}: ${isAuthorized ? '✅ Authorized' : '❌ Not Authorized'}`);
        }
        console.log();

        console.log("✅ Deployment Complete!");
        console.log("-------------------------------");
        console.log(`Main Contract Address: ${buildingProject.target}`);
        console.log(`Network: ${network.name} (${network.chainId})`);
        console.log(`Deployer: ${deployer.address}`);
        console.log(`Balance Remaining: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} ETH`);
        console.log("-------------------------------");
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Unhandled Error:", error);
        process.exit(1);
    });
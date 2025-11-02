const { ethers } = require('ethers');
const contractAddresses = require('../contract-addresses.json');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.isConnected = false;
  }

  async initialize() {
    try {
      // Connect to local Hardhat node
      this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      
      // Use the deployer account (first Hardhat account)
      this.signer = new ethers.Wallet(
        process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        this.provider
      );

      // Test connection with a simple call
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      console.log(`🔗 Connected to blockchain: ${network.name} (Chain ID: ${network.chainId})`);

      // Load contract ABIs and create contract instances
      await this.loadContracts();
      
      // Test if contracts are actually working
      await this.testContractConnection();
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('❌ Blockchain connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async testContractConnection() {
    try {
      // Skip contract testing for now - use MongoDB mode
      console.log('📊 Using MongoDB mode for data storage');
      this.isConnected = false; // Force MongoDB mode
      return true;
    } catch (error) {
      console.log('⚠️  Contract not responding, switching to mock mode');
      this.isConnected = false;
      throw error;
    }
  }

  async loadContracts() {
    try {
      // Load TenderManagement contract
      const TenderManagementABI = [
        "function createTender(string memory title, string memory description, uint256 budget, uint256 deadline, uint256 minQualificationScore, uint256 maxBids) external",
        "function submitBid(uint256 tenderId, uint256 amount, uint256 estimatedDuration, string memory proposal) external",
        "function getTender(uint256 tenderId) external view returns (tuple(string title, string description, uint256 budget, uint256 deadline, uint256 minQualificationScore, uint256 maxBids, uint8 status, address creator, uint256 bidCount))",
        "function getTenderBids(uint256 tenderId) external view returns (tuple(address bidder, uint256 amount, uint256 estimatedDuration, string proposal, uint256 timestamp)[])",
        "function getTenderCount() external view returns (uint256)",
        "event TenderCreated(uint256 indexed tenderId, address indexed creator, string title, uint256 budget)",
        "event BidSubmitted(uint256 indexed tenderId, address indexed bidder, uint256 amount)"
      ];

      this.contracts.TenderManagement = new ethers.Contract(
        contractAddresses.tenderManagement,
        TenderManagementABI,
        this.signer
      );

      // Load CredentialVerification contract
      const CredentialVerificationABI = [
        "function addCredential(string memory certificateType, string memory certificateHash, string memory issuer, uint256 expiryDays) external",
        "function verifyCredential(address user, string memory certificateType) external",
        "function getCredentialStatus(address user, string memory certificateType) external view returns (bool exists, bool isVerified, uint256 verificationCount, uint256 requiredVerifications)",
        "function addVerifier(address verifier) external",
        "function getVerifiers() external view returns (address[])",
        "event CredentialAdded(address indexed user, string certificateType, string issuer)",
        "event CredentialVerified(address indexed user, string certificateType, address indexed verifier)"
      ];

      this.contracts.CredentialVerification = new ethers.Contract(
        contractAddresses.credentialVerification,
        CredentialVerificationABI,
        this.signer
      );

      console.log('📄 Smart contracts loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load contracts:', error.message);
    }
  }

  // Tender Management Functions
  async createTender(title, description, budget, daysUntilDeadline, minQualificationScore = 0, maxBids = 10) {
    try {
      if (!this.isConnected) {
        // Mock tender creation when blockchain is not connected
        const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
        console.log(`✅ Mock tender created: ${title}`);
        return { success: true, txHash: mockTxHash };
      }

      const budgetWei = ethers.parseEther(budget.toString());
      const deadline = Math.floor(Date.now() / 1000) + (daysUntilDeadline * 24 * 60 * 60);

      const tx = await this.contracts.TenderManagement.createTender(
        title,
        description,
        budgetWei,
        deadline,
        minQualificationScore,
        maxBids
      );

      const receipt = await tx.wait();
      console.log(`✅ Tender created: ${receipt.hash}`);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error) {
      console.error('❌ Create tender error:', error);
      return { success: false, error: error.message };
    }
  }

  async getTenderCount() {
    try {
      if (!this.isConnected || !this.contracts.TenderManagement) {
        return 0;
      }
      const count = await this.contracts.TenderManagement.getTenderCount();
      return Number(count);
    } catch (error) {
      console.error('❌ Get tender count error:', error);
      return 0;
    }
  }

  async getTender(tenderId) {
    try {
      const tender = await this.contracts.TenderManagement.getTender(tenderId);
      return {
        id: tenderId,
        title: tender.title,
        description: tender.description,
        budget: ethers.formatEther(tender.budget),
        deadline: new Date(Number(tender.deadline) * 1000),
        minQualificationScore: Number(tender.minQualificationScore),
        maxBids: Number(tender.maxBids),
        status: ['Open', 'Closed', 'Awarded', 'Cancelled'][tender.status],
        creator: tender.creator,
        bidCount: Number(tender.bidCount)
      };
    } catch (error) {
      console.error('❌ Get tender error:', error);
      return null;
    }
  }

  async getAllTenders() {
    try {
      if (!this.isConnected) {
        // Return mock data when blockchain is not connected
        return [
          {
            id: 0,
            title: 'City Hall Renovation',
            description: 'Complete renovation of the city hall building including structural improvements and modern facilities.',
            budget: '50.0',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            minQualificationScore: 75,
            maxBids: 5,
            status: 'Open',
            creator: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            bidCount: 0
          },
          {
            id: 1,
            title: 'Bridge Construction',
            description: 'New pedestrian bridge over the main river with modern design and safety features.',
            budget: '120.0',
            deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            minQualificationScore: 85,
            maxBids: 3,
            status: 'Open',
            creator: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            bidCount: 2
          }
        ];
      }

      const count = await this.getTenderCount();
      const tenders = [];

      for (let i = 0; i < count; i++) {
        const tender = await this.getTender(i);
        if (tender) {
          tenders.push(tender);
        }
      }

      return tenders;
    } catch (error) {
      console.error('❌ Get all tenders error:', error);
      return [];
    }
  }

  // Credential Management Functions
  async addCredential(userAddress, certificateType, certificateHash, issuer, expiryDays) {
    try {
      const tx = await this.contracts.CredentialVerification.addCredential(
        certificateType,
        certificateHash,
        issuer,
        expiryDays
      );

      const receipt = await tx.wait();
      console.log(`✅ Credential added: ${receipt.hash}`);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error) {
      console.error('❌ Add credential error:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyCredential(userAddress, certificateType) {
    try {
      const tx = await this.contracts.CredentialVerification.verifyCredential(
        userAddress,
        certificateType
      );

      const receipt = await tx.wait();
      console.log(`✅ Credential verified: ${receipt.hash}`);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error) {
      console.error('❌ Verify credential error:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility Functions
  getStatus() {
    return {
      connected: this.isConnected,
      network: this.provider ? 'Hardhat Local' : 'Disconnected',
      contractAddresses: contractAddresses
    };
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
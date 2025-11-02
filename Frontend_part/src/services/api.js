import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.reload();
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Hybrid service that can use both API and Web3
export class HybridService {
  constructor(web3Service = null) {
    this.web3Service = web3Service;
    this.useWeb3 = false; // Always start in API mode
  }

  setWeb3Service(web3Service) {
    this.web3Service = web3Service;
    this.useWeb3 = !!web3Service;
  }

  // Toggle between Web3 and API mode
  toggleMode() {
    if (!this.web3Service) {
      console.warn('Web3Service not available, staying in API mode');
      return false;
    }
    this.useWeb3 = !this.useWeb3;
    return this.useWeb3;
  }

  // Tender operations
  async createTender(data) {
    if (this.useWeb3 && this.web3Service) {
      return await this.web3Service.createTender(
        data.title,
        data.description,
        data.budget,
        data.daysUntilDeadline,
        data.minQualificationScore,
        data.maxBids
      );
    } else {
      const response = await tendersAPI.createTender(data);
      return response.data;
    }
  }

  async getAllTenders() {
    if (this.useWeb3 && this.web3Service) {
      try {
        const count = await this.web3Service.getTenderCount();
        const tenders = [];
        for (let i = 0; i < count; i++) {
          const tender = await this.web3Service.getTender(i);
          tenders.push({ ...tender, id: i });
        }
        return tenders;
      } catch (error) {
        console.error('Web3 get tenders error:', error);
        return [];
      }
    } else {
      const response = await tendersAPI.getAllTenders();
      return response.data;
    }
  }

  async submitBid(tenderId, data) {
    if (this.useWeb3 && this.web3Service) {
      return await this.web3Service.submitBid(
        tenderId,
        data.amount,
        data.estimatedDuration,
        data.proposal
      );
    } else {
      const response = await tendersAPI.submitBid(tenderId, data);
      return response.data;
    }
  }

  async getTenderBids(tenderId) {
    if (this.useWeb3 && this.web3Service) {
      return await this.web3Service.getTenderBids(tenderId);
    } else {
      const response = await tendersAPI.getTenderBids(tenderId);
      return response.data;
    }
  }

  // Credential operations
  async addCredential(data) {
    if (this.useWeb3 && this.web3Service) {
      return await this.web3Service.addCredential(
        data.certificateType,
        data.certificateHash,
        data.issuer,
        data.expiryDays
      );
    } else {
      const response = await credentialsAPI.addCredential(data);
      return response.data;
    }
  }

  async getCredentialStatus(address, type) {
    if (this.useWeb3 && this.web3Service) {
      return await this.web3Service.getCredentialStatus(address, type);
    } else {
      const response = await credentialsAPI.getCredentialStatus(address, type);
      return response.data;
    }
  }

  async verifyCredential(address, type) {
    if (this.useWeb3 && this.web3Service) {
      return await this.web3Service.verifyCredential(address, type);
    } else {
      const response = await credentialsAPI.manualVerify({ userAddress: address, certificateType: type });
      return response.data;
    }
  }

  // Contractor operations
  async getAllContractors() {
    if (this.useWeb3 && this.web3Service) {
      try {
        const addresses = await this.web3Service.getAllContractors();
        const contractors = [];
        for (const address of addresses) {
          const info = await this.web3Service.getContractorInfo(address);
          contractors.push({ address, ...info });
        }
        return contractors;
      } catch (error) {
        console.error('Web3 get contractors error:', error);
        return [];
      }
    } else {
      const response = await contractorsAPI.getAllContractors();
      return response.data;
    }
  }
}

// System & Health
export const systemAPI = {
  getHealth: () => api.get('/health'),
  getBlockchainStatus: () => api.get('/api/blockchain/status'),
  getContracts: () => api.get('/api/contracts'),
  getDocs: () => api.get('/api/docs'),
  restartBlockchain: () => api.post('/api/debug/restart-blockchain'),
  testContractConnectivity: () => api.get('/api/debug/contract-test'),
  getContractFunctions: () => api.get('/api/debug/contract-functions'),
};

// Credentials
export const credentialsAPI = {
  addCredential: (data) => api.post('/api/credentials/add', data),
  getCredentialStatus: (address, type) => api.get(`/api/credentials/status/${address}/${type}`),
  addVerifier: () => api.post('/api/debug/add-verifier', {}),
  getVerifiers: () => api.get('/api/debug/verifiers'),
  manualVerify: (data) => api.post('/api/debug/manual-verify-certificate', data),
  getVerificationDetails: (address, type) => api.get(`/api/debug/verification-details/${address}/${type}`),
};

// Contractors
export const contractorsAPI = {
  getVerificationStatus: () => api.get('/api/contractors/verification/status'),
  getContractor: (address) => api.get(`/api/contractors/${address}`),
  getAllContractors: () => api.get('/api/contractors'),
};

// Tenders
export const tendersAPI = {
  createTender: (data) => api.post('/api/tenders', data),
  getAllTenders: () => api.get('/api/tenders'),
  getTender: (id) => api.get(`/api/tenders/${id}`),
  submitBid: (tenderId, data) => api.post(`/api/tenders/${tenderId}/bid`, data),
  getTenderBids: (tenderId) => api.get(`/api/tenders/${tenderId}/bids`),
  assignWinner: (tenderId, data) => api.post(`/api/tenders/${tenderId}/assign`, data),
};

// Projects
export const projectsAPI = {
  getAssignments: () => api.get('/api/projects/assignments'),
};

// Tokens
export const tokensAPI = {
  getBalance: (address) => api.get(`/api/tokens/balance/${address}`),
};

// Debug & Testing
export const debugAPI = {
  testCompleteFlow: (data) => api.post('/api/debug/test-complete-flow', data),
};

// Create hybrid service instance
export const hybridService = new HybridService();

export default api;
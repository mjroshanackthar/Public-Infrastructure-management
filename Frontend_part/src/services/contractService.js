import { ethers } from 'ethers';

// This will be updated after contract deployment
// Check Backend_part/contract-address.json after running deployment script
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// ABI for TenderPayment contract
const TENDER_PAYMENT_ABI = [
  "event PaymentProcessed(uint256 indexed tenderId, address indexed contractor, uint256 amount, uint256 timestamp)",
  "function processPayment(uint256 tenderId, address payable contractor) external payable",
  "function payments(uint256) external view returns (uint256 tenderId, address contractor, uint256 amount, uint256 timestamp, bool processed)"
];

export const getContract = (signerOrProvider) => {
  return new ethers.Contract(CONTRACT_ADDRESS, TENDER_PAYMENT_ABI, signerOrProvider);
};

export const processPaymentViaContract = async (signer, tenderId, contractorAddress, amountInEth) => {
  try {
    console.log('🔄 Processing payment via smart contract...');
    console.log('Tender ID:', tenderId);
    console.log('Contractor:', contractorAddress);
    console.log('Amount:', amountInEth, 'ETH');

    const contract = getContract(signer);
    
    // Convert amount to Wei
    const amountInWei = ethers.parseEther(amountInEth.toString());
    
    // Send transaction
    const tx = await contract.processPayment(
      tenderId,
      contractorAddress,
      { value: amountInWei }
    );

    console.log('📤 Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

    return { 
      success: true, 
      hash: tx.hash, 
      receipt,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('❌ Contract interaction failed:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  }
};

export const sendDirectPayment = async (signer, toAddress, amountInEth) => {
  try {
    console.log('🔄 Sending direct ETH transfer...');
    console.log('To:', toAddress);
    console.log('Amount:', amountInEth, 'ETH');

    const tx = await signer.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amountInEth.toString())
    });

    console.log('📤 Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

    return { 
      success: true, 
      hash: tx.hash, 
      receipt,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('❌ Payment failed:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  }
};

export const getPaymentHistory = async (provider, tenderId) => {
  try {
    const contract = getContract(provider);
    const payment = await contract.payments(tenderId);
    
    return {
      tenderId: payment.tenderId.toString(),
      contractor: payment.contractor,
      amount: ethers.formatEther(payment.amount),
      timestamp: new Date(Number(payment.timestamp) * 1000).toISOString(),
      processed: payment.processed
    };
  } catch (error) {
    console.error('Failed to fetch payment:', error);
    return null;
  }
};

export const getBalance = async (provider, address) => {
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Failed to get balance:', error);
    return '0';
  }
};

export const listenToPaymentEvents = (provider, callback) => {
  const contract = getContract(provider);
  
  contract.on('PaymentProcessed', (tenderId, contractor, amount, timestamp, event) => {
    callback({
      tenderId: tenderId.toString(),
      contractor,
      amount: ethers.formatEther(amount),
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
      transactionHash: event.log.transactionHash,
      blockNumber: event.log.blockNumber
    });
  });

  // Return cleanup function
  return () => {
    contract.removeAllListeners('PaymentProcessed');
  };
};

export const CONTRACT_INFO = {
  address: CONTRACT_ADDRESS,
  network: 'Hardhat Local',
  chainId: 31337
};

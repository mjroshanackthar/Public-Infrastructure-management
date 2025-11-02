const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');

// Get blockchain status
router.get('/status', async (req, res) => {
  try {
    const status = blockchainService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching blockchain status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deploy contract
router.post('/deploy', async (req, res) => {
  try {
    
    // Mock contract deployment
    const contract = {
      address: '0x' + Math.random().toString(16).substr(2, 40),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      blockNumber: 12346,
      gasUsed: 2500000
    };
    
    res.json({
      message: 'Contract deployed successfully',
      contract
    });
  } catch (error) {
    console.error('Error deploying contract:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get contract transactions
router.get('/transactions', async (req, res) => {
  try {
    // Mock transaction data
    const transactions = [
      {
        hash: '0xabc123...',
        from: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e1e1',
        to: '0x9A676e781A523b5d0C0e43731313A708CB607508',
        value: '0',
        gasUsed: 21000,
        blockNumber: 12345,
        timestamp: new Date().toISOString(),
        status: 'success'
      }
    ];
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit tender to blockchain
router.post('/tender', async (req, res) => {
  try {
    const { tenderId, title, budget } = req.body;
    
    // Mock blockchain transaction
    const transaction = {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      tenderId,
      title,
      budget,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    res.json({
      message: 'Tender submitted to blockchain',
      transaction
    });
  } catch (error) {
    console.error('Error submitting tender to blockchain:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
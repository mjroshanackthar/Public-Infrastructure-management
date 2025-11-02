const express = require('express');
const router = express.Router();

// Get all credentials
router.get('/', async (req, res) => {
  try {
    // Mock credentials data
    const credentials = [
      {
        id: '1',
        type: 'License',
        title: 'General Contractor License',
        issuer: 'State Construction Board',
        issueDate: '2023-01-15',
        expiryDate: '2025-01-15',
        credentialId: 'GCL-2023-001',
        verified: true,
        contractorId: '1'
      },
      {
        id: '2',
        type: 'Certification',
        title: 'Safety Certification',
        issuer: 'OSHA',
        issueDate: '2023-06-01',
        expiryDate: '2024-06-01',
        credentialId: 'OSHA-2023-456',
        verified: true,
        contractorId: '1'
      }
    ];
    
    res.json(credentials);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new credential
router.post('/', async (req, res) => {
  try {
    const { type, title, issuer, issueDate, expiryDate, credentialId, description, contractorId } = req.body;
    
    // Mock credential creation
    const credential = {
      id: Date.now().toString(),
      type,
      title,
      issuer,
      issueDate,
      expiryDate,
      credentialId,
      description,
      contractorId,
      verified: false,
      createdAt: new Date()
    };
    
    res.status(201).json({
      message: 'Credential added successfully',
      credential
    });
  } catch (error) {
    console.error('Error adding credential:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update credential
router.put('/:id', async (req, res) => {
  try {
    const { type, title, issuer, issueDate, expiryDate, credentialId, description } = req.body;
    
    // Mock credential update
    const credential = {
      id: req.params.id,
      type: type || 'License',
      title: title || 'Updated Credential',
      issuer: issuer || 'Updated Issuer',
      issueDate: issueDate || '2023-01-15',
      expiryDate: expiryDate || '2025-01-15',
      credentialId: credentialId || 'UPD-2023-001',
      description: description || 'Updated description',
      updatedAt: new Date()
    };
    
    res.json({
      message: 'Credential updated successfully',
      credential
    });
  } catch (error) {
    console.error('Error updating credential:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete credential
router.delete('/:id', async (req, res) => {
  try {
    // Mock credential deletion
    res.json({ 
      message: 'Credential deleted successfully',
      deletedId: req.params.id
    });
  } catch (error) {
    console.error('Error deleting credential:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify credential
router.post('/:id/verify', async (req, res) => {
  try {
    // Mock credential verification
    const credential = {
      id: req.params.id,
      verified: true,
      verifiedAt: new Date(),
      verifiedBy: 'system'
    };
    
    res.json({
      message: 'Credential verified successfully',
      credential
    });
  } catch (error) {
    console.error('Error verifying credential:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
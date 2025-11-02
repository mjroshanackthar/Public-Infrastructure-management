const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Get verification status overview (only for verifiers and admins)
router.get('/verification/status', auth, async (req, res) => {
  try {
    // Check if user is verifier or admin
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only verifiers and admins can view verification status.' });
    }

    const totalContractors = await User.countDocuments({ role: 'contractor' });
    const verifiedContractors = await User.countDocuments({ role: 'contractor', isVerified: true });
    const unverifiedContractors = totalContractors - verifiedContractors;
    
    res.json({
      totalContractors,
      verifiedContractors,
      unverifiedContractors,
      systemActive: true,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all contractors (only for verifiers and admins)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is verifier or admin
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only verifiers and admins can view contractor information.' });
    }

    const contractors = await User.find({ role: 'contractor' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(contractors);
  } catch (error) {
    console.error('Error fetching contractors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get contractor by ID (only for verifiers and admins, or own profile)
router.get('/:id', auth, async (req, res) => {
  try {
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contractor ID format' });
    }

    // Check if user is verifier/admin or accessing their own profile
    const isOwnProfile = req.user.userId === req.params.id;
    const hasAccess = req.user.role === 'verifier' || req.user.role === 'admin' || isOwnProfile;
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
    }

    const contractor = await User.findById(req.params.id)
      .select('-password');
    
    if (!contractor || contractor.role !== 'contractor') {
      return res.status(404).json({ message: 'Contractor not found' });
    }
    
    res.json(contractor);
  } catch (error) {
    console.error('Error fetching contractor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contractor profile (only own profile or by verifiers/admins)
router.put('/:id', auth, async (req, res) => {
  try {
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contractor ID format' });
    }

    // Check if user is updating their own profile or is verifier/admin
    const isOwnProfile = req.user.userId === req.params.id;
    const hasAccess = req.user.role === 'verifier' || req.user.role === 'admin' || isOwnProfile;
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }

    const { name, email, organization } = req.body;
    
    const contractor = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, organization },
      { new: true }
    ).select('-password');
    
    if (!contractor || contractor.role !== 'contractor') {
      return res.status(404).json({ message: 'Contractor not found' });
    }
    
    res.json({
      message: 'Contractor updated successfully',
      contractor
    });
  } catch (error) {
    console.error('Error updating contractor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contractor verification status (for verifiers and admins)
router.put('/:id/verification-status', auth, async (req, res) => {
  try {
    // Check if user is verifier or admin
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only verifiers and admins can change verification status' });
    }

    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contractor ID format' });
    }

    const { isVerified, verificationNotes } = req.body;
    
    const contractor = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isVerified,
        verificationNotes,
        verifiedAt: isVerified ? new Date() : null,
        verifiedBy: isVerified ? req.user.userId : null
      },
      { new: true }
    ).select('-password');
    
    if (!contractor || contractor.role !== 'contractor') {
      return res.status(404).json({ message: 'Contractor not found' });
    }
    
    res.json({
      message: `Contractor ${isVerified ? 'verified' : 'unverified'} successfully`,
      contractor
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/contractors/:id
// @desc    Delete contractor (Admin only)
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only admins can delete contractors
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete contractors' });
    }

    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contractor ID format' });
    }

    const contractor = await User.findById(req.params.id);
    if (!contractor || contractor.role !== 'contractor') {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    // Delete the contractor
    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Contractor deleted successfully',
      deletedContractor: {
        id: contractor._id,
        name: contractor.name,
        email: contractor.email
      }
    });
  } catch (error) {
    console.error('Delete contractor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
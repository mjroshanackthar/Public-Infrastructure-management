const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// @route   POST api/complaints
// @desc    Submit a complaint (Quality Verifier only)
// @access  Private (Verifier only)
router.post('/', [
  auth,
  [
    check('contractorId', 'Contractor ID is required').notEmpty(),
    check('subject', 'Subject is required').notEmpty(),
    check('description', 'Description is required').notEmpty(),
    check('category', 'Category is required').notEmpty()
  ]
], async (req, res) => {
  try {
    // Only verifiers can submit complaints
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only verifiers can submit complaints' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contractorId, subject, description, category, priority } = req.body;

    // Verify contractor exists
    const contractor = await User.findById(contractorId);
    if (!contractor || contractor.role !== 'contractor') {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    const complaint = new Complaint({
      contractorId,
      submittedBy: req.user.userId,
      subject,
      description,
      category,
      priority: priority || 'medium',
      status: 'pending'
    });

    await complaint.save();

    // Populate references
    await complaint.populate('contractorId', 'name email organization');
    await complaint.populate('submittedBy', 'name email organization');

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/complaints
// @desc    Get all complaints (Verifiers and Admin only)
// @access  Private (Verifier/Admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Only verifiers and admins can view complaints
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const complaints = await Complaint.find()
      .populate('contractorId', 'name email organization')
      .populate('submittedBy', 'name email organization')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/complaints/:id
// @desc    Get complaint by ID
// @access  Private (Verifier/Admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    // Only verifiers and admins can view complaints
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const complaint = await Complaint.findById(req.params.id)
      .populate('contractorId', 'name email organization')
      .populate('submittedBy', 'name email organization')
      .populate('resolvedBy', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/complaints/:id/status
// @desc    Update complaint status
// @access  Private (Verifier/Admin only)
router.put('/:id/status', [
  auth,
  [
    check('status', 'Status is required').notEmpty(),
    check('resolutionNotes', 'Resolution notes are required').optional()
  ]
], async (req, res) => {
  try {
    // Only verifiers and admins can update complaints
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, resolutionNotes } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = status;
    if (resolutionNotes) {
      complaint.resolutionNotes = resolutionNotes;
    }

    if (status === 'resolved') {
      complaint.resolvedBy = req.user.userId;
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Populate references
    await complaint.populate('contractorId', 'name email organization');
    await complaint.populate('submittedBy', 'name email organization');
    await complaint.populate('resolvedBy', 'name email');

    res.json({
      message: 'Complaint status updated successfully',
      complaint
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/complaints/contractor/:contractorId
// @desc    Get complaints for a specific contractor
// @access  Private (Verifier/Admin only)
router.get('/contractor/:contractorId', auth, async (req, res) => {
  try {
    // Only verifiers and admins can view complaints
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const complaints = await Complaint.find({ contractorId: req.params.contractorId })
      .populate('submittedBy', 'name email organization')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    console.error('Get contractor complaints error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/complaints/:id
// @desc    Delete complaint (Admin only)
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only admins can delete complaints
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete complaints' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    await Complaint.findByIdAndDelete(req.params.id);

    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

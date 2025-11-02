const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');

// @route   GET /api/verification/requests
// @desc    Get verification requests (for verifiers)
// @access  Private (Verifier only)
router.get('/requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const requests = await VerificationRequest.find()
      .populate('contractorId', 'name email organization walletAddress')
      .populate('verifierId', 'name email')
      .sort({ submittedAt: -1 });

    // Filter out requests with null contractorId (deleted contractors)
    const validRequests = requests.filter(req => req.contractorId !== null);

    res.json(validRequests);
  } catch (error) {
    console.error('Get verification requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/verification/submit
// @desc    Submit verification request (for contractors)
// @access  Private (Contractor only)
router.post('/submit', [
  auth,
  [
    check('credentials', 'At least one credential is required').isArray({ min: 1 }),
    check('credentials.*.type', 'Credential type is required').notEmpty(),
    check('credentials.*.title', 'Credential title is required').notEmpty()
  ]
], async (req, res) => {
  try {
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ message: 'Only contractors can submit verification requests' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if contractor already has a pending request
    const existingRequest = await VerificationRequest.findOne({
      contractorId: req.user.userId,
      status: { $in: ['pending', 'under_review'] }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending verification request' 
      });
    }

    const { credentials, verificationNotes } = req.body;

    const verificationRequest = new VerificationRequest({
      contractorId: req.user.userId,
      credentials,
      verificationNotes,
      status: 'pending'
    });

    await verificationRequest.save();

    res.status(201).json({
      message: 'Verification request submitted successfully',
      request: verificationRequest
    });
  } catch (error) {
    console.error('Submit verification request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/verification/review/:id
// @desc    Review verification request (approve/reject)
// @access  Private (Verifier only)
router.put('/review/:id', [
  auth,
  [
    check('status', 'Status must be approved or rejected').isIn(['approved', 'rejected']),
    check('verificationNotes', 'Verification notes are required').notEmpty()
  ]
], async (req, res) => {
  try {
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, verificationNotes, rejectionReason } = req.body;

    const verificationRequest = await VerificationRequest.findById(req.params.id);
    if (!verificationRequest) {
      return res.status(404).json({ message: 'Verification request not found' });
    }

    // Update verification request
    verificationRequest.status = status;
    verificationRequest.verifierId = req.user.userId;
    verificationRequest.verificationNotes = verificationNotes;
    verificationRequest.reviewedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      verificationRequest.rejectionReason = rejectionReason;
    }

    await verificationRequest.save();

    // Update contractor verification status
    if (status === 'approved') {
      await User.findByIdAndUpdate(verificationRequest.contractorId, {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: req.user.userId
      });
    }

    // Populate the response
    await verificationRequest.populate('contractorId', 'name email organization');
    await verificationRequest.populate('verifierId', 'name email');

    res.json({
      message: `Verification request ${status} successfully`,
      request: verificationRequest
    });
  } catch (error) {
    console.error('Review verification request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/verification/my-request
// @desc    Get contractor's own verification request
// @access  Private (Contractor only)
router.get('/my-request', auth, async (req, res) => {
  try {
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const request = await VerificationRequest.findOne({
      contractorId: req.user.userId
    })
    .populate('verifierId', 'name email')
    .sort({ submittedAt: -1 });

    res.json(request);
  } catch (error) {
    console.error('Get my verification request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/verification/rate-contractor
// @desc    Rate contractor after project completion
// @access  Private (Verifier/Admin only)
router.post('/rate-contractor', [
  auth,
  [
    check('contractorId', 'Contractor ID is required').notEmpty(),
    check('rating', 'Rating must be between 1 and 5').isFloat({ min: 1, max: 5 }),
    check('feedback', 'Feedback is required').notEmpty()
  ]
], async (req, res) => {
  try {
    if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contractorId, rating, feedback } = req.body;

    const contractor = await User.findById(contractorId);
    if (!contractor || contractor.role !== 'contractor') {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    // Calculate new rating (simple average for now)
    const currentRating = contractor.rating || 0;
    const ratingCount = contractor.ratingCount || 0;
    const newRatingCount = ratingCount + 1;
    const newRating = ((currentRating * ratingCount) + rating) / newRatingCount;

    // Update contractor rating
    await User.findByIdAndUpdate(contractorId, {
      rating: Math.round(newRating * 10) / 10, // Round to 1 decimal place
      ratingCount: newRatingCount,
      $push: {
        feedback: {
          rating,
          feedback,
          ratedBy: req.user.userId,
          ratedAt: new Date()
        }
      }
    });

    res.json({
      message: 'Contractor rated successfully',
      newRating: Math.round(newRating * 10) / 10
    });
  } catch (error) {
    console.error('Rate contractor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
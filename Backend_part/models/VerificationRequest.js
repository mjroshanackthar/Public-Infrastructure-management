const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  contractorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  verificationNotes: {
    type: String,
    maxlength: 1000
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  credentials: [{
    type: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    verified: {
      type: Boolean,
      default: false
    }
  }]
});

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
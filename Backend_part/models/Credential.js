const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  verifier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifierAddress: {
    type: String,
    required: true
  },
  verifiedAt: {
    type: Date,
    default: Date.now
  },
  blockchainTxHash: {
    type: String,
    sparse: true
  }
});

const credentialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userAddress: {
    type: String,
    required: true
  },
  certificateType: {
    type: String,
    required: [true, 'Certificate type is required'],
    enum: ['contractor_license', 'safety_certificate', 'quality_certification', 'environmental_permit']
  },
  certificateHash: {
    type: String,
    required: [true, 'Certificate hash is required'],
    unique: true
  },
  issuer: {
    type: String,
    required: [true, 'Issuer is required'],
    maxlength: [200, 'Issuer name cannot exceed 200 characters']
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  verifications: [verificationSchema],
  requiredVerifications: {
    type: Number,
    default: 2,
    min: [1, 'At least 1 verification is required']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  blockchainTxHash: {
    type: String,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt field before saving
credentialSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update verification status based on verifications count
  this.isVerified = this.verifications.length >= this.requiredVerifications;
  
  next();
});

// Virtual for verification count
credentialSchema.virtual('verificationCount').get(function() {
  return this.verifications.length;
});

// Ensure virtual fields are serialized
credentialSchema.set('toJSON', { virtuals: true });

// Compound index for user and certificate type (one credential per type per user)
credentialSchema.index({ user: 1, certificateType: 1 }, { unique: true });

module.exports = mongoose.model('Credential', credentialSchema);
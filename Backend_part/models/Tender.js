const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bidderAddress: {
    type: String,
    required: true
  },
  amount: {
    type: String, // Using string to handle ETH amounts precisely
    required: true
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: [1, 'Duration must be at least 1 day']
  },
  proposal: {
    type: String,
    required: true,
    maxlength: [2000, 'Proposal cannot exceed 2000 characters']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isWinner: {
    type: Boolean,
    default: false
  }
});

const tenderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  budget: {
    type: String, // Using string to handle ETH amounts precisely
    required: [true, 'Budget is required']
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  minQualificationScore: {
    type: Number,
    default: 50,
    min: [0, 'Minimum qualification score cannot be negative'],
    max: [100, 'Minimum qualification score cannot exceed 100']
  },
  maxBids: {
    type: Number,
    default: 5,
    min: [1, 'Maximum bids must be at least 1']
  },
  status: {
    type: String,
    enum: ['Open', 'Closed', 'Awarded', 'Cancelled'],
    default: 'Open'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorAddress: {
    type: String,
    required: true
  },
  bids: [bidSchema],
  winningBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  },
  awardedAt: {
    type: Date
  },
  paymentAmount: {
    type: String // ETH amount to be paid
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed'],
    default: 'Pending'
  },
  paymentDate: {
    type: Date
  },
  transactionHash: {
    type: String // Blockchain transaction hash for payment
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
tenderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for bid count
tenderSchema.virtual('bidCount').get(function() {
  return this.bids.length;
});

// Ensure virtual fields are serialized
tenderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Tender', tenderSchema);
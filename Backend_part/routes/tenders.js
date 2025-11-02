const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Tender = require('../models/Tender');
const Bid = require('../models/Bid');
const User = require('../models/User');

// @route   GET api/tenders
// @desc    Get all tenders (all authenticated users can view, only verified contractors can bid)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // Get tenders from MongoDB - all authenticated users can view tenders
        const tenders = await Tender.find({ status: 'Open' })
            .populate('creator', 'name organization')
            .sort({ createdAt: -1 });

        // Add verification status for contractors to know if they can bid
        let responseData = tenders;
        if (req.user.role === 'contractor') {
            const user = await User.findById(req.user.userId);
            responseData = {
                tenders,
                canBid: user.isVerified,
                verificationMessage: user.isVerified 
                    ? 'You can bid on tenders' 
                    : 'Complete verification to bid on tenders'
            };
        }

        res.json(responseData);
    } catch (error) {
        console.error('Get tenders error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST api/tenders
// @desc    Create a new tender
// @access  Private (Admin only)
router.post('/', [
    auth,
    upload.array('documents', 5),
    [
        check('title', 'Title is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty(),
        check('budget', 'Budget is required').isNumeric(),
        check('daysUntilDeadline', 'Days until deadline is required').isNumeric()
    ]
], async (req, res) => {
    try {
        // Only admin can create tenders
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create tenders' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { 
            title, 
            description, 
            budget, 
            daysUntilDeadline, 
            minQualificationScore = 50, 
            maxBids = 5,
            location,
            requirements = []
        } = req.body;

        // Calculate deadline
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + parseInt(daysUntilDeadline));

        // Create tender in MongoDB
        const tender = new Tender({
            title,
            description,
            budget,
            deadline,
            creator: req.user.userId,
            creatorAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Mock address
            minQualificationScore,
            maxBids,
            status: 'Open'
        });

        await tender.save();

        // Populate creator info
        await tender.populate('creator', 'name organization');

        res.status(201).json({
            message: 'Tender created successfully',
            tender
        });
    } catch (error) {
        console.error('Create tender error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET api/tenders/:id
// @desc    Get tender by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id)
            .populate('creator', 'name organization')
            .populate('bids.bidder', 'name organization rating');

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        res.json(tender);
    } catch (error) {
        console.error('Get tender error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST api/tenders/:id/bid
// @desc    Submit bid for tender
// @access  Private (Verified Contractor only)
router.post('/:id/bid', [
    auth,
    [
        check('amount', 'Bid amount is required').isNumeric(),
        check('estimatedDuration', 'Estimated duration is required').isNumeric(),
        check('proposal', 'Proposal is required').not().isEmpty()
    ]
], async (req, res) => {
    try {
        // Only verified contractors can bid
        if (req.user.role !== 'contractor') {
            return res.status(403).json({ message: 'Only contractors can submit bids' });
        }

        const user = await User.findById(req.user.userId);
        if (!user.isVerified) {
            return res.status(403).json({ 
                message: 'Only verified contractors can submit bids' 
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const tender = await Tender.findById(req.params.id);
        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        if (tender.status !== 'Open') {
            return res.status(400).json({ message: 'Tender is not open for bidding' });
        }

        // Check if contractor already submitted a bid
        const existingBid = tender.bids.find(bid => 
            bid.bidder.toString() === req.user.userId
        );

        if (existingBid) {
            return res.status(400).json({ 
                message: 'You have already submitted a bid for this tender' 
            });
        }

        const { amount, estimatedDuration, proposal } = req.body;

        // Validate minimum bid amount
        const bidAmount = parseFloat(amount);
        if (bidAmount < 50) {
            return res.status(400).json({ 
                message: 'Bid amount must be at least 50 ETH. Your bid has been rejected.' 
            });
        }

        // Add bid to tender
        const newBid = {
            bidder: req.user.userId,
            bidderAddress: user.walletAddress,
            amount: amount.toString(),
            estimatedDuration,
            proposal,
            submittedAt: new Date()
        };

        tender.bids.push(newBid);
        await tender.save();

        // Populate the new bid
        await tender.populate('bids.bidder', 'name organization rating');

        res.status(201).json({
            message: 'Bid submitted successfully',
            bid: tender.bids[tender.bids.length - 1]
        });
    } catch (error) {
        console.error('Submit bid error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET api/tenders/:id/bids
// @desc    Get bids for tender
// @access  Private
router.get('/:id/bids', auth, async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id)
            .populate('bids.bidder', 'name organization rating walletAddress');

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        res.json(tender.bids);
    } catch (error) {
        console.error('Get bids error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST api/tenders/:id/assign
// @desc    Assign winner for tender and process payment
// @access  Private (Admin only)
router.post('/:id/assign', [
    auth,
    [
        check('bidId', 'Bid ID is required').not().isEmpty()
    ]
], async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can assign winners' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const tender = await Tender.findById(req.params.id)
            .populate('bids.bidder', 'name email walletAddress');
        
        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        const { bidId } = req.body;
        const winningBid = tender.bids.id(bidId);

        if (!winningBid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Get contractor details
        const contractor = await User.findById(winningBid.bidder);
        if (!contractor) {
            return res.status(404).json({ message: 'Contractor not found' });
        }

        // Update tender status and winner
        tender.status = 'Awarded';
        tender.winningBid = bidId;
        winningBid.isWinner = true;
        tender.awardedAt = new Date();
        tender.paymentAmount = winningBid.amount;
        tender.paymentStatus = 'Pending';

        await tender.save();

        // Update contractor's completed projects count
        await User.findByIdAndUpdate(winningBid.bidder, {
            $inc: { completedProjects: 1 }
        });

        res.json({
            message: 'Winner assigned successfully. Payment can now be processed.',
            tender,
            winningBid,
            contractor: {
                name: contractor.name,
                walletAddress: contractor.walletAddress,
                amount: winningBid.amount
            },
            paymentInfo: {
                status: 'Pending',
                amount: winningBid.amount,
                contractorAddress: contractor.walletAddress
            }
        });
    } catch (error) {
        console.error('Assign winner error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST api/tenders/:id/process-payment
// @desc    Process ETH payment to winning contractor
// @access  Private (Admin only)
router.post('/:id/process-payment', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can process payments' });
        }

        const tender = await Tender.findById(req.params.id)
            .populate('bids.bidder', 'name email walletAddress');
        
        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        if (tender.status !== 'Awarded') {
            return res.status(400).json({ message: 'Tender must be awarded before processing payment' });
        }

        if (tender.paymentStatus === 'Completed') {
            return res.status(400).json({ message: 'Payment already processed' });
        }

        const winningBid = tender.bids.id(tender.winningBid);
        if (!winningBid) {
            return res.status(404).json({ message: 'Winning bid not found' });
        }

        const contractor = await User.findById(winningBid.bidder);
        if (!contractor || !contractor.walletAddress) {
            return res.status(400).json({ message: 'Contractor wallet address not found' });
        }

        // Here you would integrate with blockchain to transfer ETH
        // For now, we'll simulate the payment
        const paymentData = {
            tenderId: tender._id,
            tenderTitle: tender.title,
            contractorAddress: contractor.walletAddress,
            contractorName: contractor.name,
            amount: winningBid.amount,
            timestamp: new Date(),
            transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock tx hash
            status: 'Completed'
        };

        // Update tender payment status
        tender.paymentStatus = 'Completed';
        tender.paymentDate = new Date();
        tender.transactionHash = paymentData.transactionHash;
        await tender.save();

        res.json({
            message: 'Payment processed successfully',
            payment: paymentData
        });
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET api/tenders/payments/all
// @desc    Get all payments (for admin dashboard)
// @access  Private (Admin only)
router.get('/payments/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can view all payments' });
        }

        const tenders = await Tender.find({ 
            status: 'Awarded',
            paymentStatus: { $exists: true }
        })
        .populate('bids.bidder', 'name email walletAddress organization')
        .populate('creator', 'name email')
        .sort({ paymentDate: -1 });

        const payments = tenders.map(tender => {
            const winningBid = tender.bids.id(tender.winningBid);
            return {
                tenderId: tender._id,
                tenderTitle: tender.title,
                contractor: winningBid?.bidder,
                contractorWallet: winningBid?.bidder?.walletAddress,
                amount: tender.paymentAmount || winningBid?.amount,
                paymentStatus: tender.paymentStatus,
                paymentDate: tender.paymentDate,
                transactionHash: tender.transactionHash,
                awardedAt: tender.awardedAt
            };
        });

        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET api/tenders/payments/contractor/:contractorId
// @desc    Get payments for a specific contractor
// @access  Private
router.get('/payments/contractor/:contractorId', auth, async (req, res) => {
    try {
        // Contractors can only view their own payments
        if (req.user.role === 'contractor' && req.user.userId.toString() !== req.params.contractorId) {
            return res.status(403).json({ message: 'Access denied. You can only view your own payments.' });
        }

        const tenders = await Tender.find({ 
            status: 'Awarded',
            'bids.bidder': req.params.contractorId,
            'bids.isWinner': true
        })
        .populate('creator', 'name email')
        .populate('bids.bidder', 'name email walletAddress organization')
        .sort({ paymentDate: -1 });

        const payments = tenders.map(tender => {
            const winningBid = tender.bids.find(bid => 
                bid.bidder._id.toString() === req.params.contractorId && bid.isWinner
            );
            
            return {
                tenderId: tender._id,
                tenderTitle: tender.title,
                contractor: winningBid?.bidder,
                contractorWallet: winningBid?.bidder?.walletAddress,
                amount: tender.paymentAmount || winningBid?.amount,
                paymentStatus: tender.paymentStatus || 'Pending',
                paymentDate: tender.paymentDate,
                transactionHash: tender.transactionHash,
                awardedAt: tender.awardedAt,
                creator: tender.creator
            };
        });

        res.json(payments);
    } catch (error) {
        console.error('Get contractor payments error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   DELETE api/tenders/:id/payment
// @desc    Delete payment history (Admin only)
// @access  Private (Admin only)
router.delete('/:id/payment', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete payment history' });
        }

        const tender = await Tender.findById(req.params.id);
        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        if (tender.status !== 'Awarded') {
            return res.status(400).json({ message: 'Can only delete payment history for awarded tenders' });
        }

        // Clear payment data
        tender.paymentAmount = undefined;
        tender.paymentStatus = undefined;
        tender.paymentDate = undefined;
        tender.transactionHash = undefined;
        
        await tender.save();

        res.json({
            message: 'Payment history deleted successfully',
            tender
        });
    } catch (error) {
        console.error('Delete payment history error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
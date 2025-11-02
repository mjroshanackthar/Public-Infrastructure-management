const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { Web3 } = require('web3');

// Web3 setup
let web3, contract;
try {
    web3 = new Web3(process.env.WEB3_PROVIDER);
    contract = new web3.eth.Contract(
        require('../artifacts/contracts/BuildingProject.sol/BuildingProject.json').abi,
        process.env.CONTRACT_ADDRESS
    );
} catch (error) {
    console.error('Web3 initialization error in bids route:', error.message);
}

// @route   POST api/bids/:tenderId
// @desc    Submit a bid for a tender
// @access  Private (Verified Contractors only)
router.post('/:tenderId', [
    auth,
    [
        check('amount', 'Bid amount is required').isNumeric(),
        check('proposal', 'Proposal is required').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { amount, proposal } = req.body;
        const tenderId = req.params.tenderId;

        // Verify tender exists and is active
        const tender = await contract.methods.getTender(tenderId).call();
        if (!tender.isActive) {
            return res.status(400).json({ msg: 'Tender is not active' });
        }

        // Submit bid on blockchain
        const accounts = await web3.eth.getAccounts();
        await contract.methods.submitBid(
            tenderId,
            web3.utils.toWei(amount.toString(), 'ether'),
            proposal
        ).send({ 
            from: accounts[0],
            gas: 3000000
        });

        res.json({ message: 'Bid submitted successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.message.includes('Already submitted bid')) {
            return res.status(400).json({ msg: 'You have already submitted a bid for this tender' });
        }
        if (err.message.includes('Tender deadline passed')) {
            return res.status(400).json({ msg: 'Tender deadline has passed' });
        }
        res.status(500).send('Server error');
    }
});

// @route   GET api/bids/:tenderId
// @desc    Get all bids for a tender
// @access  Public
router.get('/:tenderId', async (req, res) => {
    try {
        const bids = await contract.methods.getBids(req.params.tenderId).call();

        const formattedBids = bids.map(bid => ({
            contractor: bid.contractor,
            amount: web3.utils.fromWei(bid.amount, 'ether'),
            proposal: bid.proposal,
            isSelected: bid.isSelected
        }));

        res.json(formattedBids);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/bids/contractor/:address
// @desc    Get all bids by a contractor
// @access  Private
router.get('/contractor/:address', auth, async (req, res) => {
    try {
        const tenderCount = await contract.methods.tenderCounter().call();
        const contractorBids = [];

        for (let i = 1; i <= tenderCount; i++) {
            const bids = await contract.methods.getBids(i).call();
            const contractorBidsForTender = bids.filter(
                bid => bid.contractor.toLowerCase() === req.params.address.toLowerCase()
            );

            if (contractorBidsForTender.length > 0) {
                const tender = await contract.methods.getTender(i).call();
                contractorBidsForTender.forEach(bid => {
                    contractorBids.push({
                        tenderId: i,
                        tenderTitle: tender.title,
                        amount: web3.utils.fromWei(bid.amount, 'ether'),
                        proposal: bid.proposal,
                        isSelected: bid.isSelected,
                        tenderStatus: tender.status
                    });
                });
            }
        }

        res.json(contractorBids);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/bids/stats/:tenderId
// @desc    Get bid statistics for a tender
// @access  Public
router.get('/stats/:tenderId', async (req, res) => {
    try {
        const bids = await contract.methods.getBids(req.params.tenderId).call();
        const tender = await contract.methods.getTender(req.params.tenderId).call();

        if (!tender.isActive) {
            return res.status(404).json({ msg: 'Tender not found' });
        }

        const amounts = bids.map(bid => parseFloat(web3.utils.fromWei(bid.amount, 'ether')));
        const stats = {
            totalBids: bids.length,
            averageBid: amounts.length > 0 ? 
                (amounts.reduce((a, b) => a + b, 0) / amounts.length).toFixed(2) : 0,
            lowestBid: amounts.length > 0 ? Math.min(...amounts) : 0,
            highestBid: amounts.length > 0 ? Math.max(...amounts) : 0,
            tenderBudget: web3.utils.fromWei(tender.budget, 'ether')
        };

        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
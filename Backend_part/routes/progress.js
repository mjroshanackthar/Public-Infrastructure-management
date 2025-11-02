const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
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
    console.error('Web3 initialization error in progress route:', error.message);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: './uploads/progress',
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}-${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB limit
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).array('evidence', 5); // Allow up to 5 files

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images and PDFs Only!');
    }
}

// @route   POST api/progress/:tenderId
// @desc    Report progress for a project
// @access  Private (Selected Contractor only)
router.post('/:tenderId', [
    auth,
    [
        check('description', 'Description is required').not().isEmpty(),
        check('completionPercentage', 'Completion percentage is required').isNumeric()
    ]
], async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ msg: err });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { description, completionPercentage } = req.body;
            const tenderId = req.params.tenderId;

            // Create evidence hash from uploaded files
            const evidenceHashes = req.files.map(file => web3.utils.sha3(file.path));
            const evidenceHash = web3.utils.sha3(evidenceHashes.join(''));

            // Report progress on blockchain
            const accounts = await web3.eth.getAccounts();
            await contract.methods.reportProgress(
                tenderId,
                description,
                evidenceHash
            ).send({ from: accounts[0], gas: 3000000 });

            res.json({
                message: 'Progress reported successfully',
                evidenceHash,
                files: req.files.map(file => ({
                    filename: file.filename,
                    path: file.path
                }))
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    });
});

// @route   GET api/progress/:tenderId
// @desc    Get all progress reports for a tender
// @access  Public
router.get('/:tenderId', async (req, res) => {
    try {
        const tender = await contract.methods.getTender(req.params.tenderId).call();
        if (!tender.isActive) {
            return res.status(404).json({ msg: 'Tender not found' });
        }

        // Get progress reports from blockchain
        const progressCount = await contract.methods.getProgressReportCount(req.params.tenderId).call();
        const progressReports = [];

        for (let i = 0; i < progressCount; i++) {
            const progress = await contract.methods.progressReports(req.params.tenderId, i).call();
            progressReports.push({
                description: progress.description,
                evidenceHash: progress.evidenceHash,
                timestamp: progress.timestamp,
                isValidated: progress.isValidated,
                validationCount: progress.validationCount
            });
        }

        res.json(progressReports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/progress/:tenderId/:progressId/evidence
// @desc    Get evidence files for a progress report
// @access  Public
router.get('/:tenderId/:progressId/evidence', async (req, res) => {
    try {
        const progress = await contract.methods.progressReports(
            req.params.tenderId,
            req.params.progressId
        ).call();

        // Here you would implement logic to retrieve files based on the evidenceHash
        // This is a simplified example
        res.json({
            evidenceHash: progress.evidenceHash,
            // Add logic to return actual file paths or URLs
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/progress/contractor/:address
// @desc    Get all progress reports submitted by a contractor
// @access  Private
router.get('/contractor/:address', auth, async (req, res) => {
    try {
        const tenderCount = await contract.methods.tenderCounter().call();
        const contractorProgress = [];

        for (let i = 1; i <= tenderCount; i++) {
            const tender = await contract.methods.getTender(i).call();
            if (tender.selectedContractor.toLowerCase() === req.params.address.toLowerCase()) {
                const progressCount = await contract.methods.getProgressReportCount(i).call();
                for (let j = 0; j < progressCount; j++) {
                    const progress = await contract.methods.progressReports(i, j).call();
                    contractorProgress.push({
                        tenderId: i,
                        tenderTitle: tender.title,
                        description: progress.description,
                        timestamp: progress.timestamp,
                        isValidated: progress.isValidated,
                        validationCount: progress.validationCount
                    });
                }
            }
        }

        res.json(contractorProgress);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
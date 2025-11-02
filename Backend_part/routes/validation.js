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
    console.error('Web3 initialization error in validation route:', error.message);
}

// Multer setup for validation evidence
const storage = multer.diskStorage({
    destination: './uploads/validation',
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
}).array('validationEvidence', 5); // Allow up to 5 files

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

// @route   POST api/validation/:tenderId/:progressId
// @desc    Validate a progress report
// @access  Private (Verified Validators only)
router.post('/:tenderId/:progressId', [
    auth,
    [
        check('validationStatus', 'Validation status is required').isBoolean(),
        check('comments', 'Comments are required').not().isEmpty()
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
            const { validationStatus, comments } = req.body;
            const { tenderId, progressId } = req.params;

            // Create validation evidence hash
            const evidenceHashes = req.files.map(file => web3.utils.sha3(file.path));
            const validationHash = web3.utils.sha3(evidenceHashes.join(''));

            // Validate progress on blockchain
            const accounts = await web3.eth.getAccounts();
            await contract.methods.validateProgress(
                tenderId,
                progressId
            ).send({ from: accounts[0], gas: 3000000 });

            res.json({
                message: 'Progress validation submitted successfully',
                validationHash,
                files: req.files.map(file => ({
                    filename: file.filename,
                    path: file.path
                }))
            });
        } catch (err) {
            console.error(err.message);
            if (err.message.includes('Already validated')) {
                return res.status(400).json({ msg: 'You have already validated this progress report' });
            }
            res.status(500).send('Server error');
        }
    });
});

// @route   GET api/validation/pending
// @desc    Get all pending validations
// @access  Private (Validators only)
router.get('/pending', auth, async (req, res) => {
    try {
        const tenderCount = await contract.methods.tenderCounter().call();
        const pendingValidations = [];

        for (let i = 1; i <= tenderCount; i++) {
            const tender = await contract.methods.getTender(i).call();
            if (tender.status === '1') { // InProgress
                const progressCount = await contract.methods.getProgressReportCount(i).call();
                for (let j = 0; j < progressCount; j++) {
                    const progress = await contract.methods.progressReports(i, j).call();
                    if (!progress.isValidated) {
                        pendingValidations.push({
                            tenderId: i,
                            progressId: j,
                            tenderTitle: tender.title,
                            description: progress.description,
                            timestamp: progress.timestamp,
                            validationCount: progress.validationCount
                        });
                    }
                }
            }
        }

        res.json(pendingValidations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/validation/validator/:address
// @desc    Get all validations by a validator
// @access  Private
router.get('/validator/:address', auth, async (req, res) => {
    try {
        const tenderCount = await contract.methods.tenderCounter().call();
        const validatorHistory = [];

        for (let i = 1; i <= tenderCount; i++) {
            const progressCount = await contract.methods.getProgressReportCount(i).call();
            for (let j = 0; j < progressCount; j++) {
                const progress = await contract.methods.progressReports(i, j).call();
                const hasValidated = await contract.methods.hasValidated(i, j, req.params.address).call();
                
                if (hasValidated) {
                    const tender = await contract.methods.getTender(i).call();
                    validatorHistory.push({
                        tenderId: i,
                        progressId: j,
                        tenderTitle: tender.title,
                        description: progress.description,
                        timestamp: progress.timestamp,
                        isValidated: progress.isValidated
                    });
                }
            }
        }

        res.json(validatorHistory);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/validation/stats
// @desc    Get validation statistics
// @access  Private (Admin only)
router.get('/stats', auth, async (req, res) => {
    try {
        const tenderCount = await contract.methods.tenderCounter().call();
        let totalValidations = 0;
        let pendingValidations = 0;
        let completedValidations = 0;

        for (let i = 1; i <= tenderCount; i++) {
            const progressCount = await contract.methods.getProgressReportCount(i).call();
            for (let j = 0; j < progressCount; j++) {
                const progress = await contract.methods.progressReports(i, j).call();
                totalValidations++;
                if (progress.isValidated) {
                    completedValidations++;
                } else {
                    pendingValidations++;
                }
            }
        }

        res.json({
            totalValidations,
            pendingValidations,
            completedValidations,
            validationRate: totalValidations > 0 ? 
                (completedValidations / totalValidations * 100).toFixed(2) : 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
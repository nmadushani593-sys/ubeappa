const express = require('express');
const webhookController = require('../controllers/webhookController');
const webhookSignature = require('../middleware/webhookSignature');

const router = express.Router();

router.get('/', webhookController.verifyWebhook);
router.post('/', webhookSignature, webhookController.handleWebhook);

module.exports = router;

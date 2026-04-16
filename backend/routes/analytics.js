const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', protect, analyticsController.getOverview);
router.get('/messages-per-day', protect, analyticsController.getMessagesPerDay);
router.get('/top-agents', protect, analyticsController.getTopAgents);
router.get('/response-times', protect, analyticsController.getResponseTimes);

module.exports = router;

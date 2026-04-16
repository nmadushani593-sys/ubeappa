const express = require('express');
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const Tag = require('../models/Tag');

const router = express.Router();

router.post('/suggest-reply', protect, messageController.getSuggestedReplies);
router.post('/detect-intent', protect, messageController.detectIntent);
router.get('/tags', protect, async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.json({ success: true, tags });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tags' });
  }
});
router.post('/tags', protect, async (req, res) => {
  try {
    const tag = await Tag.create({ name: req.body.name, color: req.body.color || '#25D366', createdBy: req.user._id });
    res.status(201).json({ success: true, tag });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create tag' });
  }
});
router.delete('/tags/:id', protect, async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete tag' });
  }
});

module.exports = router;

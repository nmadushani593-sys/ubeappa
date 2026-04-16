const express = require('express');
const conversationController = require('../controllers/conversationController');
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, conversationController.getConversations);
router.get('/search', protect, conversationController.searchConversations);
router.get('/:id', protect, conversationController.getConversation);
router.put('/:id/assign', protect, conversationController.assignConversation);
router.put('/:id/status', protect, conversationController.updateConversationStatus);
router.get('/:id/messages', protect, conversationController.getConversationMessages);
router.post('/:id/messages', protect, conversationController.sendMessage);
router.post('/:id/notes', protect, conversationController.addNote);
router.post('/:id/suggest', protect, messageController.getSuggestedReplies);

module.exports = router;

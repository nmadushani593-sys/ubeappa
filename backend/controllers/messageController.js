const Message = require('../models/Message');
const { generateSuggestedReplies, detectIntent } = require('../services/aiService');

exports.getMessages = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const query = req.query.conversationId ? { conversation: req.query.conversationId } : {};

    const [messages, total] = await Promise.all([
      Message.find(query)
        .populate('sender', 'name email avatar role')
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Message.countDocuments(query)
    ]);

    return res.json({ success: true, messages: messages.reverse(), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

exports.getSuggestedReplies = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const history = conversationId
      ? await Message.find({ conversation: conversationId, isNote: false }).sort({ timestamp: -1 }).limit(10).lean()
      : [];
    const suggestions = await generateSuggestedReplies(message, history.reverse());
    return res.json({ success: true, suggestions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate suggested replies' });
  }
};

exports.detectIntent = async (req, res) => {
  try {
    const intent = await detectIntent(req.body.message || '');
    return res.json({ success: true, intent });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to detect intent' });
  }
};

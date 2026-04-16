const Conversation = require('../models/Conversation');
const Customer = require('../models/Customer');
const Message = require('../models/Message');
const PhoneNumber = require('../models/PhoneNumber');
const whatsappService = require('../services/whatsappService');

const SAFE_PHONE_NUMBER_FIELDS = '-accessToken -verifyToken';

const buildConversationQuery = async ({ status, search }) => {
  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    const customerIds = await Customer.find({ $or: [{ name: regex }, { phone: regex }, { whatsappProfileName: regex }] }).distinct('_id');
    query.$or = [{ customer: { $in: customerIds } }];
  }

  return query;
};

exports.getConversations = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const query = await buildConversationQuery(req.query);

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .populate('customer')
        .populate('assignedAgent', 'name email status avatar')
        .populate('phoneNumber', SAFE_PHONE_NUMBER_FIELDS)
        .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Conversation.countDocuments(query)
    ]);

    return res.json({ success: true, conversations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch conversations' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('customer')
      .populate('assignedAgent', 'name email role status avatar')
      .populate('tags')
      .populate('phoneNumber', SAFE_PHONE_NUMBER_FIELDS);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.json({ success: true, conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch conversation' });
  }
};

exports.assignConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { assignedAgent: req.body.agentId || null, unreadCount: 0 },
      { new: true }
    )
      .populate('customer')
      .populate('assignedAgent', 'name email role status avatar')
      .populate('phoneNumber', SAFE_PHONE_NUMBER_FIELDS);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    req.app.get('io')?.cancelAutoReply(String(conversation._id));
    return res.json({ success: true, conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to assign conversation' });
  }
};

exports.updateConversationStatus = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
      .populate('customer')
      .populate('assignedAgent', 'name email role status avatar')
      .populate('phoneNumber', SAFE_PHONE_NUMBER_FIELDS);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.json({ success: true, conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update conversation status' });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const includeNotes = req.query.includeNotes !== 'false';
    const query = { conversation: req.params.id };
    if (!includeNotes) {
      query.isNote = false;
    }

    const [messages, total] = await Promise.all([
      Message.find(query)
        .populate('sender', 'name email avatar role')
        .sort({ timestamp: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Message.countDocuments(query)
    ]);

    return res.json({
      success: true,
      messages: messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { content = '', type = 'text', mediaUrl = '', caption = '' } = req.body;
    const conversation = await Conversation.findById(req.params.id).populate('customer').populate('phoneNumber');
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    if (
      req.user.role !== 'admin' &&
      String(conversation.phoneNumber.connectedBy) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to use this phone number' });
    }

    let waResult = null;
    if (type === 'text' || !mediaUrl) {
      waResult = await whatsappService.sendTextMessage(
        conversation.phoneNumber.phoneNumberId,
        conversation.phoneNumber.accessToken,
        conversation.customer.phone,
        content
      );
    } else {
      waResult = await whatsappService.sendMediaMessage(
        conversation.phoneNumber.phoneNumberId,
        conversation.phoneNumber.accessToken,
        conversation.customer.phone,
        type,
        mediaUrl,
        caption || content
      );
    }

    const message = await Message.create({
      conversation: conversation._id,
      fromCustomer: false,
      sender: req.user._id,
      type,
      content,
      caption,
      mediaUrl,
      status: 'sent',
      whatsappMessageId: waResult?.messages?.[0]?.id || '',
      timestamp: new Date()
    });

    conversation.lastMessage = {
      content: content || caption || type,
      timestamp: message.timestamp,
      fromCustomer: false
    };
    conversation.unreadCount = 0;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email avatar role');
    req.app.get('io')?.cancelAutoReply(String(conversation._id));
    req.app.get('io')?.emitNewMessage(String(conversation._id), populatedMessage);

    return res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message || 'Failed to send message' });
  }
};

exports.addNote = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      fromCustomer: false,
      sender: req.user._id,
      type: 'note',
      content: req.body.content,
      status: 'sent',
      isNote: true,
      timestamp: new Date()
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email avatar role');
    req.app.get('io')?.emitNewMessage(String(conversation._id), populatedMessage);
    return res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add note' });
  }
};

exports.searchConversations = async (req, res) => {
  try {
    const search = req.query.q || req.query.search || '';
    const regex = new RegExp(search, 'i');
    const [customerIds, conversationIds] = await Promise.all([
      Customer.find({ $or: [{ name: regex }, { phone: regex }, { whatsappProfileName: regex }] }).distinct('_id'),
      Message.find({ content: regex }).distinct('conversation')
    ]);

    const conversations = await Conversation.find({
      $or: [{ customer: { $in: customerIds } }, { _id: { $in: conversationIds } }]
    })
      .populate('customer')
      .populate('assignedAgent', 'name email status avatar')
      .populate('phoneNumber', SAFE_PHONE_NUMBER_FIELDS)
      .sort({ 'lastMessage.timestamp': -1 });

    return res.json({ success: true, conversations });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to search conversations' });
  }
};

const PhoneNumber = require('../models/PhoneNumber');
const Customer = require('../models/Customer');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const whatsappService = require('../services/whatsappService');

const extractMessagePayload = (message) => {
  switch (message.type) {
    case 'text':
      return { content: message.text?.body || '', type: 'text' };
    case 'image':
      return {
        content: message.image?.caption || 'Image',
        caption: message.image?.caption || '',
        type: 'image',
        mediaId: message.image?.id || '',
        mediaMimeType: message.image?.mime_type || ''
      };
    case 'audio':
      return {
        content: 'Audio message',
        type: 'audio',
        mediaId: message.audio?.id || '',
        mediaMimeType: message.audio?.mime_type || ''
      };
    case 'video':
      return {
        content: message.video?.caption || 'Video',
        caption: message.video?.caption || '',
        type: 'video',
        mediaId: message.video?.id || '',
        mediaMimeType: message.video?.mime_type || ''
      };
    case 'document':
      return {
        content: message.document?.filename || 'Document',
        caption: message.document?.caption || '',
        type: 'document',
        mediaId: message.document?.id || '',
        mediaMimeType: message.document?.mime_type || ''
      };
    default:
      return { content: `Unsupported message type: ${message.type}`, type: 'system' };
  }
};

async function processIncomingMessage(io, phoneNumberRecord, value, message) {
  const senderPhone = message.from;
  const contact = value.contacts?.find((item) => item.wa_id === senderPhone);
  const payload = extractMessagePayload(message);

  let customer = await Customer.findOne({ phone: senderPhone });
  if (!customer) {
    customer = await Customer.create({
      name: contact?.profile?.name || senderPhone,
      phone: senderPhone,
      whatsappProfileName: contact?.profile?.name || ''
    });
  } else {
    customer.lastSeen = new Date();
    customer.whatsappProfileName = contact?.profile?.name || customer.whatsappProfileName;
    await customer.save();
  }

  let conversation = await Conversation.findOne({ customer: customer._id, phoneNumber: phoneNumberRecord._id }).sort({ updatedAt: -1 });
  let isNewConversation = false;
  if (!conversation) {
    conversation = await Conversation.create({
      customer: customer._id,
      phoneNumber: phoneNumberRecord._id,
      status: 'open',
      unreadCount: 0,
      lastMessage: {
        content: payload.content,
        timestamp: new Date(Number(message.timestamp || Date.now()) * 1000 || Date.now()),
        fromCustomer: true
      }
    });
    customer.totalConversations += 1;
    await customer.save();
    isNewConversation = true;
  }

  const msg = await Message.create({
    conversation: conversation._id,
    fromCustomer: true,
    type: payload.type,
    content: payload.content,
    caption: payload.caption || '',
    mediaId: payload.mediaId || '',
    mediaMimeType: payload.mediaMimeType || '',
    whatsappMessageId: message.id || '',
    status: 'delivered',
    timestamp: message.timestamp ? new Date(Number(message.timestamp) * 1000) : new Date()
  });

  conversation.lastMessage = {
    content: payload.content,
    timestamp: msg.timestamp,
    fromCustomer: true
  };
  conversation.unreadCount += 1;
  conversation.status = conversation.status === 'resolved' ? 'open' : conversation.status;
  await conversation.save();

  if (isNewConversation) {
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('customer')
      .populate('assignedAgent', 'name email status avatar')
      .populate('phoneNumber', '-accessToken -verifyToken');
    io.emitNewConversation(populatedConversation);
  }

  const populatedMessage = await Message.findById(msg._id).populate('sender', 'name email avatar');
  io.emitNewMessage(String(conversation._id), populatedMessage);
  io.emitNotification({
    type: 'incoming-message',
    title: contact?.profile?.name || senderPhone,
    message: payload.content,
    conversationId: conversation._id,
    customerId: customer._id
  });
  await io.scheduleAutoReply(String(conversation._id));

  if (message.id) {
    whatsappService.markMessageAsRead(phoneNumberRecord.phoneNumberId, phoneNumberRecord.accessToken, message.id).catch(() => null);
  }
}

async function processStatusUpdate(io, status) {
  if (!status.id) return;
  const update = { status: status.status || 'sent' };
  const message = await Message.findOneAndUpdate({ whatsappMessageId: status.id }, update, { new: true });
  if (!message) return;
  io.to(`conv:${message.conversation}`).emit('message:status', {
    messageId: message._id,
    whatsappMessageId: message.whatsappMessageId,
    status: message.status,
    conversationId: message.conversation
  });
  io.emit('conversation:updated', { conversationId: String(message.conversation) });
}

exports.verifyWebhook = async (req, res) => {
  try {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe') {
      const phoneNumber = await PhoneNumber.findOne({ verifyToken: token });
      if (phoneNumber) {
        return res.status(200).send(challenge);
      }
    }
    return res.status(403).send('Verification failed');
  } catch (error) {
    return res.status(403).send('Verification failed');
  }
};

exports.handleWebhook = async (req, res) => {
  res.sendStatus(200);

  setImmediate(async () => {
    try {
      const io = req.app.get('io');
      const entries = Array.isArray(req.body.entry) ? req.body.entry : [];
      for (const entry of entries) {
        for (const change of entry.changes || []) {
          const value = change.value || {};
          const phoneNumberId = value.metadata?.phone_number_id;
          const phoneNumberRecord = phoneNumberId ? await PhoneNumber.findOne({ phoneNumberId }) : null;
          if (!phoneNumberRecord) {
            continue;
          }

          for (const message of value.messages || []) {
            await processIncomingMessage(io, phoneNumberRecord, value, message);
          }

          for (const status of value.statuses || []) {
            await processStatusUpdate(io, status);
          }
        }
      }
    } catch (error) {
      console.error('Webhook processing failed:', error.message);
    }
  });
};

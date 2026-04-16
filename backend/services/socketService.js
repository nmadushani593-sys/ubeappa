const autoReplyTimers = new Map();
const { generateAutoReply } = require('./aiService');
const whatsappService = require('./whatsappService');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const PhoneNumber = require('../models/PhoneNumber');
const Customer = require('../models/Customer');
const User = require('../models/User');

module.exports = function setupSocket(io) {
  const onlineAgents = new Map();

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    const registerAgent = async () => {
      if (!socket.user?._id) {
        return;
      }

      const userId = String(socket.user._id);
      onlineAgents.set(String(userId), socket.id);
      socket.userId = String(userId);
      await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() }).catch(() => null);
      io.emit('agents:online', Array.from(onlineAgents.keys()));
      io.emit('agent:statusUpdate', { userId, status: 'online' });
    };

    registerAgent().catch(() => null);
    socket.on('agent:join', registerAgent);

    socket.on('conversation:join', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('typing:start', async ({ conversationId }) => {
      await Conversation.findByIdAndUpdate(conversationId, { isTyping: true }).catch(() => null);
      socket.to(`conv:${conversationId}`).emit('agent:typing', { conversationId, typing: true });
    });

    socket.on('typing:stop', async ({ conversationId }) => {
      await Conversation.findByIdAndUpdate(conversationId, { isTyping: false }).catch(() => null);
      socket.to(`conv:${conversationId}`).emit('agent:typing', { conversationId, typing: false });
    });

    socket.on('agent:status', async ({ status }) => {
      const userId = socket.userId || String(socket.user?._id || '');
      if (!userId) {
        return;
      }

      await User.findByIdAndUpdate(userId, { status, lastSeen: new Date() }).catch(() => null);
      io.emit('agent:statusUpdate', { userId, status });
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        onlineAgents.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, { status: 'offline', lastSeen: new Date() }).catch(() => null);
        io.emit('agents:online', Array.from(onlineAgents.keys()));
        io.emit('agent:statusUpdate', { userId: socket.userId, status: 'offline' });
      }
    });
  });

  io.emitNewMessage = function emitNewMessage(conversationId, message) {
    io.to(`conv:${conversationId}`).emit('message:new', message);
    io.emit('conversation:updated', { conversationId });
  };

  io.emitNewConversation = function emitNewConversation(conversation) {
    io.emit('conversation:new', conversation);
  };

  io.emitNotification = function emitNotification(notification) {
    io.emit('notification', { id: Date.now(), timestamp: new Date().toISOString(), ...notification });
  };

  io.getOnlineAgents = function getOnlineAgents() {
    return Array.from(onlineAgents.keys());
  };

  io.scheduleAutoReply = async function scheduleAutoReply(conversationId) {
    const key = String(conversationId);
    if (autoReplyTimers.has(key)) {
      clearTimeout(autoReplyTimers.get(key));
    }

    const conversation = await Conversation.findById(conversationId).lean();
    const timeoutSeconds = conversation?.autoReplyTimeoutSeconds || 30;

    const timerId = setTimeout(async () => {
      try {
        const liveConversation = await Conversation.findById(conversationId).populate('phoneNumber');
        if (!liveConversation || !liveConversation.autoReplyEnabled || liveConversation.assignedAgent) {
          return;
        }

        const lastMsg = await Message.findOne({ conversation: conversationId, isNote: false }).sort({ timestamp: -1 });
        if (lastMsg && !lastMsg.fromCustomer) {
          return;
        }

        const history = await Message.find({ conversation: conversationId, isNote: false }).sort({ timestamp: -1 }).limit(10).lean();
        history.reverse();
        const customerLastMsg = [...history].reverse().find((m) => m.fromCustomer && m.content);
        if (!customerLastMsg) {
          return;
        }

        const customer = await Customer.findById(liveConversation.customer);
        const pn = await PhoneNumber.findById(liveConversation.phoneNumber._id || liveConversation.phoneNumber);
        if (!customer || !pn) {
          return;
        }

        const reply = await generateAutoReply(customerLastMsg.content, history);
        const waResult = await whatsappService.sendTextMessage(pn.phoneNumberId, pn.accessToken, customer.phone, reply);

        const msg = await Message.create({
          conversation: conversationId,
          fromCustomer: false,
          type: 'text',
          content: reply,
          status: 'sent',
          aiGenerated: true,
          whatsappMessageId: waResult.messages?.[0]?.id || '',
          timestamp: new Date()
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          unreadCount: 0,
          'lastMessage.content': reply,
          'lastMessage.timestamp': msg.timestamp,
          'lastMessage.fromCustomer': false
        });

        io.emitNewMessage(key, msg);
      } catch (error) {
        console.error('Auto-reply error:', error.message);
      } finally {
        autoReplyTimers.delete(key);
      }
    }, timeoutSeconds * 1000);

    autoReplyTimers.set(key, timerId);
  };

  io.cancelAutoReply = function cancelAutoReply(conversationId) {
    const key = String(conversationId);
    if (autoReplyTimers.has(key)) {
      clearTimeout(autoReplyTimers.get(key));
      autoReplyTimers.delete(key);
    }
  };
};

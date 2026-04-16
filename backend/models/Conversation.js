const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  phoneNumber: { type: mongoose.Schema.Types.ObjectId, ref: 'PhoneNumber', required: true },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['open', 'resolved', 'pending', 'spam'], default: 'open' },
  unreadCount: { type: Number, default: 0 },
  lastMessage: {
    content: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    fromCustomer: { type: Boolean, default: true }
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  autoReplyEnabled: { type: Boolean, default: true },
  autoReplyTimeoutSeconds: { type: Number, default: 30 },
  isTyping: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);

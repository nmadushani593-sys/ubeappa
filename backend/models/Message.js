const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  fromCustomer: { type: Boolean, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, enum: ['text', 'image', 'audio', 'video', 'document', 'template', 'note', 'system'], default: 'text' },
  content: { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  mediaId: { type: String, default: '' },
  mediaMimeType: { type: String, default: '' },
  caption: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed'], default: 'pending' },
  isNote: { type: Boolean, default: false },
  aiGenerated: { type: Boolean, default: false },
  whatsappMessageId: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);

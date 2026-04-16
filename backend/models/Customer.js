const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  company: { type: String, default: '' },
  avatar: { type: String, default: '' },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  notes: { type: String, default: '' },
  country: { type: String, default: '' },
  lastSeen: { type: Date, default: Date.now },
  totalConversations: { type: Number, default: 0 },
  whatsappProfileName: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);

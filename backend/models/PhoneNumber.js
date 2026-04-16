const mongoose = require('mongoose');

const phoneNumberSchema = new mongoose.Schema({
  displayName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  phoneNumberId: { type: String, required: true, unique: true },
  wabaId: { type: String, required: true },
  accessToken: { type: String, required: true },
  verifyToken: { type: String, required: true },
  certificate: { type: String, default: '' },
  status: { type: String, enum: ['connected', 'pending', 'error', 'unregistered'], default: 'pending' },
  qualityRating: { type: String, default: 'UNKNOWN' },
  connectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  webhookUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('PhoneNumber', phoneNumberSchema);

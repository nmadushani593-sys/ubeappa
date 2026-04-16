const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'], default: 'UTILITY' },
  language: { type: String, default: 'en_US' },
  components: [{ type: mongoose.Schema.Types.Mixed }],
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'LOCAL'], default: 'LOCAL' },
  whatsappTemplateId: { type: String, default: '' },
  body: { type: String, required: true },
  phoneNumber: { type: mongoose.Schema.Types.ObjectId, ref: 'PhoneNumber' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);

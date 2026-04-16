const PhoneNumber = require('../models/PhoneNumber');
const whatsappService = require('../services/whatsappService');

const normalizeMetaStatus = (value) => {
  const status = String(value || '').toLowerCase();
  if (status.includes('connected') || status.includes('verified')) return 'connected';
  if (status.includes('unregistered')) return 'unregistered';
  if (status.includes('error')) return 'error';
  return 'pending';
};

const canAccess = (req, phoneNumber) => req.user.role === 'admin' || String(phoneNumber.connectedBy) === String(req.user._id);

exports.connectPhoneNumber = async (req, res) => {
  try {
    const { displayName, phoneNumber, phoneNumberId, wabaId, accessToken, verifyToken } = req.body;
    if (!displayName || !phoneNumber || !phoneNumberId || !wabaId || !accessToken || !verifyToken) {
      return res.status(400).json({ success: false, message: 'All phone number fields are required' });
    }

    let record = await PhoneNumber.findOne({ phoneNumberId });
    if (record) {
      if (!canAccess(req, record) && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Phone number already connected by another user' });
      }
      Object.assign(record, { displayName, phoneNumber, wabaId, accessToken, verifyToken, connectedBy: req.user._id });
    } else {
      record = new PhoneNumber({ displayName, phoneNumber, phoneNumberId, wabaId, accessToken, verifyToken, connectedBy: req.user._id });
    }

    try {
      const details = await whatsappService.getPhoneNumberDetails(phoneNumberId, accessToken);
      record.certificate = details.certificate || record.certificate;
      record.qualityRating = details.quality_rating || 'UNKNOWN';
      record.status = normalizeMetaStatus(details.status || details.code_verification_status);
    } catch (error) {
      record.status = 'error';
    }

    await record.save();
    return res.status(201).json({ success: true, phoneNumber: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to connect phone number' });
  }
};

exports.getPhoneNumbers = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { connectedBy: req.user._id };
    const phoneNumbers = await PhoneNumber.find(filter).populate('connectedBy', 'name email role').sort({ createdAt: -1 });
    return res.json({ success: true, phoneNumbers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch phone numbers' });
  }
};

exports.getPhoneNumber = async (req, res) => {
  try {
    const phoneNumber = await PhoneNumber.findById(req.params.id).populate('connectedBy', 'name email role');
    if (!phoneNumber) {
      return res.status(404).json({ success: false, message: 'Phone number not found' });
    }
    if (!canAccess(req, phoneNumber)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return res.json({ success: true, phoneNumber });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch phone number' });
  }
};

exports.getCertificate = async (req, res) => {
  try {
    const phoneNumber = await PhoneNumber.findById(req.params.id);
    if (!phoneNumber) {
      return res.status(404).json({ success: false, message: 'Phone number not found' });
    }
    if (!canAccess(req, phoneNumber)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const details = await whatsappService.getPhoneNumberDetails(phoneNumber.phoneNumberId, phoneNumber.accessToken);
    phoneNumber.certificate = details.certificate || phoneNumber.certificate;
    phoneNumber.qualityRating = details.quality_rating || phoneNumber.qualityRating;
    phoneNumber.status = normalizeMetaStatus(details.status || details.code_verification_status);
    await phoneNumber.save();

    return res.json({ success: true, certificate: phoneNumber.certificate, phoneNumber });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message || 'Failed to fetch certificate' });
  }
};

exports.registerPhoneNumber = async (req, res) => {
  try {
    const phoneNumber = await PhoneNumber.findById(req.params.id);
    if (!phoneNumber) {
      return res.status(404).json({ success: false, message: 'Phone number not found' });
    }
    if (!canAccess(req, phoneNumber)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { pin, certificate } = req.body;
    const result = await whatsappService.registerPhoneNumber(
      phoneNumber.phoneNumberId,
      phoneNumber.accessToken,
      pin,
      certificate || phoneNumber.certificate
    );

    phoneNumber.certificate = certificate || phoneNumber.certificate;
    phoneNumber.status = 'connected';
    await phoneNumber.save();

    return res.json({ success: true, result, phoneNumber });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message || 'Failed to register phone number' });
  }
};

exports.requestCode = async (req, res) => {
  try {
    const phoneNumber = await PhoneNumber.findById(req.params.id);
    if (!phoneNumber) {
      return res.status(404).json({ success: false, message: 'Phone number not found' });
    }
    if (!canAccess(req, phoneNumber)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const method = ['SMS', 'VOICE'].includes(req.body.method) ? req.body.method : 'SMS';
    const result = await whatsappService.requestVerificationCode(phoneNumber.phoneNumberId, phoneNumber.accessToken, method);
    return res.json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message || 'Failed to request verification code' });
  }
};

exports.verifyCode = async (req, res) => {
  try {
    const phoneNumber = await PhoneNumber.findById(req.params.id);
    if (!phoneNumber) {
      return res.status(404).json({ success: false, message: 'Phone number not found' });
    }
    if (!canAccess(req, phoneNumber)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const result = await whatsappService.verifyCode(phoneNumber.phoneNumberId, phoneNumber.accessToken, req.body.code);
    phoneNumber.status = 'connected';
    await phoneNumber.save();
    return res.json({ success: true, result, phoneNumber });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message || 'Failed to verify code' });
  }
};

exports.deletePhoneNumber = async (req, res) => {
  try {
    const phoneNumber = await PhoneNumber.findById(req.params.id);
    if (!phoneNumber) {
      return res.status(404).json({ success: false, message: 'Phone number not found' });
    }
    await phoneNumber.deleteOne();
    return res.json({ success: true, message: 'Phone number deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete phone number' });
  }
};

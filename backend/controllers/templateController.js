const Template = require('../models/Template');
const PhoneNumber = require('../models/PhoneNumber');
const whatsappService = require('../services/whatsappService');

exports.getTemplates = async (req, res) => {
  try {
    const query = {};
    if (req.query.phoneNumber) {
      query.phoneNumber = req.query.phoneNumber;
    }
    const templates = await Template.find(query).populate('phoneNumber').populate('createdBy', 'name email').sort({ createdAt: -1 });
    return res.json({ success: true, templates });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const template = await Template.create({
      name: req.body.name,
      category: req.body.category || 'UTILITY',
      language: req.body.language || 'en_US',
      body: req.body.body,
      components: req.body.components || [],
      phoneNumber: req.body.phoneNumber || null,
      createdBy: req.user._id,
      status: 'LOCAL'
    });
    return res.status(201).json({ success: true, template });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create template' });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    await template.deleteOne();
    return res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
};

exports.sendTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const phoneNumber = await PhoneNumber.findById(template.phoneNumber || req.body.phoneNumber);
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required to send template' });
    }

    const result = await whatsappService.sendTemplateMessage(
      phoneNumber.phoneNumberId,
      phoneNumber.accessToken,
      req.body.to,
      template.name,
      template.language,
      req.body.components || template.components || []
    );

    return res.json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message || 'Failed to send template' });
  }
};

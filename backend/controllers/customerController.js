const Customer = require('../models/Customer');
const Tag = require('../models/Tag');
const Conversation = require('../models/Conversation');

exports.getCustomers = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = req.query.search ? new RegExp(req.query.search, 'i') : null;
    const query = search ? { $or: [{ name: search }, { phone: search }, { email: search }, { company: search }] } : {};

    const [customers, total] = await Promise.all([
      Customer.find(query).populate('tags').sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
      Customer.countDocuments(query)
    ]);

    return res.json({ success: true, customers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('tags');
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const conversations = await Conversation.find({ customer: customer._id })
      .populate('assignedAgent', 'name email status avatar')
      .populate('phoneNumber', '-accessToken -verifyToken')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, customer, conversationCount: conversations.length, conversations });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer' });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const updates = {};
    ['name', 'email', 'company', 'notes', 'country', 'avatar'].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    const customer = await Customer.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('tags');
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    return res.json({ success: true, customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update customer' });
  }
};

exports.addTag = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    let tag = null;
    if (req.body.tagId) {
      tag = await Tag.findById(req.body.tagId);
    } else if (req.body.name) {
      tag = await Tag.findOneAndUpdate(
        { name: req.body.name.trim() },
        { $setOnInsert: { color: req.body.color || '#25D366', createdBy: req.user._id } },
        { upsert: true, new: true }
      );
    }

    if (!tag) {
      return res.status(400).json({ success: false, message: 'Tag data is required' });
    }

    if (!customer.tags.some((id) => String(id) === String(tag._id))) {
      customer.tags.push(tag._id);
      await customer.save();
    }

    const updated = await Customer.findById(customer._id).populate('tags');
    return res.json({ success: true, customer: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add tag' });
  }
};

exports.removeTag = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $pull: { tags: req.params.tagId } },
      { new: true }
    ).populate('tags');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.json({ success: true, customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove tag' });
  }
};

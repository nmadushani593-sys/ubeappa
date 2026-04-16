const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const sanitizeUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  avatar: user.avatar,
  lastSeen: user.lastSeen,
  createdAt: user.createdAt
});

exports.generateToken = generateToken;

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const userCount = await User.countDocuments();
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userCount === 0 ? 'admin' : (role || 'agent')
    });

    return res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to register user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await user.comparePassword(password || ''))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    return res.json({ success: true, token: generateToken(user._id), user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    return res.json({ success: true, user: req.user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const updates = {};
    ['name', 'email', 'status', 'avatar'].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = field === 'email' ? String(req.body[field]).toLowerCase() : req.body[field];
      }
    });
    updates.lastSeen = new Date();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    const counts = await Conversation.aggregate([
      { $match: { assignedAgent: { $ne: null } } },
      { $group: { _id: '$assignedAgent', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
    const enriched = users.map((user) => ({ ...user, assignedConversations: countMap.get(String(user._id)) || 0 }));
    return res.json({ success: true, users: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch users' });
  }
};

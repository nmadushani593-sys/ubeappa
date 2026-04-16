const Conversation = require('../models/Conversation');
const Customer = require('../models/Customer');
const Message = require('../models/Message');
const User = require('../models/User');

async function computeResponseTimePairs(agentId) {
  const conversations = await Conversation.find(agentId ? { assignedAgent: agentId } : { assignedAgent: { $ne: null } }).select('_id assignedAgent').lean();
  const agentMap = new Map(conversations.map((item) => [String(item._id), String(item.assignedAgent)]));
  const ids = conversations.map((item) => item._id);
  if (!ids.length) return [];

  const messages = await Message.find({ conversation: { $in: ids }, isNote: false }).sort({ timestamp: 1 }).lean();
  const waitingCustomerMessage = new Map();
  const pairs = [];

  for (const message of messages) {
    const key = String(message.conversation);
    if (message.fromCustomer) {
      waitingCustomerMessage.set(key, message.timestamp);
      continue;
    }

    if (waitingCustomerMessage.has(key)) {
      const diff = (new Date(message.timestamp) - new Date(waitingCustomerMessage.get(key))) / 60000;
      if (diff >= 0) {
        pairs.push({ conversationId: key, agentId: agentMap.get(key), minutes: diff });
      }
      waitingCustomerMessage.delete(key);
    }
  }

  return pairs;
}

exports.getOverview = async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      totalConversations,
      openConversations,
      resolvedConversations,
      totalCustomers,
      totalMessages,
      messagesLast24h,
      responsePairs,
      onlineAgents
    ] = await Promise.all([
      Conversation.countDocuments(),
      Conversation.countDocuments({ status: 'open' }),
      Conversation.countDocuments({ status: 'resolved' }),
      Customer.countDocuments(),
      Message.countDocuments(),
      Message.countDocuments({ createdAt: { $gte: since } }),
      computeResponseTimePairs(),
      User.countDocuments({ status: 'online' })
    ]);

    const avgResponseTimeMinutes = responsePairs.length
      ? Number((responsePairs.reduce((sum, item) => sum + item.minutes, 0) / responsePairs.length).toFixed(2))
      : 0;

    return res.json({
      success: true,
      overview: {
        totalConversations,
        openConversations,
        resolvedConversations,
        totalCustomers,
        totalMessages,
        messagesLast24h,
        avgResponseTimeMinutes,
        onlineAgents
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch overview analytics' });
  }
};

exports.getMessagesPerDay = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const rows = await Message.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const map = new Map(rows.map((row) => [row._id, row.count]));
    const result = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(since);
      date.setDate(since.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: map.get(key) || 0 };
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch message analytics' });
  }
};

exports.getTopAgents = async (req, res) => {
  try {
    const counts = await Conversation.aggregate([
      { $match: { assignedAgent: { $ne: null } } },
      { $group: { _id: '$assignedAgent', conversationsHandled: { $sum: 1 } } },
      { $sort: { conversationsHandled: -1 } },
      { $limit: 10 }
    ]);

    const users = await User.find({ _id: { $in: counts.map((item) => item._id) } }).select('name email status avatar').lean();
    const userMap = new Map(users.map((user) => [String(user._id), user]));
    const data = counts.map((item) => ({ ...userMap.get(String(item._id)), conversationsHandled: item.conversationsHandled }));
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch top agents' });
  }
};

exports.getResponseTimes = async (req, res) => {
  try {
    const pairs = await computeResponseTimePairs();
    const users = await User.find().select('name email status').lean();
    const grouped = new Map();
    for (const pair of pairs) {
      if (!pair.agentId) continue;
      const existing = grouped.get(pair.agentId) || { total: 0, count: 0 };
      existing.total += pair.minutes;
      existing.count += 1;
      grouped.set(pair.agentId, existing);
    }

    const data = users
      .filter((user) => grouped.has(String(user._id)))
      .map((user) => ({
        userId: user._id,
        name: user.name,
        avgResponseTimeMinutes: Number((grouped.get(String(user._id)).total / grouped.get(String(user._id)).count).toFixed(2)),
        samples: grouped.get(String(user._id)).count
      }))
      .sort((a, b) => a.avgResponseTimeMinutes - b.avgResponseTimeMinutes);

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch response time analytics' });
  }
};

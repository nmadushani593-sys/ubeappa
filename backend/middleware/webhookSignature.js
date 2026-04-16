const crypto = require('crypto');

module.exports = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return next();
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !req.rawBody) {
    return next();
  }

  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex')}`;
  if (signature !== expected) {
    return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
  }

  next();
};

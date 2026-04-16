const express = require('express');
const authController = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

const allowBootstrapOrAdmin = async (req, res, next) => {
  const count = await User.countDocuments();
  if (count === 0) {
    return next();
  }
  return protect(req, res, () => adminOnly(req, res, next));
};

router.post('/login', authController.login);
router.post('/register', allowBootstrapOrAdmin, authController.register);
router.get('/me', protect, authController.getMe);
router.put('/me', protect, authController.updateMe);
router.get('/users', protect, authController.getUsers);

module.exports = router;

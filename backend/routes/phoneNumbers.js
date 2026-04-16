const express = require('express');
const phoneNumberController = require('../controllers/phoneNumberController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, phoneNumberController.getPhoneNumbers);
router.post('/', protect, phoneNumberController.connectPhoneNumber);
router.get('/:id', protect, phoneNumberController.getPhoneNumber);
router.delete('/:id', protect, adminOnly, phoneNumberController.deletePhoneNumber);
router.get('/:id/certificate', protect, phoneNumberController.getCertificate);
router.post('/:id/register', protect, phoneNumberController.registerPhoneNumber);
router.post('/:id/request-code', protect, phoneNumberController.requestCode);
router.post('/:id/verify-code', protect, phoneNumberController.verifyCode);

module.exports = router;

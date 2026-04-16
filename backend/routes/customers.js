const express = require('express');
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, customerController.getCustomers);
router.get('/:id', protect, customerController.getCustomer);
router.put('/:id', protect, customerController.updateCustomer);
router.post('/:id/tags', protect, customerController.addTag);
router.delete('/:id/tags/:tagId', protect, customerController.removeTag);

module.exports = router;

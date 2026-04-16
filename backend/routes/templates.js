const express = require('express');
const templateController = require('../controllers/templateController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, templateController.getTemplates);
router.post('/', protect, templateController.createTemplate);
router.delete('/:id', protect, templateController.deleteTemplate);
router.post('/:id/send', protect, templateController.sendTemplate);

module.exports = router;

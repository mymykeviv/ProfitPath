const express = require('express');
const router = express.Router();
const bomController = require('../controllers/bomController');

// BOM routes
router.get('/', bomController.getAllBOMs);
router.get('/:id', bomController.getBOMById);
router.post('/', bomController.createBOM);
router.put('/:id', bomController.updateBOM);
router.delete('/:id', bomController.deleteBOM);

// BOM status management routes
router.post('/:id/activate', bomController.activateBOM);
router.post('/:id/deactivate', bomController.deactivateBOM);
router.post('/:id/archive', bomController.archiveBOM);

// BOM query routes
router.get('/product/:product_id/active', bomController.getActiveBOMsForProduct);

module.exports = router;
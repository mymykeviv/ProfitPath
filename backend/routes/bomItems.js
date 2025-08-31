const express = require('express');
const router = express.Router();
const bomItemController = require('../controllers/bomItemController');

// BOM Item routes
router.get('/', bomItemController.getAllBOMItems);
router.get('/:id', bomItemController.getBOMItemById);
router.post('/', bomItemController.createBOMItem);
router.put('/:id', bomItemController.updateBOMItem);
router.delete('/:id', bomItemController.deleteBOMItem);

// BOM Item query routes
router.get('/bom/:bom_id', bomItemController.getBOMItemsByBOMId);
router.get('/bom/:bom_id/validate-availability', bomItemController.validateMaterialAvailability);
router.get('/bom/:bom_id/calculate-cost', bomItemController.calculateBOMCost);

module.exports = router;
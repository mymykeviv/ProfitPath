const express = require('express');
const router = express.Router();
const productionBatchController = require('../controllers/productionBatchController');

// Production Batch routes
router.get('/', productionBatchController.getAllProductionBatches);
router.get('/active', productionBatchController.getActiveProductionBatches);
router.get('/statistics', productionBatchController.getProductionStatistics);
router.get('/:id', productionBatchController.getProductionBatchById);
router.post('/', productionBatchController.createProductionBatch);
router.put('/:id', productionBatchController.updateProductionBatch);
router.delete('/:id', productionBatchController.deleteProductionBatch);

// Production Batch status management routes
router.post('/:id/start', productionBatchController.startProductionBatch);
router.post('/:id/complete', productionBatchController.completeProductionBatch);
router.post('/:id/cancel', productionBatchController.cancelProductionBatch);
router.post('/:id/hold', productionBatchController.holdProductionBatch);
router.post('/:id/resume', productionBatchController.resumeProductionBatch);

// Production Batch query routes
router.get('/product/:product_id', productionBatchController.getProductionBatchesByProduct);
router.get('/:id/efficiency', productionBatchController.getBatchEfficiencyMetrics);

module.exports = router;
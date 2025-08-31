const express = require('express');
const router = express.Router();
const productionConsumptionController = require('../controllers/productionConsumptionController');

// Production Consumption routes
router.get('/', productionConsumptionController.getAllProductionConsumptions);
router.get('/statistics', productionConsumptionController.getConsumptionStatistics);
router.get('/material-usage-report', productionConsumptionController.generateMaterialUsageReport);
router.get('/:id', productionConsumptionController.getProductionConsumptionById);
router.post('/', productionConsumptionController.createProductionConsumption);
router.put('/:id', productionConsumptionController.updateProductionConsumption);
router.delete('/:id', productionConsumptionController.deleteProductionConsumption);

// Production Consumption query routes
router.get('/batch/:batch_id', productionConsumptionController.getConsumptionByBatch);
router.get('/material/:material_id', productionConsumptionController.getConsumptionByMaterial);
router.get('/batch/:batch_id/validate-bom', productionConsumptionController.validateConsumptionAgainstBOM);
router.get('/:id/variance-analysis', productionConsumptionController.getConsumptionVarianceAnalysis);

module.exports = router;
const express = require('express');
const router = express.Router();
const StockAlertController = require('../controllers/stockAlertController');

// Get all stock alerts with filtering
router.get('/', StockAlertController.getAllAlerts);

// Get stock alert by ID
router.get('/:id', StockAlertController.getAlertById);

// Create new stock alert
router.post('/', StockAlertController.createAlert);

// Update stock alert
router.put('/:id', StockAlertController.updateAlert);

// Delete stock alert
router.delete('/:id', StockAlertController.deleteAlert);

// Acknowledge stock alert
router.patch('/:id/acknowledge', StockAlertController.acknowledgeAlert);

// Resolve stock alert
router.patch('/:id/resolve', StockAlertController.resolveAlert);

// Generate stock alerts for all products
router.post('/generate', StockAlertController.generateAlerts);

// Get active alerts summary
router.get('/summary/active', StockAlertController.getActiveAlertsSummary);

// Get low stock products
router.get('/reports/low-stock-products', StockAlertController.getLowStockProducts);

// Get expiring batches
router.get('/reports/expiring-batches', StockAlertController.getExpiringBatches);

// Bulk acknowledge alerts
router.patch('/bulk/acknowledge', StockAlertController.bulkAcknowledgeAlerts);

module.exports = router;
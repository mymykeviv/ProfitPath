const express = require('express');
const router = express.Router();
const InventoryTransactionController = require('../controllers/inventoryTransactionController');

// Get all inventory transactions with filtering and pagination
router.get('/', InventoryTransactionController.getAllTransactions);

// Get inventory transaction by ID
router.get('/:id', InventoryTransactionController.getTransactionById);

// Create new inventory transaction
router.post('/', InventoryTransactionController.createTransaction);

// Update inventory transaction
router.put('/:id', InventoryTransactionController.updateTransaction);

// Delete inventory transaction (soft delete)
router.delete('/:id', InventoryTransactionController.deleteTransaction);

// Get stock movement report
router.get('/reports/stock-movement', InventoryTransactionController.getStockMovementReport);

// Get inventory valuation
router.get('/reports/valuation', InventoryTransactionController.getInventoryValuation);

// Get low stock alerts
router.get('/alerts/low-stock', InventoryTransactionController.getLowStockAlerts);

// Bulk create transactions (for imports)
router.post('/bulk', InventoryTransactionController.bulkCreateTransactions);

module.exports = router;
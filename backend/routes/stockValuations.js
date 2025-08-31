const express = require('express');
const router = express.Router();
const StockValuationController = require('../controllers/stockValuationController');

// Get all stock valuations with filtering
router.get('/', StockValuationController.getAllValuations);

// Get stock valuation by ID
router.get('/:id', StockValuationController.getValuationById);

// Calculate and create/update stock valuation
router.post('/calculate', StockValuationController.calculateValuation);

// Get valuation comparison report (FIFO vs LIFO vs Weighted Average)
router.get('/reports/comparison', StockValuationController.getValuationComparison);

// Generate comprehensive valuation report for all products
router.get('/reports/comprehensive', StockValuationController.generateValuationReport);

module.exports = router;
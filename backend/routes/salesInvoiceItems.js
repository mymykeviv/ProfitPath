const express = require('express');
const router = express.Router();
const salesInvoiceItemController = require('../controllers/salesInvoiceItemController');
const {
  validateCreateSalesInvoiceItem,
  validateUpdateSalesInvoiceItem,
  validateSalesInvoiceItemId,
  validateSalesInvoiceId,
  validateProductId,
  validateSalesInvoiceItemQuery,
  validateAnalyticsQuery,
  validateTopSellingQuery,
  validateProfitAnalysisQuery
} = require('../middleware/salesInvoiceItemValidation');

// Get all sales invoice items with filtering and pagination
router.get('/', validateSalesInvoiceItemQuery, salesInvoiceItemController.getAllSalesInvoiceItems);

// Get top selling products
router.get('/top-selling', validateTopSellingQuery, salesInvoiceItemController.getTopSellingProducts);

// Get profit analysis
router.get('/profit-analysis', validateProfitAnalysisQuery, salesInvoiceItemController.getProfitAnalysis);

// Get items by sales invoice
router.get('/invoice/:sales_invoice_id', validateSalesInvoiceId, salesInvoiceItemController.getItemsBySalesInvoice);

// Get items by product
router.get('/product/:product_id', validateProductId, salesInvoiceItemController.getItemsByProduct);

// Get sales analytics by product
router.get('/product/:product_id/analytics', validateProductId, salesInvoiceItemController.getSalesAnalyticsByProduct);

// Get sales invoice item by ID
router.get('/:id', validateSalesInvoiceItemId, salesInvoiceItemController.getSalesInvoiceItemById);

// Create new sales invoice item
router.post('/', validateCreateSalesInvoiceItem, salesInvoiceItemController.createSalesInvoiceItem);

// Update sales invoice item
router.put('/:id', validateUpdateSalesInvoiceItem, salesInvoiceItemController.updateSalesInvoiceItem);

// Delete sales invoice item
router.delete('/:id', validateSalesInvoiceItemId, salesInvoiceItemController.deleteSalesInvoiceItem);

module.exports = router;
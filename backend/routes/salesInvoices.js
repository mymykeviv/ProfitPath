const express = require('express');
const router = express.Router();
const salesInvoiceController = require('../controllers/salesInvoiceController');
const {
  validateCreateSalesInvoice,
  validateUpdateSalesInvoice,
  validateSalesInvoiceId,
  validateCustomerId,
  validateSalesInvoiceQuery,
  validateRecordPayment,
  validateCancelInvoice,
  validateSalesStatsQuery
} = require('../middleware/salesInvoiceValidation');

// Get all sales invoices with filtering and pagination
router.get('/', validateSalesInvoiceQuery, salesInvoiceController.getAllSalesInvoices);

// Get sales statistics
router.get('/statistics', validateSalesStatsQuery, salesInvoiceController.getSalesStatistics);

// Get pending invoices
router.get('/pending', validateSalesInvoiceQuery, salesInvoiceController.getPendingInvoices);

// Get overdue invoices
router.get('/overdue', validateSalesInvoiceQuery, salesInvoiceController.getOverdueInvoices);

// Get invoices by customer
router.get('/customer/:customer_id', validateCustomerId, salesInvoiceController.getInvoicesByCustomer);

// Get sales invoice by ID
router.get('/:id', validateSalesInvoiceId, salesInvoiceController.getSalesInvoiceById);

// Create new sales invoice
router.post('/', validateCreateSalesInvoice, salesInvoiceController.createSalesInvoice);

// Update sales invoice
router.put('/:id', validateUpdateSalesInvoice, salesInvoiceController.updateSalesInvoice);

// Send sales invoice
router.patch('/:id/send', validateSalesInvoiceId, salesInvoiceController.sendSalesInvoice);

// Record payment for sales invoice
router.patch('/:id/payment', validateRecordPayment, salesInvoiceController.recordPayment);

// Cancel sales invoice
router.patch('/:id/cancel', validateCancelInvoice, salesInvoiceController.cancelSalesInvoice);

module.exports = router;
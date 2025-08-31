const express = require('express');
const router = express.Router();

// Import route modules
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const batchRoutes = require('./batches');
const supplierRoutes = require('./suppliers');
const purchaseOrderRoutes = require('./purchaseOrders');
const purchaseOrderItemRoutes = require('./purchaseOrderItems');
const customerRoutes = require('./customers');
const salesInvoiceRoutes = require('./salesInvoices');
const salesInvoiceItemRoutes = require('./salesInvoiceItems');
const inventoryTransactionRoutes = require('./inventoryTransactions');
const stockValuationRoutes = require('./stockValuations');
const stockAlertRoutes = require('./stockAlerts');
const paymentRoutes = require('./payments');
const paymentReminderRoutes = require('./paymentReminders');
const bomRoutes = require('./boms');
const bomItemRoutes = require('./bomItems');
const productionBatchRoutes = require('./productionBatches');
const productionConsumptionRoutes = require('./productionConsumptions');

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ProfitPath API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Use routes
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/batches', batchRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/purchase-order-items', purchaseOrderItemRoutes);
router.use('/customers', customerRoutes);
router.use('/sales-invoices', salesInvoiceRoutes);
router.use('/sales-invoice-items', salesInvoiceItemRoutes);
router.use('/inventory-transactions', inventoryTransactionRoutes);
router.use('/stock-valuations', stockValuationRoutes);
router.use('/stock-alerts', stockAlertRoutes);
router.use('/payments', paymentRoutes);
router.use('/payment-reminders', paymentReminderRoutes);
router.use('/boms', bomRoutes);
router.use('/bom-items', bomItemRoutes);
router.use('/production-batches', productionBatchRoutes);
router.use('/production-consumptions', productionConsumptionRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

module.exports = router;
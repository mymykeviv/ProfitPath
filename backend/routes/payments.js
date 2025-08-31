const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Get all payments with filtering and pagination
router.get('/', paymentController.getAllPayments);

// Get payment statistics
router.get('/statistics', paymentController.getPaymentStatistics);

// Get pending payments
router.get('/pending', paymentController.getPendingPayments);

// Get payments by customer
router.get('/customer/:customer_id', paymentController.getPaymentsByCustomer);

// Get payments by supplier
router.get('/supplier/:supplier_id', paymentController.getPaymentsBySupplier);

// Get payment by ID
router.get('/:id', paymentController.getPaymentById);

// Create new payment
router.post('/', paymentController.createPayment);

// Update payment
router.put('/:id', paymentController.updatePayment);

// Update payment status
router.patch('/:id/status', paymentController.updatePaymentStatus);

// Delete payment (soft delete)
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
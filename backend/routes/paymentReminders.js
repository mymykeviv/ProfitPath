const express = require('express');
const router = express.Router();
const paymentReminderController = require('../controllers/paymentReminderController');

// Get all payment reminders with filtering and pagination
router.get('/', paymentReminderController.getAllPaymentReminders);

// Get aging report
router.get('/aging-report', paymentReminderController.getAgingReport);

// Get pending reminders
router.get('/pending', paymentReminderController.getPendingReminders);

// Get overdue reminders
router.get('/overdue', paymentReminderController.getOverdueReminders);

// Get reminders due today
router.get('/due-today', paymentReminderController.getRemindersDueToday);

// Update overdue days for all active reminders
router.patch('/update-overdue-days', paymentReminderController.updateOverdueDays);

// Get payment reminder by ID
router.get('/:id', paymentReminderController.getPaymentReminderById);

// Create new payment reminder
router.post('/', paymentReminderController.createPaymentReminder);

// Update payment reminder
router.put('/:id', paymentReminderController.updatePaymentReminder);

// Mark reminder as sent
router.patch('/:id/sent', paymentReminderController.markReminderAsSent);

// Mark reminder as acknowledged
router.patch('/:id/acknowledged', paymentReminderController.markReminderAsAcknowledged);

// Mark reminder as resolved
router.patch('/:id/resolved', paymentReminderController.markReminderAsResolved);

// Escalate reminder
router.patch('/:id/escalate', paymentReminderController.escalateReminder);

// Delete payment reminder (soft delete)
router.delete('/:id', paymentReminderController.deletePaymentReminder);

module.exports = router;
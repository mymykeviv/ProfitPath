const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCustomerId,
  validateCustomerQuery,
  validateCustomerStatsQuery
} = require('../middleware/customerValidation');

// Get all customers with filtering and pagination
router.get('/', validateCustomerQuery, customerController.getAllCustomers);

// Get customer statistics
router.get('/statistics', validateCustomerStatsQuery, customerController.getCustomerStatistics);

// Get active customers
router.get('/active', validateCustomerQuery, customerController.getActiveCustomers);

// Get customers by type
router.get('/type/:type', validateCustomerQuery, customerController.getCustomersByType);

// Search customers
router.get('/search', validateCustomerQuery, customerController.searchCustomers);

// Get customers over credit limit
router.get('/over-credit-limit', validateCustomerQuery, customerController.getOverCreditLimitCustomers);

// Get top customers by sales
router.get('/top-customers', validateCustomerQuery, customerController.getTopCustomersBySales);

// Get customer by ID
router.get('/:id', validateCustomerId, customerController.getCustomerById);

// Create new customer
router.post('/', validateCreateCustomer, customerController.createCustomer);

// Update customer
router.put('/:id', validateUpdateCustomer, customerController.updateCustomer);

// Activate customer
router.patch('/:id/activate', validateCustomerId, customerController.activateCustomer);

// Soft delete customer
router.delete('/:id', validateCustomerId, customerController.deleteCustomer);

module.exports = router;
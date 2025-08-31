const express = require('express');
const { body, param, query } = require('express-validator');
const BatchController = require('../controllers/batchController');
const router = express.Router();

// Validation middleware
const validateBatch = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID is required and must be a positive integer'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity is required and must be a positive integer'),
  body('cost_per_unit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost per unit must be a positive number'),
  body('manufacturing_date')
    .optional()
    .isISO8601()
    .withMessage('Manufacturing date must be a valid date'),
  body('expiry_date')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  body('received_date')
    .optional()
    .isISO8601()
    .withMessage('Received date must be a valid date'),
  body('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),
  body('purchase_order_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a positive integer'),
  body('production_batch_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Production batch ID must be a positive integer'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters'),
  body('quality_status')
    .optional()
    .isIn(['pending', 'passed', 'failed', 'quarantine'])
    .withMessage('Quality status must be pending, passed, failed, or quarantine'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

const validateBatchUpdate = [
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('cost_per_unit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost per unit must be a positive number'),
  body('manufacturing_date')
    .optional()
    .isISO8601()
    .withMessage('Manufacturing date must be a valid date'),
  body('expiry_date')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  body('received_date')
    .optional()
    .isISO8601()
    .withMessage('Received date must be a valid date'),
  body('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),
  body('purchase_order_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a positive integer'),
  body('production_batch_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Production batch ID must be a positive integer'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters'),
  body('status')
    .optional()
    .isIn(['active', 'consumed', 'expired', 'damaged', 'returned'])
    .withMessage('Status must be active, consumed, expired, damaged, or returned'),
  body('quality_status')
    .optional()
    .isIn(['pending', 'passed', 'failed', 'quarantine'])
    .withMessage('Quality status must be pending, passed, failed, or quarantine'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

const validateConsumption = [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity is required and must be a positive integer')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const validateProductId = [
  param('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateQuantity = [
  query('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity is required and must be a positive integer')
];

// Routes

// GET /api/batches - Get all batches with filtering and pagination
router.get('/', validatePagination, BatchController.getAllBatches);

// GET /api/batches/expired - Get expired batches
router.get('/expired', BatchController.getExpiredBatches);

// GET /api/batches/expiring-soon - Get expiring soon batches
router.get('/expiring-soon', BatchController.getExpiringSoonBatches);

// GET /api/batches/stats - Get batch statistics
router.get('/stats', BatchController.getBatchStats);

// GET /api/batches/product/:product_id - Get batches by product
router.get('/product/:product_id', validateProductId, BatchController.getBatchesByProduct);

// GET /api/batches/product/:product_id/fifo - Get FIFO allocation for product
router.get('/product/:product_id/fifo', validateProductId, validateQuantity, BatchController.getFIFOAllocation);

// GET /api/batches/product/:product_id/lifo - Get LIFO allocation for product
router.get('/product/:product_id/lifo', validateProductId, validateQuantity, BatchController.getLIFOAllocation);

// GET /api/batches/:id - Get batch by ID
router.get('/:id', validateId, BatchController.getBatchById);

// POST /api/batches - Create new batch
router.post('/', validateBatch, BatchController.createBatch);

// PUT /api/batches/:id - Update batch
router.put('/:id', validateId, validateBatchUpdate, BatchController.updateBatch);

// DELETE /api/batches/:id - Delete batch (soft delete)
router.delete('/:id', validateId, BatchController.deleteBatch);

// PATCH /api/batches/:id/consume - Consume from batch
router.patch('/:id/consume', validateId, validateConsumption, BatchController.consumeBatch);

module.exports = router;
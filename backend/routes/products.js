const express = require('express');
const { body, param, query } = require('express-validator');
const ProductController = require('../controllers/productController');
const router = express.Router();

// Validation middleware
const validateProduct = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters'),
  body('type')
    .isIn(['finished', 'raw', 'semi-finished'])
    .withMessage('Product type must be finished, raw, or semi-finished'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('unit_of_measure')
    .notEmpty()
    .withMessage('Unit of measure is required'),
  body('base_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('cost_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  body('selling_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  body('gst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST rate must be between 0 and 100'),
  body('min_stock_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
  body('max_stock_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum stock level must be a non-negative integer'),
  body('reorder_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  body('current_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current stock must be a non-negative integer'),
  body('hsn_code')
    .optional()
    .isLength({ min: 4, max: 8 })
    .withMessage('HSN code must be between 4 and 8 characters'),
  body('barcode')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Barcode must not exceed 50 characters'),
  body('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

const validateProductUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters'),
  body('type')
    .optional()
    .isIn(['finished', 'raw', 'semi-finished'])
    .withMessage('Product type must be finished, raw, or semi-finished'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('unit_of_measure')
    .optional()
    .notEmpty()
    .withMessage('Unit of measure cannot be empty'),
  body('base_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('cost_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  body('selling_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  body('gst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST rate must be between 0 and 100'),
  body('min_stock_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
  body('max_stock_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum stock level must be a non-negative integer'),
  body('reorder_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  body('current_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current stock must be a non-negative integer'),
  body('hsn_code')
    .optional()
    .isLength({ min: 4, max: 8 })
    .withMessage('HSN code must be between 4 and 8 characters'),
  body('barcode')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Barcode must not exceed 50 characters'),
  body('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

const validateStockUpdate = [
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('operation')
    .isIn(['add', 'subtract', 'set'])
    .withMessage('Operation must be add, subtract, or set')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
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

// Routes

// GET /api/products - Get all products with filtering and pagination
router.get('/', validatePagination, ProductController.getAllProducts);

// GET /api/products/low-stock - Get low stock products
router.get('/low-stock', ProductController.getLowStockProducts);

// GET /api/products/out-of-stock - Get out of stock products
router.get('/out-of-stock', ProductController.getOutOfStockProducts);

// GET /api/products/stats - Get product statistics
router.get('/stats', ProductController.getProductStats);

// GET /api/products/:id - Get product by ID
router.get('/:id', validateId, ProductController.getProductById);

// POST /api/products - Create new product
router.post('/', validateProduct, ProductController.createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', validateId, validateProductUpdate, ProductController.updateProduct);

// DELETE /api/products/:id - Delete product (soft delete)
router.delete('/:id', validateId, ProductController.deleteProduct);

// PATCH /api/products/:id/stock - Update product stock
router.patch('/:id/stock', validateId, validateStockUpdate, ProductController.updateStock);

module.exports = router;
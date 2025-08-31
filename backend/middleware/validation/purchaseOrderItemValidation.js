const { body, param, query } = require('express-validator');

// Validation for creating a new purchase order item
const validatePurchaseOrderItemCreation = [
  body('purchase_order_id')
    .notEmpty()
    .withMessage('Purchase order ID is required')
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a positive integer'),

  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  body('ordered_quantity')
    .notEmpty()
    .withMessage('Ordered quantity is required')
    .isFloat({ min: 0.01 })
    .withMessage('Ordered quantity must be greater than 0'),

  body('unit_price')
    .notEmpty()
    .withMessage('Unit price is required')
    .isFloat({ min: 0.01 })
    .withMessage('Unit price must be greater than 0'),

  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),

  body('gst_percentage')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('GST percentage must be between 0 and 50'),

  body('gst_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('GST amount must be a positive number'),

  body('line_total')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Line total must be a positive number'),

  body('expected_received_date')
    .optional()
    .isISO8601()
    .withMessage('Expected received date must be a valid date in ISO format')
    .toDate(),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
    .trim()
];

// Validation for updating a purchase order item
const validatePurchaseOrderItemUpdate = [
  body('ordered_quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Ordered quantity must be greater than 0'),

  body('unit_price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Unit price must be greater than 0'),

  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),

  body('gst_percentage')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('GST percentage must be between 0 and 50'),

  body('gst_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('GST amount must be a positive number'),

  body('line_total')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Line total must be a positive number'),

  body('expected_received_date')
    .optional()
    .isISO8601()
    .withMessage('Expected received date must be a valid date in ISO format')
    .toDate(),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
    .trim()
];

// Validation for receiving purchase order item
const validatePurchaseOrderItemReceive = [
  body('quantity')
    .notEmpty()
    .withMessage('Quantity to receive is required')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity to receive must be greater than 0'),

  body('batch_number')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Batch number must be between 1 and 50 characters')
    .trim(),

  body('expiry_date')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date in ISO format')
    .toDate()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),

  body('manufacturing_date')
    .optional()
    .isISO8601()
    .withMessage('Manufacturing date must be a valid date in ISO format')
    .toDate()
    .custom((value, { req }) => {
      if (new Date(value) > new Date()) {
        throw new Error('Manufacturing date cannot be in the future');
      }
      if (req.body.expiry_date && new Date(value) >= new Date(req.body.expiry_date)) {
        throw new Error('Manufacturing date must be before expiry date');
      }
      return true;
    }),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
    .trim()
];

// Validation for purchase order item ID parameter
const validatePurchaseOrderItemId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Purchase order item ID must be a positive integer')
];

// Validation for purchase order ID parameter
const validatePurchaseOrderIdParam = [
  param('purchase_order_id')
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a positive integer')
];

// Validation for product ID parameter
const validateProductIdParam = [
  param('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
];

// Validation for purchase order item query parameters
const validatePurchaseOrderItemQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('purchase_order_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a positive integer'),

  query('product_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  query('status')
    .optional()
    .isIn(['pending', 'partially_received', 'received', 'cancelled'])
    .withMessage('Status must be pending, partially_received, received, or cancelled'),

  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date in ISO format'),

  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date in ISO format')
    .custom((value, { req }) => {
      if (req.query.date_from && new Date(value) < new Date(req.query.date_from)) {
        throw new Error('Date to must be after date from');
      }
      return true;
    }),

  query('sort_by')
    .optional()
    .isIn(['line_number', 'ordered_quantity', 'received_quantity', 'unit_price', 'line_total', 'expected_received_date', 'created_at', 'updated_at'])
    .withMessage('sort_by must be line_number, ordered_quantity, received_quantity, unit_price, line_total, expected_received_date, created_at, or updated_at'),

  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('sort_order must be ASC or DESC'),

  query('include_product')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('include_product must be true or false'),

  query('include_purchase_order')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('include_purchase_order must be true or false'),

  query('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer')
];

// Validation for quantity parameter
const validateQuantityParam = [
  query('quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0')
];

module.exports = {
  validatePurchaseOrderItemCreation,
  validatePurchaseOrderItemUpdate,
  validatePurchaseOrderItemReceive,
  validatePurchaseOrderItemId,
  validatePurchaseOrderIdParam,
  validateProductIdParam,
  validatePurchaseOrderItemQuery,
  validateQuantityParam
};
const { body, param, query } = require('express-validator');

// Validation for creating a new purchase order
const validatePurchaseOrderCreation = [
  body('supplier_id')
    .notEmpty()
    .withMessage('Supplier ID is required')
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),

  body('po_number')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('PO number must be between 3 and 50 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('PO number can only contain uppercase letters, numbers, hyphens, and underscores')
    .trim(),

  body('po_date')
    .optional()
    .isISO8601()
    .withMessage('PO date must be a valid date in ISO format')
    .toDate(),

  body('expected_delivery_date')
    .notEmpty()
    .withMessage('Expected delivery date is required')
    .isISO8601()
    .withMessage('Expected delivery date must be a valid date in ISO format')
    .toDate()
    .custom((value, { req }) => {
      const poDate = req.body.po_date ? new Date(req.body.po_date) : new Date();
      if (new Date(value) <= poDate) {
        throw new Error('Expected delivery date must be after PO date');
      }
      return true;
    }),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),

  body('status')
    .optional()
    .isIn(['draft', 'approved', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'])
    .withMessage('Status must be draft, approved, sent, confirmed, partially_received, received, or cancelled'),

  body('subtotal_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Subtotal amount must be a positive number'),

  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),

  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('tax_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax amount must be a positive number'),

  body('shipping_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping amount must be a positive number'),

  body('other_charges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Other charges must be a positive number'),

  body('total_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('payment_terms')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Payment terms must be between 0 and 365 days'),

  body('billing_address_line1')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Billing address line 1 must be between 5 and 200 characters')
    .trim(),

  body('billing_address_line2')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Billing address line 2 must not exceed 200 characters')
    .trim(),

  body('billing_city')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Billing city must be between 2 and 50 characters')
    .trim(),

  body('billing_state')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Billing state must be between 2 and 50 characters')
    .trim(),

  body('billing_postal_code')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Billing postal code must be 6 digits')
    .trim(),

  body('shipping_address_line1')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Shipping address line 1 must be between 5 and 200 characters')
    .trim(),

  body('shipping_address_line2')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Shipping address line 2 must not exceed 200 characters')
    .trim(),

  body('shipping_city')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Shipping city must be between 2 and 50 characters')
    .trim(),

  body('shipping_state')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Shipping state must be between 2 and 50 characters')
    .trim(),

  body('shipping_postal_code')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Shipping postal code must be 6 digits')
    .trim(),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
    .trim(),

  body('terms_and_conditions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Terms and conditions must not exceed 2000 characters')
    .trim(),

  body('approved_by')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Approved by must be between 2 and 100 characters')
    .trim(),

  // Validation for items array if provided
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least one item'),

  body('items.*.product_id')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Product ID is required for each item')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  body('items.*.ordered_quantity')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Ordered quantity is required for each item')
    .isFloat({ min: 0.01 })
    .withMessage('Ordered quantity must be greater than 0'),

  body('items.*.unit_price')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Unit price is required for each item')
    .isFloat({ min: 0.01 })
    .withMessage('Unit price must be greater than 0'),

  body('items.*.discount_percentage')
    .if(body('items').exists())
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Item discount percentage must be between 0 and 100'),

  body('items.*.gst_percentage')
    .if(body('items').exists())
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('GST percentage must be between 0 and 50'),

  body('items.*.expected_received_date')
    .if(body('items').exists())
    .optional()
    .isISO8601()
    .withMessage('Expected received date must be a valid date in ISO format')
    .toDate()
];

// Validation for updating a purchase order
const validatePurchaseOrderUpdate = [
  body('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),

  body('po_number')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('PO number must be between 3 and 50 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('PO number can only contain uppercase letters, numbers, hyphens, and underscores')
    .trim(),

  body('po_date')
    .optional()
    .isISO8601()
    .withMessage('PO date must be a valid date in ISO format')
    .toDate(),

  body('expected_delivery_date')
    .optional()
    .isISO8601()
    .withMessage('Expected delivery date must be a valid date in ISO format')
    .toDate(),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),

  body('status')
    .optional()
    .isIn(['draft', 'approved', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'])
    .withMessage('Status must be draft, approved, sent, confirmed, partially_received, received, or cancelled'),

  body('subtotal_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Subtotal amount must be a positive number'),

  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),

  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('tax_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax amount must be a positive number'),

  body('shipping_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping amount must be a positive number'),

  body('other_charges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Other charges must be a positive number'),

  body('total_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('payment_terms')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Payment terms must be between 0 and 365 days'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
    .trim(),

  body('terms_and_conditions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Terms and conditions must not exceed 2000 characters')
    .trim(),

  body('approved_by')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Approved by must be between 2 and 100 characters')
    .trim()
];

// Validation for purchase order approval
const validatePurchaseOrderApproval = [
  body('approved_by')
    .notEmpty()
    .withMessage('Approved by is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Approved by must be between 2 and 100 characters')
    .trim()
];

// Validation for purchase order cancellation
const validatePurchaseOrderCancellation = [
  body('reason')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('Cancellation reason must be between 5 and 500 characters')
    .trim()
];

// Validation for purchase order ID parameter
const validatePurchaseOrderId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a positive integer')
];

// Validation for supplier ID parameter
const validateSupplierIdParam = [
  param('supplier_id')
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer')
];

// Validation for purchase order query parameters
const validatePurchaseOrderQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim(),

  query('status')
    .optional()
    .isIn(['draft', 'approved', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'])
    .withMessage('Status must be draft, approved, sent, confirmed, partially_received, received, or cancelled'),

  query('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),

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
    .isIn(['po_number', 'po_date', 'expected_delivery_date', 'total_amount', 'status', 'created_at', 'updated_at'])
    .withMessage('sort_by must be po_number, po_date, expected_delivery_date, total_amount, status, created_at, or updated_at'),

  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('sort_order must be ASC or DESC'),

  query('include_items')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('include_items must be true or false'),

  query('include_supplier')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('include_supplier must be true or false')
];

module.exports = {
  validatePurchaseOrderCreation,
  validatePurchaseOrderUpdate,
  validatePurchaseOrderApproval,
  validatePurchaseOrderCancellation,
  validatePurchaseOrderId,
  validateSupplierIdParam,
  validatePurchaseOrderQuery
};
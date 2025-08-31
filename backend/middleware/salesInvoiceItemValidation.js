const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validate sales invoice item creation
const validateCreateSalesInvoiceItem = [
  body('sales_invoice_id')
    .isInt({ min: 1 })
    .withMessage('Sales invoice ID must be a positive integer'),

  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  body('line_number')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Line number must be a positive integer'),

  body('quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),

  body('unit_price')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),

  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),

  body('gst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST rate must be between 0 and 100'),

  body('cgst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('CGST rate must be between 0 and 100'),

  body('sgst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('SGST rate must be between 0 and 100'),

  body('igst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('IGST rate must be between 0 and 100'),

  body('cess_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Cess rate must be between 0 and 100'),

  body('batch_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Batch ID must be a positive integer'),

  body('batch_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Batch number must not exceed 50 characters')
    .trim(),

  body('expiry_date')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO 8601 date'),

  body('manufacturing_date')
    .optional()
    .isISO8601()
    .withMessage('Manufacturing date must be a valid ISO 8601 date'),

  body('serial_numbers')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Serial numbers must not exceed 500 characters')
    .trim(),

  body('warranty_months')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Warranty months must be between 0 and 120'),

  body('warranty_start_date')
    .optional()
    .isISO8601()
    .withMessage('Warranty start date must be a valid ISO 8601 date'),

  body('warranty_end_date')
    .optional()
    .isISO8601()
    .withMessage('Warranty end date must be a valid ISO 8601 date'),

  body('cost_per_unit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost per unit must be a positive number'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
    .trim(),

  handleValidationErrors
];

// Validate sales invoice item update
const validateUpdateSalesInvoiceItem = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Sales invoice item ID must be a positive integer'),

  body('sales_invoice_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sales invoice ID must be a positive integer'),

  body('product_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  body('line_number')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Line number must be a positive integer'),

  body('quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),

  body('unit_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),

  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),

  body('gst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST rate must be between 0 and 100'),

  body('cgst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('CGST rate must be between 0 and 100'),

  body('sgst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('SGST rate must be between 0 and 100'),

  body('igst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('IGST rate must be between 0 and 100'),

  body('cess_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Cess rate must be between 0 and 100'),

  body('batch_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Batch ID must be a positive integer'),

  body('batch_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Batch number must not exceed 50 characters')
    .trim(),

  body('expiry_date')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO 8601 date'),

  body('manufacturing_date')
    .optional()
    .isISO8601()
    .withMessage('Manufacturing date must be a valid ISO 8601 date'),

  body('serial_numbers')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Serial numbers must not exceed 500 characters')
    .trim(),

  body('warranty_months')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Warranty months must be between 0 and 120'),

  body('warranty_start_date')
    .optional()
    .isISO8601()
    .withMessage('Warranty start date must be a valid ISO 8601 date'),

  body('warranty_end_date')
    .optional()
    .isISO8601()
    .withMessage('Warranty end date must be a valid ISO 8601 date'),

  body('cost_per_unit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost per unit must be a positive number'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
    .trim(),

  handleValidationErrors
];

// Validate sales invoice item ID parameter
const validateSalesInvoiceItemId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Sales invoice item ID must be a positive integer'),

  handleValidationErrors
];

// Validate sales invoice ID parameter
const validateSalesInvoiceId = [
  param('sales_invoice_id')
    .isInt({ min: 1 })
    .withMessage('Sales invoice ID must be a positive integer'),

  handleValidationErrors
];

// Validate product ID parameter
const validateProductId = [
  param('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  handleValidationErrors
];

// Validate query parameters for listing sales invoice items
const validateSalesInvoiceItemQuery = [
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
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .trim(),

  query('sales_invoice_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sales invoice ID must be a positive integer'),

  query('product_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  query('batch_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Batch ID must be a positive integer'),

  query('sort_by')
    .optional()
    .isIn(['line_number', 'product_name', 'quantity', 'unit_price', 'line_total', 'created_at'])
    .withMessage('sort_by must be one of: line_number, product_name, quantity, unit_price, line_total, created_at'),

  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('sort_order must be ASC or DESC'),

  query('include_invoice')
    .optional()
    .isBoolean()
    .withMessage('include_invoice must be a boolean value'),

  query('include_product')
    .optional()
    .isBoolean()
    .withMessage('include_product must be a boolean value'),

  query('include_batch')
    .optional()
    .isBoolean()
    .withMessage('include_batch must be a boolean value'),

  handleValidationErrors
];

// Validate analytics query parameters
const validateAnalyticsQuery = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid ISO 8601 date'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date must be a valid ISO 8601 date'),

  query('product_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  query('customer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors
];

// Validate top selling products query
const validateTopSellingQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid ISO 8601 date'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date must be a valid ISO 8601 date'),

  handleValidationErrors
];

// Validate profit analysis query
const validateProfitAnalysisQuery = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid ISO 8601 date'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date must be a valid ISO 8601 date'),

  query('product_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  query('customer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),

  handleValidationErrors
];

module.exports = {
  validateCreateSalesInvoiceItem,
  validateUpdateSalesInvoiceItem,
  validateSalesInvoiceItemId,
  validateSalesInvoiceId,
  validateProductId,
  validateSalesInvoiceItemQuery,
  validateAnalyticsQuery,
  validateTopSellingQuery,
  validateProfitAnalysisQuery,
  handleValidationErrors
};
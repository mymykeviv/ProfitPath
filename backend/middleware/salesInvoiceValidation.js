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

// Validate sales invoice creation
const validateCreateSalesInvoice = [
  body('customer_id')
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),

  body('invoice_number')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invoice number must be between 1 and 50 characters')
    .trim(),

  body('invoice_date')
    .isISO8601()
    .withMessage('Invoice date must be a valid ISO 8601 date'),

  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),

  body('reference_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Reference number must not exceed 50 characters')
    .trim(),

  body('status')
    .optional()
    .isIn(['draft', 'pending', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'])
    .withMessage('Status must be one of: draft, pending, sent, paid, partially_paid, overdue, cancelled'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('subtotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),

  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),

  body('cgst_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('CGST amount must be a positive number'),

  body('sgst_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('SGST amount must be a positive number'),

  body('igst_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('IGST amount must be a positive number'),

  body('cess_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cess amount must be a positive number'),

  body('shipping_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping amount must be a positive number'),

  body('adjustment_amount')
    .optional()
    .isFloat()
    .withMessage('Adjustment amount must be a number'),

  body('total_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('paid_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Paid amount must be a positive number'),

  body('payment_terms')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Payment terms must not exceed 200 characters')
    .trim(),

  body('payment_method')
    .optional()
    .isIn(['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'])
    .withMessage('Payment method must be one of: cash, cheque, bank_transfer, upi, card, other'),

  body('sales_person')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Sales person must not exceed 100 characters')
    .trim(),

  body('place_of_supply')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Place of supply must not exceed 100 characters')
    .trim(),

  // Billing address validation
  body('billing_address.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Billing street address must not exceed 200 characters')
    .trim(),

  body('billing_address.city')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Billing city must not exceed 50 characters')
    .trim(),

  body('billing_address.state')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Billing state must not exceed 50 characters')
    .trim(),

  body('billing_address.postal_code')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Billing postal code must be 6 digits'),

  body('billing_address.country')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Billing country must not exceed 50 characters')
    .trim(),

  // Shipping address validation
  body('shipping_address.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Shipping street address must not exceed 200 characters')
    .trim(),

  body('shipping_address.city')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Shipping city must not exceed 50 characters')
    .trim(),

  body('shipping_address.state')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Shipping state must not exceed 50 characters')
    .trim(),

  body('shipping_address.postal_code')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Shipping postal code must be 6 digits'),

  body('shipping_address.country')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Shipping country must not exceed 50 characters')
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

  // Items validation
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least one item'),

  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),

  body('items.*.unit_price')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),

  body('items.*.discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Item discount percentage must be between 0 and 100'),

  body('items.*.batch_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Batch ID must be a positive integer'),

  body('items.*.serial_numbers')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Serial numbers must not exceed 500 characters')
    .trim(),

  body('items.*.warranty_months')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Warranty months must be between 0 and 120'),

  body('items.*.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Item notes must not exceed 500 characters')
    .trim(),

  handleValidationErrors
];

// Validate sales invoice update
const validateUpdateSalesInvoice = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Sales invoice ID must be a positive integer'),

  body('customer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),

  body('invoice_number')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invoice number must be between 1 and 50 characters')
    .trim(),

  body('invoice_date')
    .optional()
    .isISO8601()
    .withMessage('Invoice date must be a valid ISO 8601 date'),

  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),

  body('reference_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Reference number must not exceed 50 characters')
    .trim(),

  body('status')
    .optional()
    .isIn(['draft', 'pending', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'])
    .withMessage('Status must be one of: draft, pending, sent, paid, partially_paid, overdue, cancelled'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('subtotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),

  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),

  body('payment_terms')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Payment terms must not exceed 200 characters')
    .trim(),

  body('payment_method')
    .optional()
    .isIn(['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'])
    .withMessage('Payment method must be one of: cash, cheque, bank_transfer, upi, card, other'),

  body('sales_person')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Sales person must not exceed 100 characters')
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

  handleValidationErrors
];

// Validate sales invoice ID parameter
const validateSalesInvoiceId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Sales invoice ID must be a positive integer'),

  handleValidationErrors
];

// Validate customer ID parameter
const validateCustomerId = [
  param('customer_id')
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),

  handleValidationErrors
];

// Validate query parameters for listing sales invoices
const validateSalesInvoiceQuery = [
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

  query('status')
    .optional()
    .isIn(['draft', 'pending', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'])
    .withMessage('Status must be one of: draft, pending, sent, paid, partially_paid, overdue, cancelled'),

  query('customer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

  query('sales_person')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Sales person must be between 1 and 100 characters')
    .trim(),

  query('sort_by')
    .optional()
    .isIn(['invoice_number', 'invoice_date', 'due_date', 'total_amount', 'status', 'customer_name', 'created_at'])
    .withMessage('sort_by must be one of: invoice_number, invoice_date, due_date, total_amount, status, customer_name, created_at'),

  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('sort_order must be ASC or DESC'),

  query('include_items')
    .optional()
    .isBoolean()
    .withMessage('include_items must be a boolean value'),

  query('include_customer')
    .optional()
    .isBoolean()
    .withMessage('include_customer must be a boolean value'),

  handleValidationErrors
];

// Validate payment recording
const validateRecordPayment = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Sales invoice ID must be a positive integer'),

  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),

  body('payment_method')
    .isIn(['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'])
    .withMessage('Payment method must be one of: cash, cheque, bank_transfer, upi, card, other'),

  body('payment_date')
    .optional()
    .isISO8601()
    .withMessage('Payment date must be a valid ISO 8601 date'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Payment notes must not exceed 500 characters')
    .trim(),

  handleValidationErrors
];

// Validate cancellation
const validateCancelInvoice = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Sales invoice ID must be a positive integer'),

  body('cancellation_reason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Cancellation reason must be between 5 and 500 characters')
    .trim(),

  handleValidationErrors
];

// Validate sales statistics query
const validateSalesStatsQuery = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid ISO 8601 date'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date must be a valid ISO 8601 date'),

  query('customer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),

  query('sales_person')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Sales person must be between 1 and 100 characters')
    .trim(),

  handleValidationErrors
];

module.exports = {
  validateCreateSalesInvoice,
  validateUpdateSalesInvoice,
  validateSalesInvoiceId,
  validateCustomerId,
  validateSalesInvoiceQuery,
  validateRecordPayment,
  validateCancelInvoice,
  validateSalesStatsQuery,
  handleValidationErrors
};
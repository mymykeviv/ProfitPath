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

// Validate customer creation
const validateCreateCustomer = [
  body('name')
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters')
    .trim(),

  body('customer_code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Customer code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Customer code can only contain uppercase letters, numbers, hyphens, and underscores')
    .trim(),

  body('type')
    .isIn(['individual', 'business', 'government', 'non_profit'])
    .withMessage('Customer type must be one of: individual, business, government, non_profit'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('alternate_phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid alternate phone number'),

  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),

  body('gst_number')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please provide a valid GST number (15 characters)'),

  body('pan_number')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Please provide a valid PAN number (10 characters)'),

  body('credit_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a positive number'),

  body('credit_days')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Credit days must be between 0 and 365'),

  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  // Address validation
  body('address.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Street address must not exceed 200 characters')
    .trim(),

  body('address.city')
    .optional()
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters')
    .trim(),

  body('address.state')
    .optional()
    .isLength({ max: 50 })
    .withMessage('State must not exceed 50 characters')
    .trim(),

  body('address.postal_code')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Postal code must be 6 digits'),

  body('address.country')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Country must not exceed 50 characters')
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

  handleValidationErrors
];

// Validate customer update
const validateUpdateCustomer = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),

  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters')
    .trim(),

  body('customer_code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Customer code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Customer code can only contain uppercase letters, numbers, hyphens, and underscores')
    .trim(),

  body('type')
    .optional()
    .isIn(['individual', 'business', 'government', 'non_profit'])
    .withMessage('Customer type must be one of: individual, business, government, non_profit'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('alternate_phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid alternate phone number'),

  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),

  body('gst_number')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please provide a valid GST number (15 characters)'),

  body('pan_number')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Please provide a valid PAN number (10 characters)'),

  body('credit_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a positive number'),

  body('credit_days')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Credit days must be between 0 and 365'),

  body('discount_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'blacklisted'])
    .withMessage('Status must be one of: active, inactive, suspended, blacklisted'),

  // Address validation
  body('address.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Street address must not exceed 200 characters')
    .trim(),

  body('address.city')
    .optional()
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters')
    .trim(),

  body('address.state')
    .optional()
    .isLength({ max: 50 })
    .withMessage('State must not exceed 50 characters')
    .trim(),

  body('address.postal_code')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Postal code must be 6 digits'),

  body('address.country')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Country must not exceed 50 characters')
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

  handleValidationErrors
];

// Validate customer ID parameter
const validateCustomerId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),

  handleValidationErrors
];

// Validate query parameters for listing customers
const validateCustomerQuery = [
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

  query('type')
    .optional()
    .isIn(['individual', 'business', 'government', 'non_profit'])
    .withMessage('Customer type must be one of: individual, business, government, non_profit'),

  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'blacklisted'])
    .withMessage('Status must be one of: active, inactive, suspended, blacklisted'),

  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),

  query('sort_by')
    .optional()
    .isIn(['name', 'customer_code', 'type', 'created_at', 'updated_at', 'credit_limit', 'total_sales'])
    .withMessage('sort_by must be one of: name, customer_code, type, created_at, updated_at, credit_limit, total_sales'),

  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('sort_order must be ASC or DESC'),

  query('include_invoices')
    .optional()
    .isBoolean()
    .withMessage('include_invoices must be a boolean value'),

  handleValidationErrors
];

// Validate customer statistics query
const validateCustomerStatsQuery = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid ISO 8601 date'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date must be a valid ISO 8601 date'),

  query('type')
    .optional()
    .isIn(['individual', 'business', 'government', 'non_profit'])
    .withMessage('Customer type must be one of: individual, business, government, non_profit'),

  handleValidationErrors
];

module.exports = {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCustomerId,
  validateCustomerQuery,
  validateCustomerStatsQuery,
  handleValidationErrors
};
const { body, param, query } = require('express-validator');

// Validation for creating a new supplier
const validateSupplierCreation = [
  body('name')
    .notEmpty()
    .withMessage('Supplier name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters')
    .trim(),

  body('supplier_code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Supplier code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Supplier code can only contain uppercase letters, numbers, hyphens, and underscores')
    .trim(),

  body('supplier_type')
    .isIn(['raw_material', 'finished_goods', 'services', 'both'])
    .withMessage('Supplier type must be raw_material, finished_goods, services, or both'),

  body('contact_person')
    .notEmpty()
    .withMessage('Contact person is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact person name must be between 2 and 100 characters')
    .trim(),

  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Phone number must be between 10-15 digits and can contain +, -, (), and spaces')
    .trim(),

  body('address_line1')
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters')
    .trim(),

  body('address_line2')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must not exceed 200 characters')
    .trim(),

  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
    .trim(),

  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters')
    .trim(),

  body('postal_code')
    .notEmpty()
    .withMessage('Postal code is required')
    .matches(/^[0-9]{6}$/)
    .withMessage('Postal code must be 6 digits')
    .trim(),

  body('country')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
    .trim(),

  body('gst_number')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('GST number must be in valid format (e.g., 22AAAAA0000A1Z5)')
    .trim(),

  body('pan_number')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('PAN number must be in valid format (e.g., ABCDE1234F)')
    .trim(),

  body('bank_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be between 2 and 100 characters')
    .trim(),

  body('bank_account_number')
    .optional()
    .matches(/^[0-9]{9,18}$/)
    .withMessage('Bank account number must be between 9-18 digits')
    .trim(),

  body('bank_ifsc_code')
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('IFSC code must be in valid format (e.g., ABCD0123456)')
    .trim(),

  body('payment_terms')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Payment terms must be between 0 and 365 days'),

  body('credit_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a positive number'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
    .trim()
];

// Validation for updating a supplier
const validateSupplierUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters')
    .trim(),

  body('supplier_code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Supplier code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Supplier code can only contain uppercase letters, numbers, hyphens, and underscores')
    .trim(),

  body('supplier_type')
    .optional()
    .isIn(['raw_material', 'finished_goods', 'services', 'both'])
    .withMessage('Supplier type must be raw_material, finished_goods, services, or both'),

  body('contact_person')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact person name must be between 2 and 100 characters')
    .trim(),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  body('phone')
    .optional()
    .matches(/^[+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Phone number must be between 10-15 digits and can contain +, -, (), and spaces')
    .trim(),

  body('address_line1')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters')
    .trim(),

  body('address_line2')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must not exceed 200 characters')
    .trim(),

  body('city')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
    .trim(),

  body('state')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters')
    .trim(),

  body('postal_code')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Postal code must be 6 digits')
    .trim(),

  body('country')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
    .trim(),

  body('gst_number')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('GST number must be in valid format (e.g., 22AAAAA0000A1Z5)')
    .trim(),

  body('pan_number')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('PAN number must be in valid format (e.g., ABCDE1234F)')
    .trim(),

  body('bank_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be between 2 and 100 characters')
    .trim(),

  body('bank_account_number')
    .optional()
    .matches(/^[0-9]{9,18}$/)
    .withMessage('Bank account number must be between 9-18 digits')
    .trim(),

  body('bank_ifsc_code')
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('IFSC code must be in valid format (e.g., ABCD0123456)')
    .trim(),

  body('payment_terms')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Payment terms must be between 0 and 365 days'),

  body('credit_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a positive number'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
    .trim()
];

// Validation for supplier ID parameter
const validateSupplierId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer')
];

// Validation for supplier type parameter
const validateSupplierType = [
  param('type')
    .isIn(['raw_material', 'finished_goods', 'services', 'both'])
    .withMessage('Supplier type must be raw_material, finished_goods, services, or both')
];

// Validation for supplier query parameters
const validateSupplierQuery = [
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

  query('supplier_type')
    .optional()
    .isIn(['raw_material', 'finished_goods', 'services', 'both'])
    .withMessage('Supplier type must be raw_material, finished_goods, services, or both'),

  query('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_active must be true or false'),

  query('sort_by')
    .optional()
    .isIn(['name', 'supplier_code', 'created_at', 'updated_at', 'rating'])
    .withMessage('sort_by must be name, supplier_code, created_at, updated_at, or rating'),

  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('sort_order must be ASC or DESC'),

  query('include_orders')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('include_orders must be true or false'),

  query('force')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('force must be true or false')
];

// Validation for supplier search
const validateSupplierSearch = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim()
];

module.exports = {
  validateSupplierCreation,
  validateSupplierUpdate,
  validateSupplierId,
  validateSupplierType,
  validateSupplierQuery,
  validateSupplierSearch
};
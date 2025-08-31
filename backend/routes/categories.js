const express = require('express');
const { body, param, query } = require('express-validator');
const CategoryController = require('../controllers/categoryController');
const router = express.Router();

// Validation middleware
const validateCategory = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent ID must be a positive integer'),
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('color_code')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color code must be a valid hex color (e.g., #FF0000)'),
  body('icon')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters')
];

const validateCategoryUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent ID must be a positive integer'),
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('color_code')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color code must be a valid hex color (e.g., #FF0000)'),
  body('icon')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters')
];

const validateSortOrder = [
  body('categories')
    .isArray({ min: 1 })
    .withMessage('Categories array is required'),
  body('categories.*.id')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('categories.*.sort_order')
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
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

// GET /api/categories - Get all categories with optional tree structure
router.get('/', validatePagination, CategoryController.getAllCategories);

// GET /api/categories/roots - Get root categories
router.get('/roots', CategoryController.getRootCategories);

// GET /api/categories/tree - Get category tree structure
router.get('/tree', CategoryController.getAllCategories);

// GET /api/categories/stats - Get category statistics
router.get('/stats', CategoryController.getCategoryStats);

// GET /api/categories/path/:path - Get category by path
router.get('/path/:path', CategoryController.getCategoryByPath);

// GET /api/categories/:id - Get category by ID
router.get('/:id', validateId, CategoryController.getCategoryById);

// GET /api/categories/:id/children - Get category children
router.get('/:id/children', validateId, CategoryController.getCategoryChildren);

// POST /api/categories - Create new category
router.post('/', validateCategory, CategoryController.createCategory);

// PUT /api/categories/:id - Update category
router.put('/:id', validateId, validateCategoryUpdate, CategoryController.updateCategory);

// DELETE /api/categories/:id - Delete category (soft delete)
router.delete('/:id', validateId, CategoryController.deleteCategory);

// PATCH /api/categories/sort-order - Update category sort order
router.patch('/sort-order', validateSortOrder, CategoryController.updateSortOrder);

module.exports = router;
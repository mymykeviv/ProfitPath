const express = require('express');
const router = express.Router();
const SupplierController = require('../controllers/supplierController');
const {
  validateSupplierCreation,
  validateSupplierUpdate,
  validateSupplierId,
  validateSupplierType,
  validateSupplierQuery,
  validateSupplierSearch
} = require('../middleware/validation/supplierValidation');

// Get all suppliers with filtering and pagination
router.get('/',
  validateSupplierQuery,
  SupplierController.getAllSuppliers
);

// Get supplier statistics
router.get('/stats',
  SupplierController.getSupplierStats
);

// Get active suppliers
router.get('/active',
  SupplierController.getActiveSuppliers
);

// Search suppliers
router.get('/search',
  validateSupplierSearch,
  SupplierController.searchSuppliers
);

// Get suppliers by type
router.get('/type/:type',
  validateSupplierType,
  SupplierController.getSuppliersByType
);

// Get supplier by ID
router.get('/:id',
  validateSupplierId,
  validateSupplierQuery,
  SupplierController.getSupplierById
);

// Create new supplier
router.post('/',
  validateSupplierCreation,
  SupplierController.createSupplier
);

// Update supplier
router.put('/:id',
  validateSupplierId,
  validateSupplierUpdate,
  SupplierController.updateSupplier
);

// Activate supplier
router.patch('/:id/activate',
  validateSupplierId,
  SupplierController.activateSupplier
);

// Delete supplier (soft delete)
router.delete('/:id',
  validateSupplierId,
  validateSupplierQuery,
  SupplierController.deleteSupplier
);

module.exports = router;
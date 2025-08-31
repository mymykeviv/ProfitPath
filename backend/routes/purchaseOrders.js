const express = require('express');
const router = express.Router();
const PurchaseOrderController = require('../controllers/purchaseOrderController');
const {
  validatePurchaseOrderCreation,
  validatePurchaseOrderUpdate,
  validatePurchaseOrderApproval,
  validatePurchaseOrderCancellation,
  validatePurchaseOrderId,
  validateSupplierIdParam,
  validatePurchaseOrderQuery
} = require('../middleware/validation/purchaseOrderValidation');

// Get all purchase orders with filtering and pagination
router.get('/',
  validatePurchaseOrderQuery,
  PurchaseOrderController.getAllPurchaseOrders
);

// Get purchase order statistics
router.get('/stats',
  PurchaseOrderController.getPurchaseOrderStats
);

// Get pending purchase orders
router.get('/pending',
  PurchaseOrderController.getPendingOrders
);

// Get overdue purchase orders
router.get('/overdue',
  PurchaseOrderController.getOverdueOrders
);

// Get purchase orders by supplier
router.get('/supplier/:supplier_id',
  validateSupplierIdParam,
  validatePurchaseOrderQuery,
  PurchaseOrderController.getOrdersBySupplier
);

// Get purchase order by ID
router.get('/:id',
  validatePurchaseOrderId,
  validatePurchaseOrderQuery,
  PurchaseOrderController.getPurchaseOrderById
);

// Create new purchase order
router.post('/',
  validatePurchaseOrderCreation,
  PurchaseOrderController.createPurchaseOrder
);

// Update purchase order
router.put('/:id',
  validatePurchaseOrderId,
  validatePurchaseOrderUpdate,
  PurchaseOrderController.updatePurchaseOrder
);

// Approve purchase order
router.patch('/:id/approve',
  validatePurchaseOrderId,
  validatePurchaseOrderApproval,
  PurchaseOrderController.approvePurchaseOrder
);

// Send purchase order to supplier
router.patch('/:id/send',
  validatePurchaseOrderId,
  PurchaseOrderController.sendPurchaseOrder
);

// Cancel purchase order
router.patch('/:id/cancel',
  validatePurchaseOrderId,
  validatePurchaseOrderCancellation,
  PurchaseOrderController.cancelPurchaseOrder
);

module.exports = router;
const express = require('express');
const router = express.Router();
const PurchaseOrderItemController = require('../controllers/purchaseOrderItemController');
const {
  validatePurchaseOrderItemCreation,
  validatePurchaseOrderItemUpdate,
  validatePurchaseOrderItemReceive,
  validatePurchaseOrderItemId,
  validatePurchaseOrderIdParam,
  validateProductIdParam,
  validatePurchaseOrderItemQuery,
  validateQuantityParam
} = require('../middleware/validation/purchaseOrderItemValidation');

// Get all purchase order items with filtering and pagination
router.get('/',
  validatePurchaseOrderItemQuery,
  PurchaseOrderItemController.getAllItems
);

// Get pending purchase order items
router.get('/pending',
  validatePurchaseOrderItemQuery,
  PurchaseOrderItemController.getPendingItems
);

// Get overdue purchase order items
router.get('/overdue',
  PurchaseOrderItemController.getOverdueItems
);

// Get purchase order items by purchase order
router.get('/purchase-order/:purchase_order_id',
  validatePurchaseOrderIdParam,
  PurchaseOrderItemController.getItemsByPurchaseOrder
);

// Get purchase order items by product
router.get('/product/:product_id',
  validateProductIdParam,
  validatePurchaseOrderItemQuery,
  PurchaseOrderItemController.getItemsByProduct
);

// Get purchase order item by ID
router.get('/:id',
  validatePurchaseOrderItemId,
  validatePurchaseOrderItemQuery,
  PurchaseOrderItemController.getItemById
);

// Create new purchase order item
router.post('/',
  validatePurchaseOrderItemCreation,
  PurchaseOrderItemController.createItem
);

// Update purchase order item
router.put('/:id',
  validatePurchaseOrderItemId,
  validatePurchaseOrderItemUpdate,
  PurchaseOrderItemController.updateItem
);

// Receive quantity for purchase order item
router.patch('/:id/receive',
  validatePurchaseOrderItemId,
  validatePurchaseOrderItemReceive,
  PurchaseOrderItemController.receiveItem
);

// Delete purchase order item
router.delete('/:id',
  validatePurchaseOrderItemId,
  PurchaseOrderItemController.deleteItem
);

module.exports = router;
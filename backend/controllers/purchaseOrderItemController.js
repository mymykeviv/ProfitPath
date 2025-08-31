const { PurchaseOrderItem, PurchaseOrder, Product, Batch, Supplier } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class PurchaseOrderItemController {
  // Get all purchase order items with filtering and pagination
  static async getAllItems(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        purchase_order_id,
        product_id,
        status,
        date_from,
        date_to,
        sort_by = 'line_number',
        sort_order = 'ASC',
        include_product = true,
        include_purchase_order = false
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (purchase_order_id) {
        where.purchase_order_id = purchase_order_id;
      }

      if (product_id) {
        where.product_id = product_id;
      }

      if (status) {
        where.status = status;
      }

      if (date_from || date_to) {
        where.expected_received_date = {};
        if (date_from) {
          where.expected_received_date[Op.gte] = new Date(date_from);
        }
        if (date_to) {
          where.expected_received_date[Op.lte] = new Date(date_to);
        }
      }

      const includeOptions = [];
      if (include_product === 'true') {
        includeOptions.push({
          model: Product,
          as: 'product',
          attributes: ['id', 'sku', 'name', 'unit', 'current_stock']
        });
      }

      if (include_purchase_order === 'true') {
        includeOptions.push({
          model: PurchaseOrder,
          as: 'purchase_order',
          attributes: ['id', 'po_number', 'status', 'po_date'],
          include: [{
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'supplier_code', 'name']
          }]
        });
      }

      const { count, rows } = await PurchaseOrderItem.findAndCountAll({
        where,
        include: includeOptions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort_by, sort_order.toUpperCase()]],
        distinct: true
      });

      res.json({
        success: true,
        data: {
          items: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching purchase order items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase order items',
        error: error.message
      });
    }
  }

  // Get purchase order item by ID
  static async getItemById(req, res) {
    try {
      const { id } = req.params;
      const { include_product = true, include_purchase_order = true } = req.query;

      const includeOptions = [];
      if (include_product === 'true') {
        includeOptions.push({
          model: Product,
          as: 'product'
        });
      }

      if (include_purchase_order === 'true') {
        includeOptions.push({
          model: PurchaseOrder,
          as: 'purchase_order',
          include: [{
            model: Supplier,
            as: 'supplier'
          }]
        });
      }

      const item = await PurchaseOrderItem.findByPk(id, {
        include: includeOptions
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order item not found'
        });
      }

      // Add computed fields
      const itemData = item.toJSON();
      const enrichedItem = {
        ...itemData,
        discount_amount: item.getDiscountAmount(),
        gst_amount: item.getGSTAmount(),
        line_total: item.getLineTotal(),
        pending_quantity: item.getPendingQuantity(),
        is_fully_received: item.isFullyReceived(),
        is_partially_received: item.isPartiallyReceived(),
        can_receive: item.canReceive()
      };

      res.json({
        success: true,
        data: enrichedItem
      });
    } catch (error) {
      console.error('Error fetching purchase order item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase order item',
        error: error.message
      });
    }
  }

  // Create new purchase order item
  static async createItem(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { purchase_order_id, product_id } = req.body;

      // Verify purchase order exists and can be edited
      const purchaseOrder = await PurchaseOrder.findByPk(purchase_order_id);
      if (!purchaseOrder) {
        return res.status(400).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      if (!purchaseOrder.canEdit()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add items to purchase order in current status',
          current_status: purchaseOrder.status
        });
      }

      // Verify product exists
      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if item already exists for this product in the same PO
      const existingItem = await PurchaseOrderItem.findOne({
        where: {
          purchase_order_id,
          product_id
        }
      });

      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item for this product already exists in the purchase order',
          existing_item_id: existingItem.id
        });
      }

      // Get next line number
      const maxLineNumber = await PurchaseOrderItem.max('line_number', {
        where: { purchase_order_id }
      }) || 0;

      const itemData = {
        ...req.body,
        line_number: maxLineNumber + 1
      };

      const item = await PurchaseOrderItem.create(itemData);

      res.status(201).json({
        success: true,
        message: 'Purchase order item created successfully',
        data: item
      });
    } catch (error) {
      console.error('Error creating purchase order item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create purchase order item',
        error: error.message
      });
    }
  }

  // Update purchase order item
  static async updateItem(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const item = await PurchaseOrderItem.findByPk(id, {
        include: [{
          model: PurchaseOrder,
          as: 'purchase_order'
        }]
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order item not found'
        });
      }

      if (!item.purchase_order.canEdit()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit items in purchase order with current status',
          current_status: item.purchase_order.status
        });
      }

      await item.update(req.body);

      res.json({
        success: true,
        message: 'Purchase order item updated successfully',
        data: item
      });
    } catch (error) {
      console.error('Error updating purchase order item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update purchase order item',
        error: error.message
      });
    }
  }

  // Delete purchase order item
  static async deleteItem(req, res) {
    try {
      const { id } = req.params;
      const item = await PurchaseOrderItem.findByPk(id, {
        include: [{
          model: PurchaseOrder,
          as: 'purchase_order'
        }]
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order item not found'
        });
      }

      if (!item.purchase_order.canEdit()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete items from purchase order with current status',
          current_status: item.purchase_order.status
        });
      }

      if (item.received_quantity > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete item that has already been partially or fully received'
        });
      }

      await item.destroy();

      res.json({
        success: true,
        message: 'Purchase order item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting purchase order item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete purchase order item',
        error: error.message
      });
    }
  }

  // Receive quantity for purchase order item
  static async receiveItem(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { quantity, batch_number, expiry_date, manufacturing_date, notes } = req.body;

      const item = await PurchaseOrderItem.findByPk(id, {
        include: [
          {
            model: PurchaseOrder,
            as: 'purchase_order',
            include: [{
              model: Supplier,
              as: 'supplier'
            }]
          },
          {
            model: Product,
            as: 'product'
          }
        ]
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order item not found'
        });
      }

      if (!item.canReceive()) {
        return res.status(400).json({
          success: false,
          message: 'Item cannot be received in current status'
        });
      }

      const pendingQuantity = item.getPendingQuantity();
      if (quantity > pendingQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot receive more than pending quantity. Pending: ${pendingQuantity}`,
          pending_quantity: pendingQuantity
        });
      }

      // Create batch entry
      const batchData = {
        product_id: item.product_id,
        supplier_id: item.purchase_order.supplier_id,
        batch_number: batch_number || `PO-${item.purchase_order.po_number}-${item.line_number}`,
        quantity: quantity,
        unit_cost: item.unit_price,
        manufacturing_date: manufacturing_date || new Date(),
        expiry_date,
        purchase_order_id: item.purchase_order_id,
        purchase_order_item_id: item.id,
        notes
      };

      const batch = await Batch.create(batchData);

      // Update item received quantity
      const result = await item.receiveQuantity(quantity);

      res.json({
        success: true,
        message: 'Item received successfully',
        data: {
          item: result.item,
          batch: batch,
          product_stock_updated: result.product_stock_updated
        }
      });
    } catch (error) {
      console.error('Error receiving purchase order item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to receive purchase order item',
        error: error.message
      });
    }
  }

  // Get pending items
  static async getPendingItems(req, res) {
    try {
      const { supplier_id, product_id } = req.query;
      const items = await PurchaseOrderItem.getPendingItems(supplier_id, product_id);

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error fetching pending items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending items',
        error: error.message
      });
    }
  }

  // Get overdue items
  static async getOverdueItems(req, res) {
    try {
      const items = await PurchaseOrderItem.getOverdueItems();

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error fetching overdue items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overdue items',
        error: error.message
      });
    }
  }

  // Get items by purchase order
  static async getItemsByPurchaseOrder(req, res) {
    try {
      const { purchase_order_id } = req.params;
      const items = await PurchaseOrderItem.getItemsByPurchaseOrder(purchase_order_id);

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error fetching items by purchase order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch items by purchase order',
        error: error.message
      });
    }
  }

  // Get items by product
  static async getItemsByProduct(req, res) {
    try {
      const { product_id } = req.params;
      const { status, limit = 10 } = req.query;
      const items = await PurchaseOrderItem.getItemsByProduct(product_id, status, parseInt(limit));

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error fetching items by product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch items by product',
        error: error.message
      });
    }
  }
}

module.exports = PurchaseOrderItemController;
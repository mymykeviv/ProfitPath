const { PurchaseOrder, PurchaseOrderItem, Supplier, Product, Batch } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class PurchaseOrderController {
  // Get all purchase orders with filtering and pagination
  static async getAllPurchaseOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        supplier_id,
        priority,
        date_from,
        date_to,
        sort_by = 'po_date',
        sort_order = 'DESC',
        include_items = false,
        include_supplier = true
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (status) {
        where.status = status;
      }

      if (supplier_id) {
        where.supplier_id = supplier_id;
      }

      if (priority) {
        where.priority = priority;
      }

      if (date_from || date_to) {
        where.po_date = {};
        if (date_from) {
          where.po_date[Op.gte] = new Date(date_from);
        }
        if (date_to) {
          where.po_date[Op.lte] = new Date(date_to);
        }
      }

      if (search) {
        where[Op.or] = [
          {
            po_number: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            notes: {
              [Op.iLike]: `%${search}%`
            }
          }
        ];
      }

      const includeOptions = [];
      if (include_supplier === 'true') {
        includeOptions.push({
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'supplier_code', 'name', 'contact_person', 'email', 'phone']
        });
      }

      if (include_items === 'true') {
        includeOptions.push({
          model: PurchaseOrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'unit']
          }]
        });
      }

      const { count, rows } = await PurchaseOrder.findAndCountAll({
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
          purchase_orders: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase orders',
        error: error.message
      });
    }
  }

  // Get purchase order by ID
  static async getPurchaseOrderById(req, res) {
    try {
      const { id } = req.params;
      const { include_items = true, include_supplier = true } = req.query;

      const includeOptions = [];
      if (include_supplier === 'true') {
        includeOptions.push({
          model: Supplier,
          as: 'supplier'
        });
      }

      if (include_items === 'true') {
        includeOptions.push({
          model: PurchaseOrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'unit', 'current_stock']
          }]
        });
      }

      const purchaseOrder = await PurchaseOrder.findByPk(id, {
        include: includeOptions
      });

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      // Add computed fields
      const poData = purchaseOrder.toJSON();
      const enrichedPO = {
        ...poData,
        calculated_total: purchaseOrder.calculateTotal(),
        can_edit: purchaseOrder.canEdit(),
        can_cancel: purchaseOrder.canCancel(),
        can_receive: purchaseOrder.canReceive(),
        is_overdue: purchaseOrder.isOverdue(),
        days_until_delivery: purchaseOrder.getDaysUntilDelivery()
      };

      res.json({
        success: true,
        data: enrichedPO
      });
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase order',
        error: error.message
      });
    }
  }

  // Create new purchase order
  static async createPurchaseOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { items, ...poData } = req.body;

      // Verify supplier exists
      const supplier = await Supplier.findByPk(poData.supplier_id);
      if (!supplier) {
        return res.status(400).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      if (!supplier.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create purchase order for inactive supplier'
        });
      }

      // Create purchase order
      const purchaseOrder = await PurchaseOrder.create(poData);

      // Create purchase order items if provided
      if (items && items.length > 0) {
        const poItems = items.map((item, index) => ({
          ...item,
          purchase_order_id: purchaseOrder.id,
          line_number: index + 1
        }));

        await PurchaseOrderItem.bulkCreate(poItems);

        // Recalculate totals
        await purchaseOrder.reload({
          include: [{
            model: PurchaseOrderItem,
            as: 'items'
          }]
        });
      }

      res.status(201).json({
        success: true,
        message: 'Purchase order created successfully',
        data: purchaseOrder
      });
    } catch (error) {
      console.error('Error creating purchase order:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Purchase order number already exists',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create purchase order',
        error: error.message
      });
    }
  }

  // Update purchase order
  static async updatePurchaseOrder(req, res) {
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
      const purchaseOrder = await PurchaseOrder.findByPk(id);

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      if (!purchaseOrder.canEdit()) {
        return res.status(400).json({
          success: false,
          message: 'Purchase order cannot be edited in current status',
          current_status: purchaseOrder.status
        });
      }

      await purchaseOrder.update(req.body);

      res.json({
        success: true,
        message: 'Purchase order updated successfully',
        data: purchaseOrder
      });
    } catch (error) {
      console.error('Error updating purchase order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update purchase order',
        error: error.message
      });
    }
  }

  // Cancel purchase order
  static async cancelPurchaseOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const purchaseOrder = await PurchaseOrder.findByPk(id);

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      if (!purchaseOrder.canCancel()) {
        return res.status(400).json({
          success: false,
          message: 'Purchase order cannot be cancelled in current status',
          current_status: purchaseOrder.status
        });
      }

      await purchaseOrder.update({
        status: 'cancelled',
        cancelled_date: new Date(),
        notes: reason ? `${purchaseOrder.notes || ''}\n\nCancellation reason: ${reason}` : purchaseOrder.notes
      });

      res.json({
        success: true,
        message: 'Purchase order cancelled successfully',
        data: purchaseOrder
      });
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel purchase order',
        error: error.message
      });
    }
  }

  // Approve purchase order
  static async approvePurchaseOrder(req, res) {
    try {
      const { id } = req.params;
      const { approved_by } = req.body;

      const purchaseOrder = await PurchaseOrder.findByPk(id);

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      if (purchaseOrder.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Only draft purchase orders can be approved',
          current_status: purchaseOrder.status
        });
      }

      await purchaseOrder.update({
        status: 'approved',
        approved_date: new Date(),
        approved_by
      });

      res.json({
        success: true,
        message: 'Purchase order approved successfully',
        data: purchaseOrder
      });
    } catch (error) {
      console.error('Error approving purchase order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve purchase order',
        error: error.message
      });
    }
  }

  // Send purchase order to supplier
  static async sendPurchaseOrder(req, res) {
    try {
      const { id } = req.params;

      const purchaseOrder = await PurchaseOrder.findByPk(id);

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      if (purchaseOrder.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Only approved purchase orders can be sent',
          current_status: purchaseOrder.status
        });
      }

      await purchaseOrder.update({
        status: 'sent',
        sent_date: new Date()
      });

      res.json({
        success: true,
        message: 'Purchase order sent successfully',
        data: purchaseOrder
      });
    } catch (error) {
      console.error('Error sending purchase order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send purchase order',
        error: error.message
      });
    }
  }

  // Get pending purchase orders
  static async getPendingOrders(req, res) {
    try {
      const orders = await PurchaseOrder.getPendingOrders();

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending orders',
        error: error.message
      });
    }
  }

  // Get overdue purchase orders
  static async getOverdueOrders(req, res) {
    try {
      const orders = await PurchaseOrder.getOverdueOrders();

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching overdue orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overdue orders',
        error: error.message
      });
    }
  }

  // Get purchase orders by supplier
  static async getOrdersBySupplier(req, res) {
    try {
      const { supplier_id } = req.params;
      const { status, limit = 10 } = req.query;

      const orders = await PurchaseOrder.getOrdersBySupplier(supplier_id, status, parseInt(limit));

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching orders by supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders by supplier',
        error: error.message
      });
    }
  }

  // Get purchase order statistics
  static async getPurchaseOrderStats(req, res) {
    try {
      const totalOrders = await PurchaseOrder.count();
      
      const ordersByStatus = await PurchaseOrder.findAll({
        attributes: [
          'status',
          [PurchaseOrder.sequelize.fn('COUNT', PurchaseOrder.sequelize.col('id')), 'count'],
          [PurchaseOrder.sequelize.fn('SUM', PurchaseOrder.sequelize.col('total_amount')), 'total_value']
        ],
        group: ['status'],
        raw: true
      });

      const statusStats = {};
      let totalValue = 0;
      ordersByStatus.forEach(stat => {
        statusStats[stat.status] = {
          count: parseInt(stat.count),
          total_value: parseFloat(stat.total_value || 0)
        };
        totalValue += parseFloat(stat.total_value || 0);
      });

      const pendingCount = await PurchaseOrder.count({
        where: {
          status: {
            [Op.in]: ['draft', 'approved', 'sent']
          }
        }
      });

      const overdueCount = await PurchaseOrder.count({
        where: {
          expected_delivery_date: {
            [Op.lt]: new Date()
          },
          status: {
            [Op.in]: ['sent', 'confirmed']
          }
        }
      });

      res.json({
        success: true,
        data: {
          total_orders: totalOrders,
          total_value: totalValue,
          pending_orders: pendingCount,
          overdue_orders: overdueCount,
          orders_by_status: statusStats
        }
      });
    } catch (error) {
      console.error('Error fetching purchase order statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase order statistics',
        error: error.message
      });
    }
  }
}

module.exports = PurchaseOrderController;
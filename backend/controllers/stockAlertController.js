const { Op, literal } = require('sequelize');
const { StockAlert, Product, Batch } = require('../models');

class StockAlertController {
  // Get all stock alerts with filtering
  static async getAllAlerts(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        product_id,
        alert_type,
        status = 'active',
        priority,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      if (product_id) {
        whereClause.product_id = product_id;
      }

      if (alert_type) {
        whereClause.alert_type = alert_type;
      }

      if (status) {
        whereClause.is_active = status === 'active';
      }

      if (priority) {
        whereClause.priority = priority;
      }

      const { count, rows } = await StockAlert.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'type', 'current_stock', 'reorder_point', 'minimum_stock_level', 'maximum_stock_level']
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[literal('`StockAlert`.`created_at`'), sort_order.toUpperCase()]],
        distinct: true
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: count,
          total_pages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock alerts',
        error: error.message
      });
    }
  }

  // Get stock alert by ID
  static async getAlertById(req, res) {
    try {
      const { id } = req.params;

      const alert = await StockAlert.findByPk(id, {
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      });

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Stock alert not found'
        });
      }

      res.json({
        success: true,
        data: alert
      });
    } catch (error) {
      console.error('Error fetching stock alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock alert',
        error: error.message
      });
    }
  }

  // Create new stock alert
  static async createAlert(req, res) {
    try {
      const alertData = req.body;

      // Validate product exists
      const product = await Product.findByPk(alertData.product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const alert = await StockAlert.create(alertData);

      res.status(201).json({
        success: true,
        message: 'Stock alert created successfully',
        data: alert
      });
    } catch (error) {
      console.error('Error creating stock alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create stock alert',
        error: error.message
      });
    }
  }

  // Update stock alert
  static async updateAlert(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const alert = await StockAlert.findByPk(id);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Stock alert not found'
        });
      }

      await alert.update(updateData);

      res.json({
        success: true,
        message: 'Stock alert updated successfully',
        data: alert
      });
    } catch (error) {
      console.error('Error updating stock alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update stock alert',
        error: error.message
      });
    }
  }

  // Delete stock alert
  static async deleteAlert(req, res) {
    try {
      const { id } = req.params;

      const alert = await StockAlert.findByPk(id);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Stock alert not found'
        });
      }

      await alert.destroy();

      res.json({
        success: true,
        message: 'Stock alert deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting stock alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete stock alert',
        error: error.message
      });
    }
  }

  // Acknowledge stock alert
  static async acknowledgeAlert(req, res) {
    try {
      const { id } = req.params;
      const { acknowledged_by, notes } = req.body;

      const alert = await StockAlert.findByPk(id);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Stock alert not found'
        });
      }

      await alert.acknowledge(acknowledged_by, notes);

      res.json({
        success: true,
        message: 'Stock alert acknowledged successfully',
        data: alert
      });
    } catch (error) {
      console.error('Error acknowledging stock alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to acknowledge stock alert',
        error: error.message
      });
    }
  }

  // Resolve stock alert
  static async resolveAlert(req, res) {
    try {
      const { id } = req.params;
      const { resolved_by, resolution_notes } = req.body;

      const alert = await StockAlert.findByPk(id);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Stock alert not found'
        });
      }

      await alert.resolve(resolved_by, resolution_notes);

      res.json({
        success: true,
        message: 'Stock alert resolved successfully',
        data: alert
      });
    } catch (error) {
      console.error('Error resolving stock alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve stock alert',
        error: error.message
      });
    }
  }

  // Generate stock alerts for all products
  static async generateAlerts(req, res) {
    try {
      const { force_regenerate = false } = req.body;

      const generatedAlerts = await StockAlert.generateStockAlerts(force_regenerate);

      res.json({
        success: true,
        message: `Generated ${generatedAlerts.length} stock alerts`,
        data: {
          generated_count: generatedAlerts.length,
          alerts: generatedAlerts
        }
      });
    } catch (error) {
      console.error('Error generating stock alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate stock alerts',
        error: error.message
      });
    }
  }

  // Get active alerts summary
  static async getActiveAlertsSummary(req, res) {
    try {
      const alerts = await StockAlert.findAll({
        where: {
          is_active: true
        },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['name', 'sku', 'current_stock']
          }
        ],
        order: [['priority', 'DESC'], ['created_at', 'DESC']]
      });

      // Group alerts by type and priority
      const summary = {
        total_active: alerts.length,
        by_type: {},
        by_priority: {
          high: 0,
          medium: 0,
          low: 0
        },
        recent_alerts: alerts.slice(0, 10) // Last 10 alerts
      };

      alerts.forEach(alert => {
        // Count by type
        if (!summary.by_type[alert.alert_type]) {
          summary.by_type[alert.alert_type] = 0;
        }
        summary.by_type[alert.alert_type]++;

        // Count by priority
        if (summary.by_priority[alert.priority] !== undefined) {
          summary.by_priority[alert.priority]++;
        }
      });

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching active alerts summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active alerts summary',
        error: error.message
      });
    }
  }

  // Get low stock products
  static async getLowStockProducts(req, res) {
    try {
      const {
        threshold_multiplier = 1.0,
        include_zero_stock = true
      } = req.query;

      const { sequelize } = require('../models');
      
      const whereClause = {
        is_active: true,
        reorder_level: {
          [Op.gt]: 0
        }
      };

      if (include_zero_stock === 'true') {
        whereClause[Op.or] = [
          {
            current_stock: {
              [Op.lte]: sequelize.col('reorder_level')
            }
          },
          {
            current_stock: {
              [Op.lte]: 0
            }
          }
        ];
      } else {
        whereClause.current_stock = {
          [Op.lte]: sequelize.col('reorder_level')
        };
      }

      const lowStockProducts = await Product.findAll({
        where: whereClause,
        attributes: [
          'id',
          'name',
          'sku',
          'type',
          'current_stock',
          'reorder_level',
          'reorder_quantity',
          'unit_of_measure'
        ],
        order: [['current_stock', 'ASC']]
      });

      // Calculate shortage and recommended order quantities
      const enrichedProducts = lowStockProducts.map(product => {
        const shortage = Math.max(0, product.reorder_level - product.current_stock);
        const recommendedOrder = Math.max(product.reorder_quantity || 0, shortage);
        
        return {
          ...product.toJSON(),
          shortage: shortage,
          recommended_order_quantity: recommendedOrder,
          stock_status: product.current_stock <= 0 ? 'out_of_stock' : 'low_stock'
        };
      });

      res.json({
        success: true,
        data: {
          total_products: enrichedProducts.length,
          out_of_stock: enrichedProducts.filter(p => p.stock_status === 'out_of_stock').length,
          low_stock: enrichedProducts.filter(p => p.stock_status === 'low_stock').length,
          products: enrichedProducts
        }
      });
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch low stock products',
        error: error.message
      });
    }
  }

  // Get expiring batches
  static async getExpiringBatches(req, res) {
    try {
      const {
        days_ahead = 30,
        include_expired = false
      } = req.query;

      const currentDate = new Date();
      const futureDate = new Date();
      futureDate.setDate(currentDate.getDate() + parseInt(days_ahead));

      const whereClause = {
        is_active: true,
        expiry_date: {
          [Op.ne]: null
        }
      };

      if (include_expired === 'true') {
        whereClause.expiry_date = {
          [Op.lte]: futureDate
        };
      } else {
        whereClause.expiry_date = {
          [Op.between]: [currentDate, futureDate]
        };
      }

      const expiringBatches = await Batch.findAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['name', 'sku', 'type']
          }
        ],
        order: [['expiry_date', 'ASC']]
      });

      // Calculate days until expiry
      const enrichedBatches = expiringBatches.map(batch => {
        const daysUntilExpiry = Math.ceil(
          (new Date(batch.expiry_date) - currentDate) / (1000 * 60 * 60 * 24)
        );
        
        let status;
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 7) {
          status = 'critical';
        } else if (daysUntilExpiry <= 30) {
          status = 'warning';
        } else {
          status = 'normal';
        }

        return {
          ...batch.toJSON(),
          days_until_expiry: daysUntilExpiry,
          expiry_status: status
        };
      });

      const summary = {
        total_batches: enrichedBatches.length,
        expired: enrichedBatches.filter(b => b.expiry_status === 'expired').length,
        critical: enrichedBatches.filter(b => b.expiry_status === 'critical').length,
        warning: enrichedBatches.filter(b => b.expiry_status === 'warning').length
      };

      res.json({
        success: true,
        data: {
          summary: summary,
          batches: enrichedBatches
        }
      });
    } catch (error) {
      console.error('Error fetching expiring batches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expiring batches',
        error: error.message
      });
    }
  }

  // Bulk acknowledge alerts
  static async bulkAcknowledgeAlerts(req, res) {
    try {
      const { alert_ids, acknowledged_by, notes } = req.body;

      if (!Array.isArray(alert_ids) || alert_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Alert IDs array is required'
        });
      }

      const alerts = await StockAlert.findAll({
        where: {
          id: {
            [Op.in]: alert_ids
          },
          status: 'active'
        }
      });

      const acknowledgedAlerts = [];
      const errors = [];

      for (const alert of alerts) {
        try {
          await alert.acknowledge(acknowledged_by, notes);
          acknowledgedAlerts.push(alert);
        } catch (error) {
          errors.push({
            alert_id: alert.id,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `${acknowledgedAlerts.length} alerts acknowledged successfully`,
        data: {
          acknowledged: acknowledgedAlerts,
          errors: errors,
          summary: {
            total_requested: alert_ids.length,
            successful: acknowledgedAlerts.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      console.error('Error bulk acknowledging alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk acknowledge alerts',
        error: error.message
      });
    }
  }
}

module.exports = StockAlertController;
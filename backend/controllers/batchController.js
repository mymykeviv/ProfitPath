const { Batch, Product } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class BatchController {
  // Get all batches with filtering and pagination
  static async getAllBatches(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        product_id,
        status,
        quality_status,
        expiring_soon,
        expired,
        sort_by = 'received_date',
        sort_order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { is_active: true };

      // Apply filters
      if (product_id) {
        where.product_id = product_id;
      }

      if (status) {
        where.status = status;
      }

      if (quality_status) {
        where.quality_status = quality_status;
      }

      if (expired === 'true') {
        where.expiry_date = {
          [Op.lt]: new Date()
        };
        where.status = 'active';
      }

      if (expiring_soon === 'true') {
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + 30);
        where.expiry_date = {
          [Op.between]: [new Date(), warningDate]
        };
        where.status = 'active';
      }

      const { count, rows } = await Batch.findAndCountAll({
        where,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'unit_of_measure']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort_by, sort_order.toUpperCase()]],
        distinct: true
      });

      // Add computed fields
      const batchesWithStatus = rows.map(batch => {
        const batchData = batch.toJSON();
        return {
          ...batchData,
          is_expired: batch.isExpired(),
          is_expiring_soon: batch.isExpiringSoon(),
          days_until_expiry: batch.getDaysUntilExpiry(),
          age_days: batch.getAge(),
          utilization_percentage: batch.getUtilizationPercentage()
        };
      });

      res.json({
        success: true,
        data: {
          batches: batchesWithStatus,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batches',
        error: error.message
      });
    }
  }

  // Get batch by ID
  static async getBatchById(req, res) {
    try {
      const { id } = req.params;

      const batch = await Batch.findByPk(id, {
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      });

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      const batchData = batch.toJSON();
      const enrichedBatch = {
        ...batchData,
        is_expired: batch.isExpired(),
        is_expiring_soon: batch.isExpiringSoon(),
        days_until_expiry: batch.getDaysUntilExpiry(),
        age_days: batch.getAge(),
        utilization_percentage: batch.getUtilizationPercentage()
      };

      res.json({
        success: true,
        data: enrichedBatch
      });
    } catch (error) {
      console.error('Error fetching batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch',
        error: error.message
      });
    }
  }

  // Create new batch
  static async createBatch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const batch = await Batch.create(req.body);

      // Update product stock
      const product = await Product.findByPk(batch.product_id);
      if (product) {
        await product.update({
          current_stock: product.current_stock + batch.quantity
        });
      }

      // Fetch the created batch with associations
      const createdBatch = await Batch.findByPk(batch.id, {
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Batch created successfully',
        data: createdBatch
      });
    } catch (error) {
      console.error('Error creating batch:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Batch with this number already exists for this product',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create batch',
        error: error.message
      });
    }
  }

  // Update batch
  static async updateBatch(req, res) {
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
      const batch = await Batch.findByPk(id);

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      const oldQuantity = batch.quantity;
      await batch.update(req.body);

      // Update product stock if quantity changed
      if (req.body.quantity && req.body.quantity !== oldQuantity) {
        const product = await Product.findByPk(batch.product_id);
        if (product) {
          const stockDifference = req.body.quantity - oldQuantity;
          await product.update({
            current_stock: product.current_stock + stockDifference
          });
        }
      }

      // Fetch updated batch with associations
      const updatedBatch = await Batch.findByPk(id, {
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      });

      res.json({
        success: true,
        message: 'Batch updated successfully',
        data: updatedBatch
      });
    } catch (error) {
      console.error('Error updating batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update batch',
        error: error.message
      });
    }
  }

  // Delete batch (soft delete)
  static async deleteBatch(req, res) {
    try {
      const { id } = req.params;
      const batch = await Batch.findByPk(id);

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      // Update product stock
      const product = await Product.findByPk(batch.product_id);
      if (product) {
        await product.update({
          current_stock: Math.max(0, product.current_stock - batch.remaining_quantity)
        });
      }

      // Soft delete by setting is_active to false
      await batch.update({ is_active: false });

      res.json({
        success: true,
        message: 'Batch deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete batch',
        error: error.message
      });
    }
  }

  // Consume from batch
  static async consumeBatch(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
      }

      const batch = await Batch.findByPk(id);

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      if (quantity > batch.remaining_quantity) {
        return res.status(400).json({
          success: false,
          message: 'Cannot consume more than remaining quantity',
          available_quantity: batch.remaining_quantity
        });
      }

      await batch.consume(quantity);

      // Update product stock
      const product = await Product.findByPk(batch.product_id);
      if (product) {
        await product.update({
          current_stock: Math.max(0, product.current_stock - quantity)
        });
      }

      res.json({
        success: true,
        message: 'Batch consumption recorded successfully',
        data: {
          consumed_quantity: quantity,
          remaining_quantity: batch.remaining_quantity,
          status: batch.status
        }
      });
    } catch (error) {
      console.error('Error consuming batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to consume batch',
        error: error.message
      });
    }
  }

  // Get expired batches
  static async getExpiredBatches(req, res) {
    try {
      const batches = await Batch.getExpiredBatches();

      const enrichedBatches = batches.map(batch => {
        const batchData = batch.toJSON();
        return {
          ...batchData,
          days_past_expiry: Math.abs(batch.getDaysUntilExpiry())
        };
      });

      res.json({
        success: true,
        data: enrichedBatches
      });
    } catch (error) {
      console.error('Error fetching expired batches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expired batches',
        error: error.message
      });
    }
  }

  // Get expiring soon batches
  static async getExpiringSoonBatches(req, res) {
    try {
      const { days = 30 } = req.query;
      const batches = await Batch.getExpiringSoonBatches(parseInt(days));

      const enrichedBatches = batches.map(batch => {
        const batchData = batch.toJSON();
        return {
          ...batchData,
          days_until_expiry: batch.getDaysUntilExpiry()
        };
      });

      res.json({
        success: true,
        data: enrichedBatches
      });
    } catch (error) {
      console.error('Error fetching expiring soon batches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expiring soon batches',
        error: error.message
      });
    }
  }

  // Get batches by product
  static async getBatchesByProduct(req, res) {
    try {
      const { product_id } = req.params;
      const { active_only = true } = req.query;

      let batches;
      if (active_only === 'true') {
        batches = await Batch.getActiveBatchesByProduct(product_id);
      } else {
        batches = await Batch.findAll({
          where: {
            product_id: product_id,
            is_active: true
          },
          order: [['received_date', 'ASC']]
        });
      }

      const enrichedBatches = batches.map(batch => {
        const batchData = batch.toJSON();
        return {
          ...batchData,
          is_expired: batch.isExpired(),
          is_expiring_soon: batch.isExpiringSoon(),
          days_until_expiry: batch.getDaysUntilExpiry(),
          utilization_percentage: batch.getUtilizationPercentage()
        };
      });

      res.json({
        success: true,
        data: enrichedBatches
      });
    } catch (error) {
      console.error('Error fetching batches by product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batches by product',
        error: error.message
      });
    }
  }

  // Get FIFO allocation for product
  static async getFIFOAllocation(req, res) {
    try {
      const { product_id } = req.params;
      const { quantity } = req.query;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
      }

      const allocation = await Batch.getFIFOBatch(product_id, parseInt(quantity));

      res.json({
        success: true,
        data: allocation
      });
    } catch (error) {
      console.error('Error getting FIFO allocation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get FIFO allocation',
        error: error.message
      });
    }
  }

  // Get LIFO allocation for product
  static async getLIFOAllocation(req, res) {
    try {
      const { product_id } = req.params;
      const { quantity } = req.query;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
      }

      const allocation = await Batch.getLIFOBatch(product_id, parseInt(quantity));

      res.json({
        success: true,
        data: allocation
      });
    } catch (error) {
      console.error('Error getting LIFO allocation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get LIFO allocation',
        error: error.message
      });
    }
  }

  // Get batch statistics
  static async getBatchStats(req, res) {
    try {
      const totalBatches = await Batch.count({ where: { is_active: true } });
      const activeBatches = await Batch.count({
        where: {
          status: 'active',
          is_active: true
        }
      });
      const expiredBatches = await Batch.count({
        where: {
          expiry_date: {
            [Op.lt]: new Date()
          },
          status: 'active',
          is_active: true
        }
      });

      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 30);
      const expiringSoonBatches = await Batch.count({
        where: {
          expiry_date: {
            [Op.between]: [new Date(), warningDate]
          },
          status: 'active',
          is_active: true
        }
      });

      res.json({
        success: true,
        data: {
          total_batches: totalBatches,
          active_batches: activeBatches,
          expired_batches: expiredBatches,
          expiring_soon_batches: expiringSoonBatches
        }
      });
    } catch (error) {
      console.error('Error fetching batch statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch statistics',
        error: error.message
      });
    }
  }
}

module.exports = BatchController;
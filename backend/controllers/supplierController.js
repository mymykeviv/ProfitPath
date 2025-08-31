const { Supplier, PurchaseOrder } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class SupplierController {
  // Get all suppliers with filtering and pagination
  static async getAllSuppliers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        supplier_type,
        is_active = true,
        sort_by = 'name',
        sort_order = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      if (supplier_type) {
        where.supplier_type = supplier_type;
      }

      if (search) {
        where[Op.or] = [
          {
            name: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            supplier_code: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            contact_person: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            email: {
              [Op.iLike]: `%${search}%`
            }
          }
        ];
      }

      const { count, rows } = await Supplier.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort_by, sort_order.toUpperCase()]],
        distinct: true
      });

      res.json({
        success: true,
        data: {
          suppliers: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch suppliers',
        error: error.message
      });
    }
  }

  // Get supplier by ID
  static async getSupplierById(req, res) {
    try {
      const { id } = req.params;
      const { include_orders = false } = req.query;

      const includeOptions = [];
      if (include_orders === 'true') {
        includeOptions.push({
          model: PurchaseOrder,
          as: 'purchase_orders',
          limit: 10,
          order: [['po_date', 'DESC']]
        });
      }

      const supplier = await Supplier.findByPk(id, {
        include: includeOptions
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      // Add computed fields
      const supplierData = supplier.toJSON();
      const enrichedSupplier = {
        ...supplierData,
        full_address: supplier.getFullAddress(),
        contact_info: supplier.getContactInfo(),
        bank_details: supplier.getBankDetails(),
        tax_info: supplier.getTaxInfo()
      };

      res.json({
        success: true,
        data: enrichedSupplier
      });
    } catch (error) {
      console.error('Error fetching supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch supplier',
        error: error.message
      });
    }
  }

  // Create new supplier
  static async createSupplier(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const supplier = await Supplier.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        return res.status(400).json({
          success: false,
          message: `Supplier with this ${field} already exists`,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create supplier',
        error: error.message
      });
    }
  }

  // Update supplier
  static async updateSupplier(req, res) {
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
      const supplier = await Supplier.findByPk(id);

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      await supplier.update(req.body);

      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        return res.status(400).json({
          success: false,
          message: `Supplier with this ${field} already exists`,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update supplier',
        error: error.message
      });
    }
  }

  // Delete supplier (soft delete)
  static async deleteSupplier(req, res) {
    try {
      const { id } = req.params;
      const { force = false } = req.query;

      const supplier = await Supplier.findByPk(id);

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      // Check for associated purchase orders
      const purchaseOrderCount = await PurchaseOrder.count({
        where: {
          supplier_id: id,
          is_active: true
        }
      });

      if (purchaseOrderCount > 0 && force !== 'true') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete supplier with associated purchase orders',
          associated_orders: purchaseOrderCount,
          hint: 'Use force=true to deactivate instead of delete'
        });
      }

      // Soft delete by setting is_active to false
      await supplier.update({ is_active: false });

      res.json({
        success: true,
        message: 'Supplier deactivated successfully'
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete supplier',
        error: error.message
      });
    }
  }

  // Get active suppliers
  static async getActiveSuppliers(req, res) {
    try {
      const suppliers = await Supplier.getActiveSuppliers();

      res.json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      console.error('Error fetching active suppliers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active suppliers',
        error: error.message
      });
    }
  }

  // Get suppliers by type
  static async getSuppliersByType(req, res) {
    try {
      const { type } = req.params;

      if (!['raw_material', 'finished_goods', 'services', 'both'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier type. Must be raw_material, finished_goods, services, or both'
        });
      }

      const suppliers = await Supplier.getSuppliersByType(type);

      res.json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      console.error('Error fetching suppliers by type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch suppliers by type',
        error: error.message
      });
    }
  }

  // Search suppliers
  static async searchSuppliers(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const suppliers = await Supplier.searchSuppliers(q.trim());

      res.json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      console.error('Error searching suppliers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search suppliers',
        error: error.message
      });
    }
  }

  // Get supplier statistics
  static async getSupplierStats(req, res) {
    try {
      const totalSuppliers = await Supplier.count();
      const activeSuppliers = await Supplier.count({
        where: { is_active: true }
      });
      const inactiveSuppliers = totalSuppliers - activeSuppliers;

      const suppliersByType = await Supplier.findAll({
        attributes: [
          'supplier_type',
          [Supplier.sequelize.fn('COUNT', Supplier.sequelize.col('id')), 'count']
        ],
        where: { is_active: true },
        group: ['supplier_type'],
        raw: true
      });

      const typeStats = {};
      suppliersByType.forEach(stat => {
        typeStats[stat.supplier_type] = parseInt(stat.count);
      });

      res.json({
        success: true,
        data: {
          total_suppliers: totalSuppliers,
          active_suppliers: activeSuppliers,
          inactive_suppliers: inactiveSuppliers,
          suppliers_by_type: typeStats
        }
      });
    } catch (error) {
      console.error('Error fetching supplier statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch supplier statistics',
        error: error.message
      });
    }
  }

  // Activate supplier
  static async activateSupplier(req, res) {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findByPk(id);

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      if (supplier.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Supplier is already active'
        });
      }

      await supplier.update({ is_active: true });

      res.json({
        success: true,
        message: 'Supplier activated successfully',
        data: supplier
      });
    } catch (error) {
      console.error('Error activating supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate supplier',
        error: error.message
      });
    }
  }
}

module.exports = SupplierController;
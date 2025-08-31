const { Product, Category, Batch } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class ProductController {
  // Get all products with filtering and pagination
  static async getAllProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        type,
        category_id,
        is_active = true,
        low_stock,
        out_of_stock,
        sort_by = 'name',
        sort_order = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { sku: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      if (type) {
        where.type = type;
      }

      if (category_id) {
        where.category_id = category_id;
      }

      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      if (low_stock === 'true') {
        where.current_stock = {
          [Op.lte]: sequelize.col('reorder_point')
        };
      }

      if (out_of_stock === 'true') {
        where.current_stock = 0;
      }

      const { count, rows } = await Product.findAndCountAll({
        where,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'color_code']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort_by, sort_order.toUpperCase()]],
        distinct: true
      });

      // Add computed fields
      const productsWithStatus = rows.map(product => {
        const productData = product.toJSON();
        return {
          ...productData,
          stock_status: product.getStockStatus(),
          is_low_stock: product.isLowStock(),
          is_out_of_stock: product.isOutOfStock(),
          margin_percentage: product.calculateMargin()
        };
      });

      res.json({
        success: true,
        data: {
          products: productsWithStatus,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      });
    }
  }

  // Get product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category'
          },
          {
            model: Batch,
            as: 'batches',
            where: { is_active: true },
            required: false,
            order: [['received_date', 'ASC']]
          }
        ]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const productData = product.toJSON();
      const enrichedProduct = {
        ...productData,
        stock_status: product.getStockStatus(),
        is_low_stock: product.isLowStock(),
        is_out_of_stock: product.isOutOfStock(),
        margin_percentage: product.calculateMargin()
      };

      res.json({
        success: true,
        data: enrichedProduct
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error.message
      });
    }
  }

  // Create new product
  static async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const product = await Product.create(req.body);

      // Fetch the created product with associations
      const createdProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            as: 'category'
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: createdProduct
      });
    } catch (error) {
      console.error('Error creating product:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message
      });
    }
  }

  // Update product
  static async updateProduct(req, res) {
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
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.update(req.body);

      // Fetch updated product with associations
      const updatedProduct = await Product.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category'
          }
        ]
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      });
    } catch (error) {
      console.error('Error updating product:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message
      });
    }
  }

  // Delete product (soft delete)
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Soft delete by setting is_active to false
      await product.update({ is_active: false });

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message
      });
    }
  }

  // Get low stock products
  static async getLowStockProducts(req, res) {
    try {
      const products = await Product.getLowStockProducts();

      const enrichedProducts = products.map(product => {
        const productData = product.toJSON();
        return {
          ...productData,
          stock_status: product.getStockStatus(),
          days_until_stockout: Math.floor(product.current_stock / (product.reorder_point || 1))
        };
      });

      res.json({
        success: true,
        data: enrichedProducts
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

  // Get out of stock products
  static async getOutOfStockProducts(req, res) {
    try {
      const products = await Product.getOutOfStockProducts();

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Error fetching out of stock products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch out of stock products',
        error: error.message
      });
    }
  }

  // Update stock quantity
  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, operation = 'set' } = req.body;

      if (!quantity || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
      }

      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      let newStock;
      switch (operation) {
        case 'add':
          newStock = product.current_stock + parseInt(quantity);
          break;
        case 'subtract':
          newStock = Math.max(0, product.current_stock - parseInt(quantity));
          break;
        case 'set':
        default:
          newStock = parseInt(quantity);
          break;
      }

      await product.update({ current_stock: newStock });

      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: {
          previous_stock: product.current_stock,
          new_stock: newStock,
          operation: operation
        }
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update stock',
        error: error.message
      });
    }
  }

  // Get product statistics
  static async getProductStats(req, res) {
    try {
      const totalProducts = await Product.count({ where: { is_active: true } });
      const lowStockProducts = await Product.count({
        where: {
          current_stock: {
            [Op.lte]: sequelize.col('reorder_point')
          },
          is_active: true
        }
      });
      const outOfStockProducts = await Product.count({
        where: {
          current_stock: 0,
          is_active: true
        }
      });

      const productsByType = await Product.findAll({
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { is_active: true },
        group: ['type']
      });

      res.json({
        success: true,
        data: {
          total_products: totalProducts,
          low_stock_products: lowStockProducts,
          out_of_stock_products: outOfStockProducts,
          products_by_type: productsByType
        }
      });
    } catch (error) {
      console.error('Error fetching product statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product statistics',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;
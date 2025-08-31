const { Op } = require('sequelize');
const { InventoryTransaction, Product, Batch, StockAlert } = require('../models');

class InventoryTransactionController {
  // Get all inventory transactions with filtering and pagination
  static async getAllTransactions(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        product_id,
        transaction_type,
        reference_type,
        warehouse,
        date_from,
        date_to,
        sort_by = 'transaction_date',
        sort_order = 'DESC',
        include_product = 'true',
        include_batch = 'false'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {
        is_active: true
      };

      // Apply filters
      if (product_id) {
        whereClause.product_id = product_id;
      }

      if (transaction_type) {
        whereClause.transaction_type = transaction_type;
      }

      if (reference_type) {
        whereClause.reference_type = reference_type;
      }

      if (warehouse) {
        whereClause.warehouse = warehouse;
      }

      if (date_from && date_to) {
        whereClause.transaction_date = {
          [Op.between]: [date_from, date_to]
        };
      } else if (date_from) {
        whereClause.transaction_date = {
          [Op.gte]: date_from
        };
      } else if (date_to) {
        whereClause.transaction_date = {
          [Op.lte]: date_to
        };
      }

      const includeOptions = [];
      
      if (include_product === 'true') {
        includeOptions.push({
          model: Product,
          as: 'product',
          attributes: ['name', 'sku', 'type']
        });
      }

      if (include_batch === 'true') {
        includeOptions.push({
          model: Batch,
          as: 'batch',
          attributes: ['batch_number', 'expiry_date'],
          required: false
        });
      }

      const { count, rows } = await InventoryTransaction.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        limit: parseInt(limit),
        offset: offset,
        order: [[sort_by, sort_order.toUpperCase()]],
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
      console.error('Error fetching inventory transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory transactions',
        error: error.message
      });
    }
  }

  // Get inventory transaction by ID
  static async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      const { include_product = 'true', include_batch = 'true' } = req.query;

      const includeOptions = [];
      
      if (include_product === 'true') {
        includeOptions.push({
          model: Product,
          as: 'product'
        });
      }

      if (include_batch === 'true') {
        includeOptions.push({
          model: Batch,
          as: 'batch',
          required: false
        });
      }

      const transaction = await InventoryTransaction.findOne({
        where: {
          id: id,
          is_active: true
        },
        include: includeOptions
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Inventory transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error fetching inventory transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory transaction',
        error: error.message
      });
    }
  }

  // Create new inventory transaction
  static async createTransaction(req, res) {
    try {
      const transactionData = req.body;

      // Validate product exists
      const product = await Product.findByPk(transactionData.product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Validate batch if provided
      if (transactionData.batch_id) {
        const batch = await Batch.findByPk(transactionData.batch_id);
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: 'Batch not found'
          });
        }
      }

      const transaction = await InventoryTransaction.create(transactionData);

      // Update product stock
      await this.updateProductStock(product, transaction);

      // Generate stock alerts if needed
      await StockAlert.generateStockAlerts();

      res.status(201).json({
        success: true,
        message: 'Inventory transaction created successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Error creating inventory transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create inventory transaction',
        error: error.message
      });
    }
  }

  // Update inventory transaction
  static async updateTransaction(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const transaction = await InventoryTransaction.findOne({
        where: {
          id: id,
          is_active: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Inventory transaction not found'
        });
      }

      // Store original values for stock adjustment
      const originalQuantity = transaction.quantity;
      const originalProductId = transaction.product_id;

      await transaction.update(updateData);

      // Adjust product stock if quantity or product changed
      if (updateData.quantity !== undefined || updateData.product_id !== undefined) {
        // Reverse original transaction effect
        const originalProduct = await Product.findByPk(originalProductId);
        if (originalProduct) {
          originalProduct.current_stock -= originalQuantity;
          await originalProduct.save();
        }

        // Apply new transaction effect
        const newProduct = await Product.findByPk(transaction.product_id);
        if (newProduct) {
          await this.updateProductStock(newProduct, transaction);
        }
      }

      res.json({
        success: true,
        message: 'Inventory transaction updated successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Error updating inventory transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update inventory transaction',
        error: error.message
      });
    }
  }

  // Delete inventory transaction (soft delete)
  static async deleteTransaction(req, res) {
    try {
      const { id } = req.params;

      const transaction = await InventoryTransaction.findOne({
        where: {
          id: id,
          is_active: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Inventory transaction not found'
        });
      }

      // Reverse the stock effect
      const product = await Product.findByPk(transaction.product_id);
      if (product) {
        product.current_stock -= transaction.quantity;
        await product.save();
      }

      await transaction.update({ is_active: false });

      res.json({
        success: true,
        message: 'Inventory transaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting inventory transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete inventory transaction',
        error: error.message
      });
    }
  }

  // Get stock movement report
  static async getStockMovementReport(req, res) {
    try {
      const {
        start_date,
        end_date,
        product_id,
        warehouse,
        transaction_type
      } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const whereClause = {
        transaction_date: {
          [Op.between]: [start_date, end_date]
        },
        is_active: true
      };

      if (product_id) {
        whereClause.product_id = product_id;
      }

      if (warehouse) {
        whereClause.warehouse = warehouse;
      }

      if (transaction_type) {
        whereClause.transaction_type = transaction_type;
      }

      const transactions = await InventoryTransaction.findAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['name', 'sku', 'type']
          },
          {
            model: Batch,
            as: 'batch',
            attributes: ['batch_number', 'expiry_date'],
            required: false
          }
        ],
        order: [['transaction_date', 'DESC'], ['transaction_time', 'DESC']]
      });

      // Group by product for summary
      const summary = {};
      transactions.forEach(transaction => {
        const productId = transaction.product_id;
        if (!summary[productId]) {
          summary[productId] = {
            product: transaction.product,
            total_inward: 0,
            total_outward: 0,
            net_movement: 0,
            transaction_count: 0
          };
        }

        if (transaction.quantity > 0) {
          summary[productId].total_inward += parseFloat(transaction.quantity);
        } else {
          summary[productId].total_outward += Math.abs(parseFloat(transaction.quantity));
        }

        summary[productId].net_movement += parseFloat(transaction.quantity);
        summary[productId].transaction_count++;
      });

      res.json({
        success: true,
        data: {
          transactions,
          summary: Object.values(summary)
        }
      });
    } catch (error) {
      console.error('Error generating stock movement report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate stock movement report',
        error: error.message
      });
    }
  }

  // Get inventory valuation
  static async getInventoryValuation(req, res) {
    try {
      const {
        as_of_date,
        valuation_method = 'FIFO',
        warehouse
      } = req.query;

      const asOfDate = as_of_date || new Date().toISOString().split('T')[0];

      const valuation = await InventoryTransaction.getInventoryValuation(
        asOfDate,
        valuation_method
      );

      // Filter by warehouse if specified
      let filteredValuation = valuation;
      if (warehouse) {
        // This would need to be implemented based on warehouse filtering logic
        filteredValuation = valuation; // Placeholder
      }

      const totalValue = filteredValuation.reduce((sum, item) => sum + item.current_value, 0);
      const totalStock = filteredValuation.reduce((sum, item) => sum + item.current_stock, 0);

      res.json({
        success: true,
        data: {
          valuation_date: asOfDate,
          valuation_method: valuation_method,
          warehouse: warehouse || 'All Warehouses',
          total_value: totalValue,
          total_stock: totalStock,
          items: filteredValuation
        }
      });
    } catch (error) {
      console.error('Error getting inventory valuation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get inventory valuation',
        error: error.message
      });
    }
  }

  // Get low stock alerts
  static async getLowStockAlerts(req, res) {
    try {
      const alerts = await InventoryTransaction.getLowStockAlert();

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get low stock alerts',
        error: error.message
      });
    }
  }

  // Helper method to update product stock
  static async updateProductStock(product, transaction) {
    const newStock = parseFloat(product.current_stock) + parseFloat(transaction.quantity);
    await product.update({ current_stock: newStock });
    
    // Update running balance in transaction
    transaction.running_balance = newStock;
    await transaction.save();
  }

  // Bulk create transactions (for imports)
  static async bulkCreateTransactions(req, res) {
    try {
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Transactions array is required'
        });
      }

      const createdTransactions = [];
      const errors = [];

      for (let i = 0; i < transactions.length; i++) {
        try {
          const transactionData = transactions[i];
          
          // Validate product exists
          const product = await Product.findByPk(transactionData.product_id);
          if (!product) {
            errors.push({
              index: i,
              error: 'Product not found',
              data: transactionData
            });
            continue;
          }

          const transaction = await InventoryTransaction.create(transactionData);
          await this.updateProductStock(product, transaction);
          createdTransactions.push(transaction);
        } catch (error) {
          errors.push({
            index: i,
            error: error.message,
            data: transactions[i]
          });
        }
      }

      // Generate stock alerts after bulk operations
      await StockAlert.generateStockAlerts();

      res.status(201).json({
        success: true,
        message: `${createdTransactions.length} transactions created successfully`,
        data: {
          created: createdTransactions,
          errors: errors,
          summary: {
            total_attempted: transactions.length,
            successful: createdTransactions.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      console.error('Error bulk creating transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk create transactions',
        error: error.message
      });
    }
  }
}

module.exports = InventoryTransactionController;
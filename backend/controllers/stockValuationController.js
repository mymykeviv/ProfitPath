const { Op } = require('sequelize');
const { StockValuation, Product, InventoryTransaction, Batch } = require('../models');

class StockValuationController {
  // Get all stock valuations with filtering
  static async getAllValuations(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        product_id,
        valuation_method,
        date_from,
        date_to,
        sort_by = 'valuation_date',
        sort_order = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      if (product_id) {
        whereClause.product_id = product_id;
      }

      if (valuation_method) {
        whereClause.valuation_method = valuation_method;
      }

      if (date_from && date_to) {
        whereClause.valuation_date = {
          [Op.between]: [date_from, date_to]
        };
      } else if (date_from) {
        whereClause.valuation_date = {
          [Op.gte]: date_from
        };
      } else if (date_to) {
        whereClause.valuation_date = {
          [Op.lte]: date_to
        };
      }

      const { count, rows } = await StockValuation.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['name', 'sku', 'type', 'unit_of_measure']
          }
        ],
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
      console.error('Error fetching stock valuations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock valuations',
        error: error.message
      });
    }
  }

  // Get stock valuation by ID
  static async getValuationById(req, res) {
    try {
      const { id } = req.params;

      const valuation = await StockValuation.findByPk(id, {
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      });

      if (!valuation) {
        return res.status(404).json({
          success: false,
          message: 'Stock valuation not found'
        });
      }

      res.json({
        success: true,
        data: valuation
      });
    } catch (error) {
      console.error('Error fetching stock valuation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock valuation',
        error: error.message
      });
    }
  }

  // Calculate and create stock valuation
  static async calculateValuation(req, res) {
    try {
      const {
        product_id,
        valuation_date,
        valuation_method = 'FIFO'
      } = req.body;

      if (!product_id || !valuation_date) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and valuation date are required'
        });
      }

      // Validate product exists
      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Calculate valuation based on method
      let valuationResult;
      switch (valuation_method.toUpperCase()) {
        case 'FIFO':
          valuationResult = await this.calculateFIFOValuation(product_id, valuation_date);
          break;
        case 'LIFO':
          valuationResult = await this.calculateLIFOValuation(product_id, valuation_date);
          break;
        case 'WEIGHTED_AVERAGE':
          valuationResult = await this.calculateWeightedAverageValuation(product_id, valuation_date);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid valuation method. Use FIFO, LIFO, or WEIGHTED_AVERAGE'
          });
      }

      // Create or update stock valuation record
      const [valuation, created] = await StockValuation.findOrCreate({
        where: {
          product_id: product_id,
          valuation_date: valuation_date,
          valuation_method: valuation_method.toUpperCase()
        },
        defaults: {
          stock_balance: valuationResult.stock_balance,
          value_balance: valuationResult.value_balance,
          average_cost: valuationResult.average_cost,
          calculation_details: valuationResult.details
        }
      });

      if (!created) {
        await valuation.update({
          stock_balance: valuationResult.stock_balance,
          value_balance: valuationResult.value_balance,
          average_cost: valuationResult.average_cost,
          calculation_details: valuationResult.details
        });
      }

      res.status(created ? 201 : 200).json({
        success: true,
        message: created ? 'Stock valuation calculated and created' : 'Stock valuation recalculated and updated',
        data: valuation
      });
    } catch (error) {
      console.error('Error calculating stock valuation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate stock valuation',
        error: error.message
      });
    }
  }

  // Calculate FIFO valuation
  static async calculateFIFOValuation(productId, valuationDate) {
    const transactions = await InventoryTransaction.findAll({
      where: {
        product_id: productId,
        transaction_date: {
          [Op.lte]: valuationDate
        },
        is_active: true
      },
      order: [['transaction_date', 'ASC'], ['transaction_time', 'ASC']],
      include: [
        {
          model: Batch,
          as: 'batch',
          required: false
        }
      ]
    });

    let stockBalance = 0;
    let valueBalance = 0;
    const fifoQueue = [];
    const details = [];

    for (const transaction of transactions) {
      const quantity = parseFloat(transaction.quantity);
      const unitCost = parseFloat(transaction.unit_cost) || 0;

      if (quantity > 0) {
        // Inward transaction - add to FIFO queue
        fifoQueue.push({
          quantity: quantity,
          unit_cost: unitCost,
          value: quantity * unitCost,
          transaction_id: transaction.id,
          date: transaction.transaction_date
        });
        stockBalance += quantity;
        valueBalance += quantity * unitCost;
      } else {
        // Outward transaction - consume from FIFO queue
        let remainingToConsume = Math.abs(quantity);
        let consumedValue = 0;

        while (remainingToConsume > 0 && fifoQueue.length > 0) {
          const batch = fifoQueue[0];
          const consumeFromBatch = Math.min(remainingToConsume, batch.quantity);
          
          consumedValue += consumeFromBatch * batch.unit_cost;
          batch.quantity -= consumeFromBatch;
          batch.value -= consumeFromBatch * batch.unit_cost;
          remainingToConsume -= consumeFromBatch;

          if (batch.quantity <= 0) {
            fifoQueue.shift();
          }
        }

        stockBalance += quantity; // quantity is negative
        valueBalance -= consumedValue;
      }

      details.push({
        transaction_id: transaction.id,
        quantity: quantity,
        unit_cost: unitCost,
        running_stock: stockBalance,
        running_value: valueBalance
      });
    }

    const averageCost = stockBalance > 0 ? valueBalance / stockBalance : 0;

    return {
      stock_balance: stockBalance,
      value_balance: valueBalance,
      average_cost: averageCost,
      details: details
    };
  }

  // Calculate LIFO valuation
  static async calculateLIFOValuation(productId, valuationDate) {
    const transactions = await InventoryTransaction.findAll({
      where: {
        product_id: productId,
        transaction_date: {
          [Op.lte]: valuationDate
        },
        is_active: true
      },
      order: [['transaction_date', 'ASC'], ['transaction_time', 'ASC']],
      include: [
        {
          model: Batch,
          as: 'batch',
          required: false
        }
      ]
    });

    let stockBalance = 0;
    let valueBalance = 0;
    const lifoStack = [];
    const details = [];

    for (const transaction of transactions) {
      const quantity = parseFloat(transaction.quantity);
      const unitCost = parseFloat(transaction.unit_cost) || 0;

      if (quantity > 0) {
        // Inward transaction - add to LIFO stack
        lifoStack.push({
          quantity: quantity,
          unit_cost: unitCost,
          value: quantity * unitCost,
          transaction_id: transaction.id,
          date: transaction.transaction_date
        });
        stockBalance += quantity;
        valueBalance += quantity * unitCost;
      } else {
        // Outward transaction - consume from LIFO stack (most recent first)
        let remainingToConsume = Math.abs(quantity);
        let consumedValue = 0;

        while (remainingToConsume > 0 && lifoStack.length > 0) {
          const batch = lifoStack[lifoStack.length - 1];
          const consumeFromBatch = Math.min(remainingToConsume, batch.quantity);
          
          consumedValue += consumeFromBatch * batch.unit_cost;
          batch.quantity -= consumeFromBatch;
          batch.value -= consumeFromBatch * batch.unit_cost;
          remainingToConsume -= consumeFromBatch;

          if (batch.quantity <= 0) {
            lifoStack.pop();
          }
        }

        stockBalance += quantity; // quantity is negative
        valueBalance -= consumedValue;
      }

      details.push({
        transaction_id: transaction.id,
        quantity: quantity,
        unit_cost: unitCost,
        running_stock: stockBalance,
        running_value: valueBalance
      });
    }

    const averageCost = stockBalance > 0 ? valueBalance / stockBalance : 0;

    return {
      stock_balance: stockBalance,
      value_balance: valueBalance,
      average_cost: averageCost,
      details: details
    };
  }

  // Calculate Weighted Average valuation
  static async calculateWeightedAverageValuation(productId, valuationDate) {
    const transactions = await InventoryTransaction.findAll({
      where: {
        product_id: productId,
        transaction_date: {
          [Op.lte]: valuationDate
        },
        is_active: true
      },
      order: [['transaction_date', 'ASC'], ['transaction_time', 'ASC']]
    });

    let stockBalance = 0;
    let valueBalance = 0;
    let weightedAverageCost = 0;
    const details = [];

    for (const transaction of transactions) {
      const quantity = parseFloat(transaction.quantity);
      const unitCost = parseFloat(transaction.unit_cost) || 0;

      if (quantity > 0) {
        // Inward transaction - recalculate weighted average
        const newTotalValue = valueBalance + (quantity * unitCost);
        const newTotalStock = stockBalance + quantity;
        
        weightedAverageCost = newTotalStock > 0 ? newTotalValue / newTotalStock : 0;
        stockBalance = newTotalStock;
        valueBalance = newTotalValue;
      } else {
        // Outward transaction - use current weighted average cost
        const outwardValue = Math.abs(quantity) * weightedAverageCost;
        stockBalance += quantity; // quantity is negative
        valueBalance -= outwardValue;
        
        // Recalculate weighted average cost
        weightedAverageCost = stockBalance > 0 ? valueBalance / stockBalance : 0;
      }

      details.push({
        transaction_id: transaction.id,
        quantity: quantity,
        unit_cost: unitCost,
        weighted_avg_cost: weightedAverageCost,
        running_stock: stockBalance,
        running_value: valueBalance
      });
    }

    return {
      stock_balance: stockBalance,
      value_balance: valueBalance,
      average_cost: weightedAverageCost,
      details: details
    };
  }

  // Get valuation comparison report
  static async getValuationComparison(req, res) {
    try {
      const {
        product_id,
        valuation_date,
        methods = 'FIFO,LIFO,WEIGHTED_AVERAGE'
      } = req.query;

      if (!product_id || !valuation_date) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and valuation date are required'
        });
      }

      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const methodsArray = methods.split(',').map(m => m.trim().toUpperCase());
      const comparisons = [];

      for (const method of methodsArray) {
        let valuationResult;
        switch (method) {
          case 'FIFO':
            valuationResult = await this.calculateFIFOValuation(product_id, valuation_date);
            break;
          case 'LIFO':
            valuationResult = await this.calculateLIFOValuation(product_id, valuation_date);
            break;
          case 'WEIGHTED_AVERAGE':
            valuationResult = await this.calculateWeightedAverageValuation(product_id, valuation_date);
            break;
          default:
            continue;
        }

        comparisons.push({
          method: method,
          stock_balance: valuationResult.stock_balance,
          value_balance: valuationResult.value_balance,
          average_cost: valuationResult.average_cost
        });
      }

      res.json({
        success: true,
        data: {
          product: product,
          valuation_date: valuation_date,
          comparisons: comparisons
        }
      });
    } catch (error) {
      console.error('Error generating valuation comparison:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate valuation comparison',
        error: error.message
      });
    }
  }

  // Generate valuation report for all products
  static async generateValuationReport(req, res) {
    try {
      const {
        valuation_date,
        valuation_method = 'FIFO',
        category_id,
        product_type
      } = req.query;

      if (!valuation_date) {
        return res.status(400).json({
          success: false,
          message: 'Valuation date is required'
        });
      }

      const whereClause = {
        is_active: true
      };

      if (category_id) {
        whereClause.category_id = category_id;
      }

      if (product_type) {
        whereClause.type = product_type;
      }

      const products = await Product.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'sku', 'type', 'current_stock']
      });

      const valuationResults = [];
      let totalValue = 0;
      let totalStock = 0;

      for (const product of products) {
        let valuationResult;
        switch (valuation_method.toUpperCase()) {
          case 'FIFO':
            valuationResult = await this.calculateFIFOValuation(product.id, valuation_date);
            break;
          case 'LIFO':
            valuationResult = await this.calculateLIFOValuation(product.id, valuation_date);
            break;
          case 'WEIGHTED_AVERAGE':
            valuationResult = await this.calculateWeightedAverageValuation(product.id, valuation_date);
            break;
          default:
            continue;
        }

        const result = {
          product: product,
          stock_balance: valuationResult.stock_balance,
          value_balance: valuationResult.value_balance,
          average_cost: valuationResult.average_cost
        };

        valuationResults.push(result);
        totalValue += valuationResult.value_balance;
        totalStock += valuationResult.stock_balance;
      }

      res.json({
        success: true,
        data: {
          valuation_date: valuation_date,
          valuation_method: valuation_method.toUpperCase(),
          total_value: totalValue,
          total_stock: totalStock,
          product_count: valuationResults.length,
          products: valuationResults
        }
      });
    } catch (error) {
      console.error('Error generating valuation report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate valuation report',
        error: error.message
      });
    }
  }
}

module.exports = StockValuationController;
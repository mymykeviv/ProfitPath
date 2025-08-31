const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockValuation = sequelize.define('StockValuation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  valuation_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  valuation_method: {
    type: DataTypes.ENUM('FIFO', 'LIFO', 'WEIGHTED_AVERAGE'),
    allowNull: false,
    defaultValue: 'FIFO'
  },
  opening_stock: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0.0000
  },
  opening_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  inward_quantity: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0.0000
  },
  inward_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  outward_quantity: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0.0000
  },
  outward_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  closing_stock: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0.0000
  },
  closing_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  average_cost: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0.0000
  },
  fifo_layers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'FIFO cost layers for valuation'
  },
  lifo_layers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'LIFO cost layers for valuation'
  },
  warehouse: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Main Warehouse'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'stock_valuations',
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'valuation_date', 'warehouse']
    },
    {
      fields: ['valuation_date']
    },
    {
      fields: ['valuation_method']
    },
    {
      fields: ['warehouse']
    },
    {
      fields: ['is_active']
    }
  ],
  hooks: {
    beforeSave: (valuation) => {
      // Calculate closing stock
      valuation.closing_stock = parseFloat(valuation.opening_stock) + 
                               parseFloat(valuation.inward_quantity) - 
                               parseFloat(valuation.outward_quantity);
      
      // Calculate average cost
      if (valuation.closing_stock > 0) {
        valuation.average_cost = parseFloat(valuation.closing_value) / parseFloat(valuation.closing_stock);
      } else {
        valuation.average_cost = 0;
      }
    }
  }
});

// Instance methods
StockValuation.prototype.calculateFIFOValuation = function(transactions) {
  const layers = [];
  let closingValue = 0;
  let remainingStock = this.closing_stock;
  
  // Process inward transactions to build FIFO layers
  const inwardTransactions = transactions.filter(t => t.quantity > 0)
    .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
  
  inwardTransactions.forEach(transaction => {
    layers.push({
      date: transaction.transaction_date,
      quantity: parseFloat(transaction.quantity),
      unit_cost: parseFloat(transaction.unit_cost),
      remaining: parseFloat(transaction.quantity)
    });
  });
  
  // Process outward transactions to consume FIFO layers
  const outwardTransactions = transactions.filter(t => t.quantity < 0)
    .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
  
  let totalOutward = Math.abs(outwardTransactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0));
  
  // Consume layers in FIFO order
  for (let layer of layers) {
    if (totalOutward <= 0) break;
    
    const consumeQty = Math.min(layer.remaining, totalOutward);
    layer.remaining -= consumeQty;
    totalOutward -= consumeQty;
  }
  
  // Calculate closing value from remaining layers
  layers.forEach(layer => {
    if (layer.remaining > 0) {
      closingValue += layer.remaining * layer.unit_cost;
    }
  });
  
  this.fifo_layers = layers.filter(layer => layer.remaining > 0);
  this.closing_value = closingValue;
  
  return this;
};

StockValuation.prototype.calculateLIFOValuation = function(transactions) {
  const layers = [];
  let closingValue = 0;
  
  // Process inward transactions to build LIFO layers
  const inwardTransactions = transactions.filter(t => t.quantity > 0)
    .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
  
  inwardTransactions.forEach(transaction => {
    layers.push({
      date: transaction.transaction_date,
      quantity: parseFloat(transaction.quantity),
      unit_cost: parseFloat(transaction.unit_cost),
      remaining: parseFloat(transaction.quantity)
    });
  });
  
  // Process outward transactions to consume LIFO layers (reverse order)
  const outwardTransactions = transactions.filter(t => t.quantity < 0)
    .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
  
  let totalOutward = Math.abs(outwardTransactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0));
  
  // Consume layers in LIFO order (reverse)
  for (let i = layers.length - 1; i >= 0 && totalOutward > 0; i--) {
    const layer = layers[i];
    const consumeQty = Math.min(layer.remaining, totalOutward);
    layer.remaining -= consumeQty;
    totalOutward -= consumeQty;
  }
  
  // Calculate closing value from remaining layers
  layers.forEach(layer => {
    if (layer.remaining > 0) {
      closingValue += layer.remaining * layer.unit_cost;
    }
  });
  
  this.lifo_layers = layers.filter(layer => layer.remaining > 0);
  this.closing_value = closingValue;
  
  return this;
};

StockValuation.prototype.calculateWeightedAverageValuation = function(transactions) {
  let totalCost = parseFloat(this.opening_value);
  let totalQuantity = parseFloat(this.opening_stock);
  
  // Add inward transactions
  const inwardTransactions = transactions.filter(t => t.quantity > 0);
  inwardTransactions.forEach(transaction => {
    totalCost += parseFloat(transaction.total_cost);
    totalQuantity += parseFloat(transaction.quantity);
  });
  
  // Calculate weighted average cost
  const weightedAvgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  
  this.average_cost = weightedAvgCost;
  this.closing_value = parseFloat(this.closing_stock) * weightedAvgCost;
  
  return this;
};

// Class methods
StockValuation.generateValuation = async function(productId, valuationDate, method = 'FIFO', warehouse = 'Main Warehouse') {
  const InventoryTransaction = require('./InventoryTransaction');
  
  // Get all transactions up to valuation date
  const transactions = await InventoryTransaction.getTransactionsByProduct(
    productId, 
    null, 
    valuationDate
  );
  
  // Get previous day's valuation for opening balance
  const previousDate = new Date(valuationDate);
  previousDate.setDate(previousDate.getDate() - 1);
  
  const previousValuation = await this.findOne({
    where: {
      product_id: productId,
      valuation_date: previousDate,
      warehouse: warehouse
    }
  });
  
  // Calculate opening and movements for the day
  const dayTransactions = transactions.filter(t => 
    new Date(t.transaction_date).toDateString() === new Date(valuationDate).toDateString()
  );
  
  const inwardQty = dayTransactions
    .filter(t => t.quantity > 0)
    .reduce((sum, t) => sum + parseFloat(t.quantity), 0);
  
  const inwardValue = dayTransactions
    .filter(t => t.quantity > 0)
    .reduce((sum, t) => sum + parseFloat(t.total_cost), 0);
  
  const outwardQty = Math.abs(dayTransactions
    .filter(t => t.quantity < 0)
    .reduce((sum, t) => sum + parseFloat(t.quantity), 0));
  
  // Create valuation record
  const valuation = await this.create({
    product_id: productId,
    valuation_date: valuationDate,
    valuation_method: method,
    opening_stock: previousValuation ? previousValuation.closing_stock : 0,
    opening_value: previousValuation ? previousValuation.closing_value : 0,
    inward_quantity: inwardQty,
    inward_value: inwardValue,
    outward_quantity: outwardQty,
    warehouse: warehouse
  });
  
  // Calculate valuation based on method
  switch (method) {
    case 'FIFO':
      valuation.calculateFIFOValuation(transactions);
      break;
    case 'LIFO':
      valuation.calculateLIFOValuation(transactions);
      break;
    case 'WEIGHTED_AVERAGE':
    default:
      valuation.calculateWeightedAverageValuation(transactions);
      break;
  }
  
  await valuation.save();
  return valuation;
};

StockValuation.getValuationReport = async function(startDate, endDate, method = 'FIFO', warehouse = null) {
  const { Op } = require('sequelize');
  const whereClause = {
    valuation_date: {
      [Op.between]: [startDate, endDate]
    },
    valuation_method: method,
    is_active: true
  };
  
  if (warehouse) {
    whereClause.warehouse = warehouse;
  }
  
  return await this.findAll({
    where: whereClause,
    include: [
      {
        model: require('./Product'),
        as: 'product',
        attributes: ['name', 'sku', 'type']
      }
    ],
    order: [['valuation_date', 'DESC'], ['product_id', 'ASC']]
  });
};

StockValuation.getCurrentValuation = async function(method = 'FIFO', warehouse = null) {
  const { Op } = require('sequelize');
  const today = new Date().toISOString().split('T')[0];
  
  const whereClause = {
    valuation_date: today,
    valuation_method: method,
    is_active: true
  };
  
  if (warehouse) {
    whereClause.warehouse = warehouse;
  }
  
  return await this.findAll({
    where: whereClause,
    include: [
      {
        model: require('./Product'),
        as: 'product',
        attributes: ['name', 'sku', 'type', 'reorder_point']
      }
    ],
    order: [['closing_value', 'DESC']]
  });
};

module.exports = StockValuation;
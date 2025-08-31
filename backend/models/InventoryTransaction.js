const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transaction_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  batch_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'batches',
      key: 'id'
    }
  },
  transaction_type: {
    type: DataTypes.ENUM(
      'purchase_receipt',
      'sales_issue',
      'production_consumption',
      'production_output',
      'adjustment_positive',
      'adjustment_negative',
      'transfer_in',
      'transfer_out',
      'return_in',
      'return_out',
      'scrap',
      'opening_stock'
    ),
    allowNull: false
  },
  reference_type: {
    type: DataTypes.ENUM(
      'purchase_order',
      'sales_invoice',
      'production_batch',
      'stock_adjustment',
      'stock_transfer',
      'return_note',
      'opening_balance'
    ),
    allowNull: true
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  quantity: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  unit_cost: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0.0000,
    validate: {
      min: 0
    }
  },
  total_cost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  running_balance: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0.0000
  },
  running_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  transaction_time: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  warehouse: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Main Warehouse'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'inventory_transactions',
  indexes: [
    {
      fields: ['product_id']
    },
    {
      fields: ['batch_id']
    },
    {
      fields: ['transaction_type']
    },
    {
      fields: ['transaction_date']
    },
    {
      fields: ['reference_type', 'reference_id']
    },
    {
      fields: ['warehouse']
    },
    {
      fields: ['is_active']
    }
  ],
  hooks: {
    beforeValidate: (transaction) => {
      // Auto-generate transaction number if not provided
      if (!transaction.transaction_number) {
        const prefix = 'INV';
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        transaction.transaction_number = `${prefix}-${timestamp}-${random}`;
      }
      
      // Calculate total cost
      if (transaction.quantity && transaction.unit_cost) {
        transaction.total_cost = parseFloat(transaction.quantity) * parseFloat(transaction.unit_cost);
      }
    },
    beforeSave: (transaction) => {
      // Validate quantity based on transaction type
      const inwardTypes = [
        'purchase_receipt',
        'production_output',
        'adjustment_positive',
        'transfer_in',
        'return_in',
        'opening_stock'
      ];
      
      const outwardTypes = [
        'sales_issue',
        'production_consumption',
        'adjustment_negative',
        'transfer_out',
        'return_out',
        'scrap'
      ];
      
      if (inwardTypes.includes(transaction.transaction_type) && transaction.quantity < 0) {
        throw new Error(`Quantity must be positive for ${transaction.transaction_type}`);
      }
      
      if (outwardTypes.includes(transaction.transaction_type) && transaction.quantity > 0) {
        transaction.quantity = -Math.abs(transaction.quantity);
      }
    }
  }
});

// Instance methods
InventoryTransaction.prototype.isInward = function() {
  const inwardTypes = [
    'purchase_receipt',
    'production_output',
    'adjustment_positive',
    'transfer_in',
    'return_in',
    'opening_stock'
  ];
  return inwardTypes.includes(this.transaction_type);
};

InventoryTransaction.prototype.isOutward = function() {
  return !this.isInward();
};

InventoryTransaction.prototype.getAbsoluteQuantity = function() {
  return Math.abs(this.quantity);
};

// Class methods
InventoryTransaction.getTransactionsByProduct = async function(productId, startDate = null, endDate = null) {
  const { Op } = require('sequelize');
  const whereClause = {
    product_id: productId,
    is_active: true
  };
  
  if (startDate && endDate) {
    whereClause.transaction_date = {
      [Op.between]: [startDate, endDate]
    };
  }
  
  return await this.findAll({
    where: whereClause,
    order: [['transaction_date', 'ASC'], ['transaction_time', 'ASC'], ['id', 'ASC']]
  });
};

InventoryTransaction.getStockMovementReport = async function(startDate, endDate, productId = null) {
  const { Op } = require('sequelize');
  const whereClause = {
    transaction_date: {
      [Op.between]: [startDate, endDate]
    },
    is_active: true
  };
  
  if (productId) {
    whereClause.product_id = productId;
  }
  
  return await this.findAll({
    where: whereClause,
    include: [
      {
        model: require('./Product'),
        as: 'product',
        attributes: ['name', 'sku', 'type']
      },
      {
        model: require('./Batch'),
        as: 'batch',
        attributes: ['batch_number', 'expiry_date'],
        required: false
      }
    ],
    order: [['transaction_date', 'DESC'], ['transaction_time', 'DESC']]
  });
};

InventoryTransaction.getInventoryValuation = async function(asOfDate = null, valuationMethod = 'FIFO') {
  const { Op } = require('sequelize');
  const whereClause = {
    is_active: true
  };
  
  if (asOfDate) {
    whereClause.transaction_date = {
      [Op.lte]: asOfDate
    };
  }
  
  const transactions = await this.findAll({
    where: whereClause,
    include: [
      {
        model: require('./Product'),
        as: 'product',
        attributes: ['id', 'name', 'sku', 'type']
      }
    ],
    order: [['product_id', 'ASC'], ['transaction_date', 'ASC'], ['transaction_time', 'ASC']]
  });
  
  const valuationData = {};
  
  transactions.forEach(transaction => {
    const productId = transaction.product_id;
    
    if (!valuationData[productId]) {
      valuationData[productId] = {
        product: transaction.product,
        transactions: [],
        current_stock: 0,
        current_value: 0,
        average_cost: 0
      };
    }
    
    valuationData[productId].transactions.push(transaction);
    valuationData[productId].current_stock += parseFloat(transaction.quantity);
  });
  
  // Calculate valuation based on method
  Object.keys(valuationData).forEach(productId => {
    const data = valuationData[productId];
    
    if (valuationMethod === 'WEIGHTED_AVERAGE') {
      let totalCost = 0;
      let totalQuantity = 0;
      
      data.transactions.forEach(transaction => {
        if (transaction.quantity > 0) { // Only inward transactions for average cost
          totalCost += parseFloat(transaction.total_cost);
          totalQuantity += parseFloat(transaction.quantity);
        }
      });
      
      data.average_cost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      data.current_value = data.current_stock * data.average_cost;
    }
    // FIFO and LIFO valuation would require more complex logic
    // For now, using weighted average as default
  });
  
  return Object.values(valuationData);
};

InventoryTransaction.getLowStockAlert = async function() {
  const products = await require('./Product').findAll({
    where: {
      is_active: true
    }
  });
  
  const alerts = [];
  
  for (const product of products) {
    if (product.current_stock <= product.reorder_point) {
      alerts.push({
        product: product,
        current_stock: product.current_stock,
        reorder_point: product.reorder_point,
        shortage: product.reorder_point - product.current_stock,
        alert_level: product.current_stock === 0 ? 'critical' : 'warning'
      });
    }
  }
  
  return alerts;
};

module.exports = InventoryTransaction;
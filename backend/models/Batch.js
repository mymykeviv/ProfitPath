const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Batch = sequelize.define('Batch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  batch_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  remaining_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  cost_per_unit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  total_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  manufacturing_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  received_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  supplier_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  purchase_order_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'purchase_orders',
      key: 'id'
    }
  },
  production_batch_id: {
    type: DataTypes.UUID,
    allowNull: true
    // TODO: Add reference to production_batches table when implementing Epic 5
    // references: {
    //   model: 'production_batches',
    //   key: 'id'
    // }
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'consumed', 'expired', 'damaged', 'returned'),
    allowNull: false,
    defaultValue: 'active'
  },
  quality_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'on_hold'),
    allowNull: false,
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'batches',
  indexes: [
    {
      unique: true,
      fields: ['batch_number', 'product_id']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['quality_status']
    },
    {
      fields: ['expiry_date']
    },
    {
      fields: ['received_date']
    },
    {
      fields: ['supplier_id']
    },
    {
      fields: ['purchase_order_id']
    }
  ],
  hooks: {
    beforeValidate: (batch) => {
      // Auto-generate batch number if not provided
      if (!batch.batch_number) {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        batch.batch_number = `B${timestamp.slice(-6)}${random}`;
      }
      
      // Calculate total cost
      if (batch.quantity && batch.cost_per_unit) {
        batch.total_cost = (batch.quantity * batch.cost_per_unit).toFixed(2);
      }
      
      // Set remaining quantity to initial quantity if not set
      if (batch.remaining_quantity === undefined || batch.remaining_quantity === null) {
        batch.remaining_quantity = batch.quantity;
      }
    },
    beforeSave: (batch) => {
      // Validate remaining quantity
      if (batch.remaining_quantity > batch.quantity) {
        throw new Error('Remaining quantity cannot be greater than initial quantity');
      }
      
      // Validate expiry date
      if (batch.expiry_date && batch.manufacturing_date) {
        if (new Date(batch.expiry_date) <= new Date(batch.manufacturing_date)) {
          throw new Error('Expiry date must be after manufacturing date');
        }
      }
      
      // Auto-update status based on remaining quantity
      if (batch.remaining_quantity === 0 && batch.status === 'active') {
        batch.status = 'consumed';
      }
      
      // Auto-update status based on expiry
      if (batch.expiry_date && new Date(batch.expiry_date) < new Date() && batch.status === 'active') {
        batch.status = 'expired';
      }
    }
  }
});

// Instance methods
Batch.prototype.isExpired = function() {
  if (!this.expiry_date) return false;
  return new Date(this.expiry_date) < new Date();
};

Batch.prototype.isExpiringSoon = function(days = 30) {
  if (!this.expiry_date) return false;
  const expiryDate = new Date(this.expiry_date);
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + days);
  return expiryDate <= warningDate && expiryDate >= new Date();
};

Batch.prototype.getDaysUntilExpiry = function() {
  if (!this.expiry_date) return null;
  const today = new Date();
  const expiry = new Date(this.expiry_date);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Batch.prototype.getAge = function() {
  const today = new Date();
  const received = new Date(this.received_date);
  const diffTime = today - received;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

Batch.prototype.consume = async function(quantity) {
  if (quantity > this.remaining_quantity) {
    throw new Error('Cannot consume more than remaining quantity');
  }
  
  this.remaining_quantity -= quantity;
  
  if (this.remaining_quantity === 0) {
    this.status = 'consumed';
  }
  
  return await this.save();
};

Batch.prototype.getUtilizationPercentage = function() {
  if (this.quantity === 0) return 0;
  return ((this.quantity - this.remaining_quantity) / this.quantity * 100).toFixed(2);
};

// Class methods
Batch.getExpiredBatches = async function() {
  return await this.findAll({
    where: {
      expiry_date: {
        [sequelize.Sequelize.Op.lt]: new Date()
      },
      status: 'active',
      is_active: true
    }
  });
};

Batch.getExpiringSoonBatches = async function(days = 30) {
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + days);
  
  return await this.findAll({
    where: {
      expiry_date: {
        [sequelize.Sequelize.Op.between]: [new Date(), warningDate]
      },
      status: 'active',
      is_active: true
    },
    order: [['expiry_date', 'ASC']]
  });
};

Batch.getActiveBatchesByProduct = async function(productId) {
  return await this.findAll({
    where: {
      product_id: productId,
      status: 'active',
      remaining_quantity: {
        [sequelize.Sequelize.Op.gt]: 0
      },
      is_active: true
    },
    order: [['received_date', 'ASC']] // FIFO by default
  });
};

Batch.getFIFOBatch = async function(productId, requiredQuantity) {
  const batches = await this.getActiveBatchesByProduct(productId);
  
  const result = [];
  let remainingQuantity = requiredQuantity;
  
  for (const batch of batches) {
    if (remainingQuantity <= 0) break;
    
    const availableQuantity = Math.min(batch.remaining_quantity, remainingQuantity);
    
    result.push({
      batch: batch,
      quantity: availableQuantity
    });
    
    remainingQuantity -= availableQuantity;
  }
  
  return {
    batches: result,
    totalAvailable: requiredQuantity - remainingQuantity,
    shortfall: remainingQuantity > 0 ? remainingQuantity : 0
  };
};

Batch.getLIFOBatch = async function(productId, requiredQuantity) {
  const batches = await this.findAll({
    where: {
      product_id: productId,
      status: 'active',
      remaining_quantity: {
        [sequelize.Sequelize.Op.gt]: 0
      },
      is_active: true
    },
    order: [['received_date', 'DESC']] // LIFO - most recent first
  });
  
  const result = [];
  let remainingQuantity = requiredQuantity;
  
  for (const batch of batches) {
    if (remainingQuantity <= 0) break;
    
    const availableQuantity = Math.min(batch.remaining_quantity, remainingQuantity);
    
    result.push({
      batch: batch,
      quantity: availableQuantity
    });
    
    remainingQuantity -= availableQuantity;
  }
  
  return {
    batches: result,
    totalAvailable: requiredQuantity - remainingQuantity,
    shortfall: remainingQuantity > 0 ? remainingQuantity : 0
  };
};

module.exports = Batch;
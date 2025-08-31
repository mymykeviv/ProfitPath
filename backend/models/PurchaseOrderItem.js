const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  purchase_order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'purchase_orders',
      key: 'id'
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
  line_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  quantity_ordered: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  quantity_received: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  discount_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  discount_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  gst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  gst_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  line_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  expected_delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  received_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'partially_received', 'received', 'cancelled'),
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
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'purchase_order_items',
  timestamps: true,
  underscored: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['purchase_order_id', 'line_number']
    },
    {
      fields: ['purchase_order_id']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['expected_delivery_date']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Hooks
PurchaseOrderItem.beforeSave(async (item, options) => {
  // Calculate discount amount if percentage is provided
  if (item.discount_percentage > 0 && item.discount_amount === 0) {
    const subtotal = item.quantity_ordered * item.unit_price;
    item.discount_amount = (subtotal * item.discount_percentage) / 100;
  }
  
  // Calculate GST amount
  const subtotal = item.quantity_ordered * item.unit_price;
  const subtotalAfterDiscount = subtotal - item.discount_amount;
  item.gst_amount = (subtotalAfterDiscount * item.gst_rate) / 100;
  
  // Calculate line total
  item.line_total = subtotalAfterDiscount + item.gst_amount;
  
  // Validate quantities
  if (item.quantity_received > item.quantity_ordered) {
    throw new Error('Received quantity cannot be greater than ordered quantity');
  }
  
  // Validate discount
  if (item.discount_amount > subtotal) {
    throw new Error('Discount amount cannot be greater than subtotal');
  }
  
  // Update status based on received quantity
  if (item.quantity_received === 0) {
    item.status = 'pending';
  } else if (item.quantity_received < item.quantity_ordered) {
    item.status = 'partially_received';
  } else if (item.quantity_received === item.quantity_ordered) {
    item.status = 'received';
    if (!item.received_date) {
      item.received_date = new Date();
    }
  }
});

// Instance Methods
PurchaseOrderItem.prototype.calculateAmounts = function() {
  const subtotal = this.quantity_ordered * this.unit_price;
  const subtotalAfterDiscount = subtotal - this.discount_amount;
  const gstAmount = (subtotalAfterDiscount * this.gst_rate) / 100;
  const lineTotal = subtotalAfterDiscount + gstAmount;
  
  return {
    subtotal: subtotal,
    discount_amount: this.discount_amount,
    subtotal_after_discount: subtotalAfterDiscount,
    gst_amount: gstAmount,
    line_total: lineTotal
  };
};

PurchaseOrderItem.prototype.getPendingQuantity = function() {
  return this.quantity_ordered - this.quantity_received;
};

PurchaseOrderItem.prototype.getReceivePercentage = function() {
  if (this.quantity_ordered === 0) return 0;
  return (this.quantity_received / this.quantity_ordered) * 100;
};

PurchaseOrderItem.prototype.isFullyReceived = function() {
  return this.quantity_received >= this.quantity_ordered;
};

PurchaseOrderItem.prototype.isPartiallyReceived = function() {
  return this.quantity_received > 0 && this.quantity_received < this.quantity_ordered;
};

PurchaseOrderItem.prototype.isPending = function() {
  return this.quantity_received === 0;
};

PurchaseOrderItem.prototype.canReceive = function(quantity = null) {
  const pendingQty = this.getPendingQuantity();
  if (quantity === null) {
    return pendingQty > 0;
  }
  return quantity > 0 && quantity <= pendingQty;
};

PurchaseOrderItem.prototype.receiveQuantity = async function(quantity, receivedDate = null) {
  if (!this.canReceive(quantity)) {
    throw new Error(`Cannot receive ${quantity} items. Only ${this.getPendingQuantity()} items pending.`);
  }
  
  this.quantity_received += quantity;
  if (receivedDate) {
    this.received_date = receivedDate;
  }
  
  await this.save();
  return this;
};

// Class Methods
PurchaseOrderItem.getPendingItems = function() {
  return this.findAll({
    where: {
      status: ['pending', 'partially_received'],
      is_active: true
    },
    order: [['expected_delivery_date', 'ASC']]
  });
};

PurchaseOrderItem.getItemsByPurchaseOrder = function(purchaseOrderId) {
  return this.findAll({
    where: {
      purchase_order_id: purchaseOrderId,
      is_active: true
    },
    order: [['line_number', 'ASC']]
  });
};

PurchaseOrderItem.getItemsByProduct = function(productId) {
  return this.findAll({
    where: {
      product_id: productId,
      is_active: true
    },
    order: [['created_at', 'DESC']]
  });
};

PurchaseOrderItem.getOverdueItems = function() {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      expected_delivery_date: {
        [Op.lt]: new Date()
      },
      status: ['pending', 'partially_received'],
      is_active: true
    },
    order: [['expected_delivery_date', 'ASC']]
  });
};

PurchaseOrderItem.getItemsByDateRange = function(startDate, endDate) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      expected_delivery_date: {
        [Op.between]: [startDate, endDate]
      },
      is_active: true
    },
    order: [['expected_delivery_date', 'ASC']]
  });
};

module.exports = PurchaseOrderItem;
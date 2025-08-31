const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  po_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  po_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expected_delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
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
  tax_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  shipping_charges: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  other_charges: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  payment_terms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 30,
    validate: {
      min: 0,
      max: 365
    },
    comment: 'Payment terms in days'
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  billing_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  terms_and_conditions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  internal_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID who created this PO'
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID who approved this PO'
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellation_reason: {
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
  tableName: 'purchase_orders',
  timestamps: true,
  underscored: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['po_number']
    },
    {
      fields: ['supplier_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['po_date']
    },
    {
      fields: ['expected_delivery_date']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['created_by']
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
PurchaseOrder.beforeValidate(async (po, options) => {
  // Auto-generate PO number if not provided
  if (!po.po_number) {
    const currentYear = new Date().getFullYear();
    const count = await PurchaseOrder.count({
      where: {
        po_date: {
          [sequelize.Sequelize.Op.gte]: new Date(currentYear, 0, 1)
        }
      }
    });
    po.po_number = `PO${currentYear}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Ensure PO number is uppercase
  if (po.po_number) {
    po.po_number = po.po_number.toUpperCase();
  }
});

PurchaseOrder.beforeSave(async (po, options) => {
  // Calculate total amount
  const subtotalAfterDiscount = po.subtotal - po.discount_amount;
  po.total_amount = subtotalAfterDiscount + po.tax_amount + po.shipping_charges + po.other_charges;
  
  // Validate amounts
  if (po.discount_amount > po.subtotal) {
    throw new Error('Discount amount cannot be greater than subtotal');
  }
  
  // Set timestamps based on status changes
  if (po.changed('status')) {
    const now = new Date();
    switch (po.status) {
      case 'sent':
        if (!po.sent_at) po.sent_at = now;
        break;
      case 'confirmed':
        if (!po.confirmed_at) po.confirmed_at = now;
        break;
      case 'cancelled':
        if (!po.cancelled_at) po.cancelled_at = now;
        break;
    }
  }
});

// Instance Methods
PurchaseOrder.prototype.calculateTotals = function() {
  const subtotalAfterDiscount = this.subtotal - this.discount_amount;
  return {
    subtotal: this.subtotal,
    discount_amount: this.discount_amount,
    subtotal_after_discount: subtotalAfterDiscount,
    tax_amount: this.tax_amount,
    shipping_charges: this.shipping_charges,
    other_charges: this.other_charges,
    total_amount: subtotalAfterDiscount + this.tax_amount + this.shipping_charges + this.other_charges
  };
};

PurchaseOrder.prototype.canBeEdited = function() {
  return ['draft', 'sent'].includes(this.status);
};

PurchaseOrder.prototype.canBeCancelled = function() {
  return ['draft', 'sent', 'confirmed'].includes(this.status);
};

PurchaseOrder.prototype.canBeReceived = function() {
  return ['confirmed', 'partially_received'].includes(this.status);
};

PurchaseOrder.prototype.isOverdue = function() {
  if (!this.expected_delivery_date || this.status === 'received' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > new Date(this.expected_delivery_date);
};

PurchaseOrder.prototype.getDaysUntilDelivery = function() {
  if (!this.expected_delivery_date) return null;
  
  const today = new Date();
  const deliveryDate = new Date(this.expected_delivery_date);
  const diffTime = deliveryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

PurchaseOrder.prototype.getStatusHistory = function() {
  const history = [];
  
  if (this.created_at) {
    history.push({ status: 'draft', timestamp: this.created_at });
  }
  if (this.sent_at) {
    history.push({ status: 'sent', timestamp: this.sent_at });
  }
  if (this.confirmed_at) {
    history.push({ status: 'confirmed', timestamp: this.confirmed_at });
  }
  if (this.cancelled_at) {
    history.push({ status: 'cancelled', timestamp: this.cancelled_at });
  }
  
  return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Class Methods
PurchaseOrder.getPendingOrders = function() {
  return this.findAll({
    where: {
      status: ['sent', 'confirmed', 'partially_received'],
      is_active: true
    },
    order: [['expected_delivery_date', 'ASC']]
  });
};

PurchaseOrder.getOverdueOrders = function() {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      expected_delivery_date: {
        [Op.lt]: new Date()
      },
      status: ['sent', 'confirmed', 'partially_received'],
      is_active: true
    },
    order: [['expected_delivery_date', 'ASC']]
  });
};

PurchaseOrder.getOrdersBySupplier = function(supplierId) {
  return this.findAll({
    where: {
      supplier_id: supplierId,
      is_active: true
    },
    order: [['po_date', 'DESC']]
  });
};

PurchaseOrder.getOrdersByDateRange = function(startDate, endDate) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      po_date: {
        [Op.between]: [startDate, endDate]
      },
      is_active: true
    },
    order: [['po_date', 'DESC']]
  });
};

PurchaseOrder.getOrdersByStatus = function(status) {
  return this.findAll({
    where: {
      status: status,
      is_active: true
    },
    order: [['po_date', 'DESC']]
  });
};

module.exports = PurchaseOrder;
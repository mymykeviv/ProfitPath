const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  payment_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  reference_type: {
    type: DataTypes.ENUM('sales_invoice', 'purchase_order', 'expense', 'advance', 'refund', 'other'),
    allowNull: false
  },
  reference_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the related invoice, purchase order, etc.'
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  supplier_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  payment_type: {
    type: DataTypes.ENUM('received', 'paid'),
    allowNull: false,
    comment: 'received = money coming in, paid = money going out'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'cheque', 'bank_transfer', 'upi', 'card', 'online', 'other'),
    allowNull: false,
    defaultValue: 'cash'
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Bank transaction ID, UPI reference, etc.'
  },
  cheque_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  cheque_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  bank_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'cleared', 'bounced', 'cancelled'),
    allowNull: false,
    defaultValue: 'cleared'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  approved_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['payment_number']
    },
    {
      fields: ['reference_type', 'reference_id']
    },
    {
      fields: ['customer_id']
    },
    {
      fields: ['supplier_id']
    },
    {
      fields: ['payment_date']
    },
    {
      fields: ['payment_type']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance Methods
Payment.prototype.getFormattedAmount = function() {
  return parseFloat(this.amount).toFixed(2);
};

Payment.prototype.isReceived = function() {
  return this.payment_type === 'received';
};

Payment.prototype.isPaid = function() {
  return this.payment_type === 'paid';
};

Payment.prototype.isCleared = function() {
  return this.status === 'cleared';
};

Payment.prototype.isPending = function() {
  return this.status === 'pending';
};

// Class Methods
Payment.getPaymentsByCustomer = async function(customerId, options = {}) {
  const { startDate, endDate, status, paymentType } = options;
  const whereClause = {
    customer_id: customerId,
    is_active: true
  };

  if (startDate && endDate) {
    const { Op } = require('sequelize');
    whereClause.payment_date = {
      [Op.between]: [startDate, endDate]
    };
  }

  if (status) {
    whereClause.status = status;
  }

  if (paymentType) {
    whereClause.payment_type = paymentType;
  }

  return await this.findAll({
    where: whereClause,
    order: [['payment_date', 'DESC']]
  });
};

Payment.getPaymentsBySupplier = async function(supplierId, options = {}) {
  const { startDate, endDate, status, paymentType } = options;
  const whereClause = {
    supplier_id: supplierId,
    is_active: true
  };

  if (startDate && endDate) {
    const { Op } = require('sequelize');
    whereClause.payment_date = {
      [Op.between]: [startDate, endDate]
    };
  }

  if (status) {
    whereClause.status = status;
  }

  if (paymentType) {
    whereClause.payment_type = paymentType;
  }

  return await this.findAll({
    where: whereClause,
    order: [['payment_date', 'DESC']]
  });
};

Payment.getPaymentsByDateRange = async function(startDate, endDate, options = {}) {
  const { Op } = require('sequelize');
  const { paymentType, status, customerId, supplierId } = options;
  
  const whereClause = {
    payment_date: {
      [Op.between]: [startDate, endDate]
    },
    is_active: true
  };

  if (paymentType) {
    whereClause.payment_type = paymentType;
  }

  if (status) {
    whereClause.status = status;
  }

  if (customerId) {
    whereClause.customer_id = customerId;
  }

  if (supplierId) {
    whereClause.supplier_id = supplierId;
  }

  return await this.findAll({
    where: whereClause,
    order: [['payment_date', 'DESC']]
  });
};

Payment.getPendingPayments = async function() {
  return await this.findAll({
    where: {
      status: 'pending',
      is_active: true
    },
    order: [['payment_date', 'ASC']]
  });
};

Payment.getPaymentStatistics = async function() {
  const { Op } = require('sequelize');
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [totalReceived, totalPaid, monthlyReceived, monthlyPaid, yearlyReceived, yearlyPaid, pendingCount] = await Promise.all([
    this.sum('amount', {
      where: {
        payment_type: 'received',
        status: 'cleared',
        is_active: true
      }
    }),
    this.sum('amount', {
      where: {
        payment_type: 'paid',
        status: 'cleared',
        is_active: true
      }
    }),
    this.sum('amount', {
      where: {
        payment_type: 'received',
        status: 'cleared',
        payment_date: { [Op.gte]: startOfMonth },
        is_active: true
      }
    }),
    this.sum('amount', {
      where: {
        payment_type: 'paid',
        status: 'cleared',
        payment_date: { [Op.gte]: startOfMonth },
        is_active: true
      }
    }),
    this.sum('amount', {
      where: {
        payment_type: 'received',
        status: 'cleared',
        payment_date: { [Op.gte]: startOfYear },
        is_active: true
      }
    }),
    this.sum('amount', {
      where: {
        payment_type: 'paid',
        status: 'cleared',
        payment_date: { [Op.gte]: startOfYear },
        is_active: true
      }
    }),
    this.count({
      where: {
        status: 'pending',
        is_active: true
      }
    })
  ]);

  return {
    total_received: totalReceived || 0,
    total_paid: totalPaid || 0,
    net_cash_flow: (totalReceived || 0) - (totalPaid || 0),
    monthly_received: monthlyReceived || 0,
    monthly_paid: monthlyPaid || 0,
    monthly_net: (monthlyReceived || 0) - (monthlyPaid || 0),
    yearly_received: yearlyReceived || 0,
    yearly_paid: yearlyPaid || 0,
    yearly_net: (yearlyReceived || 0) - (yearlyPaid || 0),
    pending_count: pendingCount || 0
  };
};

Payment.generatePaymentNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  const prefix = `PAY${year}${month}`;
  
  const lastPayment = await this.findOne({
    where: {
      payment_number: {
        [require('sequelize').Op.like]: `${prefix}%`
      }
    },
    order: [['payment_number', 'DESC']]
  });
  
  let sequence = 1;
  if (lastPayment) {
    const lastSequence = parseInt(lastPayment.payment_number.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

// Hooks
Payment.beforeCreate(async (payment) => {
  if (!payment.payment_number) {
    payment.payment_number = await Payment.generatePaymentNumber();
  }
});

module.exports = Payment;
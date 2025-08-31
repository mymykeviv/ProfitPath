const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentReminder = sequelize.define('PaymentReminder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reference_type: {
    type: DataTypes.ENUM('sales_invoice', 'purchase_order'),
    allowNull: false
  },
  reference_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID of the related invoice or purchase order'
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
  reminder_type: {
    type: DataTypes.ENUM('payment_due', 'overdue', 'follow_up', 'final_notice'),
    allowNull: false
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  overdue_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  outstanding_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  reminder_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  next_reminder_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'acknowledged', 'resolved', 'escalated'),
    allowNull: false,
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contact_method: {
    type: DataTypes.ENUM('email', 'phone', 'sms', 'letter', 'in_person'),
    allowNull: false,
    defaultValue: 'email'
  },
  contact_person: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  acknowledged_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'payment_reminders',
  timestamps: true,
  underscored: true,
  indexes: [
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
      fields: ['due_date']
    },
    {
      fields: ['reminder_date']
    },
    {
      fields: ['next_reminder_date']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['overdue_days']
    }
  ]
});

// Instance Methods
PaymentReminder.prototype.isOverdue = function() {
  return this.overdue_days > 0;
};

PaymentReminder.prototype.getOverdueCategory = function() {
  if (this.overdue_days <= 0) return 'current';
  if (this.overdue_days <= 30) return '1-30_days';
  if (this.overdue_days <= 60) return '31-60_days';
  if (this.overdue_days <= 90) return '61-90_days';
  return 'over_90_days';
};

PaymentReminder.prototype.markAsSent = function() {
  this.status = 'sent';
  this.sent_at = new Date();
  return this.save();
};

PaymentReminder.prototype.markAsAcknowledged = function() {
  this.status = 'acknowledged';
  this.acknowledged_at = new Date();
  return this.save();
};

PaymentReminder.prototype.markAsResolved = function() {
  this.status = 'resolved';
  this.resolved_at = new Date();
  return this.save();
};

PaymentReminder.prototype.escalate = function() {
  this.status = 'escalated';
  this.priority = 'urgent';
  return this.save();
};

// Class Methods
PaymentReminder.getPendingReminders = async function() {
  return await this.findAll({
    where: {
      status: 'pending',
      is_active: true
    },
    order: [['priority', 'DESC'], ['overdue_days', 'DESC'], ['due_date', 'ASC']]
  });
};

PaymentReminder.getOverdueReminders = async function() {
  return await this.findAll({
    where: {
      overdue_days: {
        [require('sequelize').Op.gt]: 0
      },
      status: {
        [require('sequelize').Op.in]: ['pending', 'sent']
      },
      is_active: true
    },
    order: [['overdue_days', 'DESC'], ['outstanding_amount', 'DESC']]
  });
};

PaymentReminder.getRemindersByCustomer = async function(customerId) {
  return await this.findAll({
    where: {
      customer_id: customerId,
      is_active: true
    },
    order: [['reminder_date', 'DESC']]
  });
};

PaymentReminder.getRemindersBySupplier = async function(supplierId) {
  return await this.findAll({
    where: {
      supplier_id: supplierId,
      is_active: true
    },
    order: [['reminder_date', 'DESC']]
  });
};

PaymentReminder.getAgingReport = async function(options = {}) {
  const { Op } = require('sequelize');
  const { customerIds, supplierIds, asOfDate } = options;
  const cutoffDate = asOfDate || new Date();
  
  const whereClause = {
    status: {
      [Op.in]: ['pending', 'sent', 'acknowledged']
    },
    is_active: true
  };

  if (customerIds && customerIds.length > 0) {
    whereClause.customer_id = {
      [Op.in]: customerIds
    };
  }

  if (supplierIds && supplierIds.length > 0) {
    whereClause.supplier_id = {
      [Op.in]: supplierIds
    };
  }

  const reminders = await this.findAll({
    where: whereClause,
    order: [['overdue_days', 'DESC'], ['outstanding_amount', 'DESC']]
  });

  // Group by aging buckets
  const agingBuckets = {
    current: { count: 0, amount: 0 },
    '1-30_days': { count: 0, amount: 0 },
    '31-60_days': { count: 0, amount: 0 },
    '61-90_days': { count: 0, amount: 0 },
    'over_90_days': { count: 0, amount: 0 }
  };

  reminders.forEach(reminder => {
    const category = reminder.getOverdueCategory();
    agingBuckets[category].count += 1;
    agingBuckets[category].amount += parseFloat(reminder.outstanding_amount);
  });

  return {
    aging_buckets: agingBuckets,
    total_outstanding: reminders.reduce((sum, r) => sum + parseFloat(r.outstanding_amount), 0),
    total_count: reminders.length,
    as_of_date: cutoffDate
  };
};

PaymentReminder.getDueToday = async function() {
  const today = new Date().toISOString().split('T')[0];
  return await this.findAll({
    where: {
      next_reminder_date: today,
      status: {
        [require('sequelize').Op.in]: ['pending', 'sent']
      },
      is_active: true
    },
    order: [['priority', 'DESC'], ['overdue_days', 'DESC']]
  });
};

PaymentReminder.createFromInvoice = async function(invoice) {
  const today = new Date();
  const dueDate = new Date(invoice.due_date);
  const overdueDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
  
  let reminderType = 'payment_due';
  let priority = 'medium';
  
  if (overdueDays > 0) {
    reminderType = 'overdue';
    if (overduedays > 60) {
      priority = 'high';
    } else if (overduedays > 90) {
      priority = 'urgent';
    }
  }

  return await this.create({
    reference_type: 'sales_invoice',
    reference_id: invoice.id,
    customer_id: invoice.customer_id,
    reminder_type: reminderType,
    due_date: invoice.due_date,
    overdue_days: overduedays,
    outstanding_amount: invoice.balance_amount,
    priority: priority,
    message: `Payment reminder for Invoice #${invoice.invoice_number}. Amount due: $${invoice.balance_amount}`,
    next_reminder_date: new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 days from now
  });
};

PaymentReminder.updateOverdueDays = async function() {
  const { Op } = require('sequelize');
  const today = new Date();
  
  const activeReminders = await this.findAll({
    where: {
      status: {
        [Op.in]: ['pending', 'sent', 'acknowledged']
      },
      is_active: true
    }
  });

  for (const reminder of activeReminders) {
    const dueDate = new Date(reminder.due_date);
    const overduedays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
    
    if (reminder.overdue_days !== overduedays) {
      await reminder.update({ overdue_days: overduedays });
    }
  }
};

module.exports = PaymentReminder;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalesInvoice = sequelize.define('SalesInvoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  invoice_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'draft'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  discount_type: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false,
    defaultValue: 'percentage'
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  discount_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  taxable_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  cgst_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  sgst_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  igst_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  cess_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  total_tax_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  shipping_charges: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  other_charges: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  round_off: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  paid_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  balance_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  payment_terms: {
    type: DataTypes.ENUM('cash', 'credit', 'advance', 'cod', 'net_30', 'net_60', 'net_90'),
    allowNull: false,
    defaultValue: 'cash'
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'cheque', 'bank_transfer', 'upi', 'card', 'online', 'other'),
    allowNull: true
  },
  billing_address: {
    type: DataTypes.JSON,
    allowNull: true
  },
  shipping_address: {
    type: DataTypes.JSON,
    allowNull: true
  },
  place_of_supply: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  reverse_charge: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  e_way_bill_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [0, 20]
    }
  },
  vehicle_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [0, 20]
    }
  },
  transport_mode: {
    type: DataTypes.ENUM('road', 'rail', 'air', 'ship', 'courier', 'hand_delivery'),
    allowNull: true
  },
  transporter_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  lr_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  sales_person: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  reference_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
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
  sent_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paid_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  approved_by: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  approved_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'sales_invoices',
  indexes: [
    {
      unique: true,
      fields: ['invoice_number']
    },
    {
      fields: ['customer_id']
    },
    {
      fields: ['invoice_date']
    },
    {
      fields: ['due_date']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['total_amount']
    },
    {
      fields: ['balance_amount']
    },
    {
      fields: ['sales_person']
    },
    {
      fields: ['created_by']
    }
  ],
  hooks: {
    beforeValidate: (invoice) => {
      // Auto-generate invoice number if not provided
      if (!invoice.invoice_number) {
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const timestamp = Date.now().toString().slice(-6);
        invoice.invoice_number = `INV${year}${month}${timestamp}`;
      }
      
      // Ensure uppercase for invoice number
      if (invoice.invoice_number) {
        invoice.invoice_number = invoice.invoice_number.toUpperCase();
      }
      
      // Ensure uppercase for e-way bill and vehicle numbers
      if (invoice.e_way_bill_number) {
        invoice.e_way_bill_number = invoice.e_way_bill_number.toUpperCase();
      }
      if (invoice.vehicle_number) {
        invoice.vehicle_number = invoice.vehicle_number.toUpperCase();
      }
    },
    beforeSave: (invoice) => {
      // Calculate discount amount
      if (invoice.discount_type === 'percentage') {
        invoice.discount_amount = (invoice.subtotal * invoice.discount_value) / 100;
      } else {
        invoice.discount_amount = invoice.discount_value;
      }
      
      // Calculate taxable amount
      invoice.taxable_amount = invoice.subtotal - invoice.discount_amount;
      
      // Calculate total tax amount
      invoice.total_tax_amount = invoice.cgst_amount + invoice.sgst_amount + invoice.igst_amount + invoice.cess_amount;
      
      // Calculate total amount
      const beforeRoundOff = invoice.taxable_amount + invoice.total_tax_amount + invoice.shipping_charges + invoice.other_charges;
      const rounded = Math.round(beforeRoundOff);
      invoice.round_off = rounded - beforeRoundOff;
      invoice.total_amount = rounded;
      
      // Calculate balance amount
      invoice.balance_amount = invoice.total_amount - invoice.paid_amount;
      
      // Validate discount amount
      if (invoice.discount_amount > invoice.subtotal) {
        throw new Error('Discount amount cannot exceed subtotal');
      }
      
      // Validate paid amount
      if (invoice.paid_amount > invoice.total_amount) {
        throw new Error('Paid amount cannot exceed total amount');
      }
      
      // Set due date based on payment terms if not provided
      if (!invoice.due_date && invoice.invoice_date) {
        const invoiceDate = new Date(invoice.invoice_date);
        switch (invoice.payment_terms) {
          case 'net_30':
            invoiceDate.setDate(invoiceDate.getDate() + 30);
            break;
          case 'net_60':
            invoiceDate.setDate(invoiceDate.getDate() + 60);
            break;
          case 'net_90':
            invoiceDate.setDate(invoiceDate.getDate() + 90);
            break;
          default:
            invoiceDate.setDate(invoiceDate.getDate() + 0);
        }
        invoice.due_date = invoiceDate.toISOString().split('T')[0];
      }
      
      // Set status based on payment
      if (invoice.balance_amount === 0 && invoice.paid_amount > 0) {
        invoice.status = 'paid';
        if (!invoice.paid_date) {
          invoice.paid_date = new Date();
        }
      } else if (invoice.paid_amount > 0 && invoice.balance_amount > 0) {
        invoice.status = 'partially_paid';
      } else if (invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.balance_amount > 0) {
        invoice.status = 'overdue';
      }
      
      // Set timestamps based on status changes
      if (invoice.status === 'sent' && !invoice.sent_date) {
        invoice.sent_date = new Date();
      }
      if (invoice.status === 'cancelled' && !invoice.cancelled_date) {
        invoice.cancelled_date = new Date();
      }
    }
  }
});

// Instance methods
SalesInvoice.prototype.calculateTotals = function() {
  return {
    subtotal: this.subtotal,
    discount_amount: this.discount_amount,
    taxable_amount: this.taxable_amount,
    total_tax_amount: this.total_tax_amount,
    total_amount: this.total_amount,
    paid_amount: this.paid_amount,
    balance_amount: this.balance_amount
  };
};

SalesInvoice.prototype.canEdit = function() {
  return ['draft', 'pending'].includes(this.status);
};

SalesInvoice.prototype.canCancel = function() {
  return ['draft', 'pending', 'sent'].includes(this.status);
};

SalesInvoice.prototype.canSend = function() {
  return ['draft', 'pending'].includes(this.status);
};

SalesInvoice.prototype.isOverdue = function() {
  if (!this.due_date || this.balance_amount === 0) return false;
  return new Date(this.due_date) < new Date() && this.balance_amount > 0;
};

SalesInvoice.prototype.getDaysOverdue = function() {
  if (!this.isOverdue()) return 0;
  const today = new Date();
  const dueDate = new Date(this.due_date);
  const diffTime = today - dueDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

SalesInvoice.prototype.getDaysUntilDue = function() {
  if (!this.due_date) return null;
  const today = new Date();
  const dueDate = new Date(this.due_date);
  const diffTime = dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

SalesInvoice.prototype.getPaymentStatus = function() {
  if (this.balance_amount === 0) return 'paid';
  if (this.paid_amount > 0) return 'partially_paid';
  if (this.isOverdue()) return 'overdue';
  return 'pending';
};

SalesInvoice.prototype.getTaxBreakdown = function() {
  return {
    cgst_amount: this.cgst_amount,
    sgst_amount: this.sgst_amount,
    igst_amount: this.igst_amount,
    cess_amount: this.cess_amount,
    total_tax_amount: this.total_tax_amount
  };
};

// Class methods
SalesInvoice.getPendingInvoices = async function() {
  return await this.findAll({
    where: {
      status: ['pending', 'sent'],
      balance_amount: { [require('sequelize').Op.gt]: 0 }
    },
    order: [['invoice_date', 'ASC']]
  });
};

SalesInvoice.getOverdueInvoices = async function() {
  const { Op } = require('sequelize');
  return await this.findAll({
    where: {
      due_date: { [Op.lt]: new Date() },
      balance_amount: { [Op.gt]: 0 },
      status: { [Op.not]: ['cancelled', 'paid'] }
    },
    order: [['due_date', 'ASC']]
  });
};

SalesInvoice.getInvoicesByCustomer = async function(customerId) {
  return await this.findAll({
    where: { customer_id: customerId },
    order: [['invoice_date', 'DESC']]
  });
};

SalesInvoice.getInvoicesByDateRange = async function(startDate, endDate) {
  const { Op } = require('sequelize');
  return await this.findAll({
    where: {
      invoice_date: {
        [Op.between]: [startDate, endDate]
      }
    },
    order: [['invoice_date', 'DESC']]
  });
};

SalesInvoice.getInvoicesByStatus = async function(status) {
  return await this.findAll({
    where: { status: status },
    order: [['invoice_date', 'DESC']]
  });
};

SalesInvoice.getSalesStatistics = async function() {
  const { Op } = require('sequelize');
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  
  const [totalInvoices, totalValue, pendingInvoices, overdueInvoices, monthlyValue, yearlyValue] = await Promise.all([
    this.count(),
    this.sum('total_amount'),
    this.count({
      where: {
        status: ['pending', 'sent'],
        balance_amount: { [Op.gt]: 0 }
      }
    }),
    this.count({
      where: {
        due_date: { [Op.lt]: today },
        balance_amount: { [Op.gt]: 0 },
        status: { [Op.not]: ['cancelled', 'paid'] }
      }
    }),
    this.sum('total_amount', {
      where: {
        invoice_date: { [Op.gte]: startOfMonth }
      }
    }),
    this.sum('total_amount', {
      where: {
        invoice_date: { [Op.gte]: startOfYear }
      }
    })
  ]);
  
  return {
    total_invoices: totalInvoices || 0,
    total_value: totalValue || 0,
    pending_invoices: pendingInvoices || 0,
    overdue_invoices: overdueInvoices || 0,
    monthly_value: monthlyValue || 0,
    yearly_value: yearlyValue || 0
  };
};

module.exports = SalesInvoice;
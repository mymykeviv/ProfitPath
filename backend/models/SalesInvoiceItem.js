const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalesInvoiceItem = sequelize.define('SalesInvoiceItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sales_invoice_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'sales_invoices',
      key: 'id'
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
  line_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  product_sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  product_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hsn_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [0, 20]
    }
  },
  unit_of_measure: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pieces',
    validate: {
      isIn: [['pieces', 'kg', 'grams', 'liters', 'ml', 'meters', 'cm', 'boxes', 'packets']]
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    validate: {
      min: 0.001
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  gross_amount: {
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
    type: DataTypes.DECIMAL(10, 2),
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
  gst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 18.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  cgst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 9.00,
    validate: {
      min: 0,
      max: 50
    }
  },
  sgst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 9.00,
    validate: {
      min: 0,
      max: 50
    }
  },
  igst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  cess_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
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
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  line_total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  batch_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'batches',
      key: 'id'
    }
  },
  batch_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  manufacturing_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  serial_numbers: {
    type: DataTypes.JSON,
    allowNull: true,
    validate: {
      isValidSerialNumbers(value) {
        if (value && !Array.isArray(value)) {
          throw new Error('Serial numbers must be an array');
        }
      }
    }
  },
  warranty_period: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  warranty_type: {
    type: DataTypes.ENUM('days', 'months', 'years'),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sales_invoice_items',
  indexes: [
    {
      unique: true,
      fields: ['sales_invoice_id', 'line_number']
    },
    {
      fields: ['sales_invoice_id']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['batch_id']
    },
    {
      fields: ['product_sku']
    },
    {
      fields: ['hsn_code']
    }
  ],
  hooks: {
    beforeSave: (item) => {
      // Calculate gross amount
      item.gross_amount = item.quantity * item.unit_price;
      
      // Calculate discount amount
      if (item.discount_type === 'percentage') {
        item.discount_amount = (item.gross_amount * item.discount_value) / 100;
      } else {
        item.discount_amount = item.discount_value;
      }
      
      // Validate discount amount
      if (item.discount_amount > item.gross_amount) {
        throw new Error('Discount amount cannot exceed gross amount');
      }
      
      // Calculate taxable amount
      item.taxable_amount = item.gross_amount - item.discount_amount;
      
      // Calculate tax amounts
      item.cgst_amount = (item.taxable_amount * item.cgst_rate) / 100;
      item.sgst_amount = (item.taxable_amount * item.sgst_rate) / 100;
      item.igst_amount = (item.taxable_amount * item.igst_rate) / 100;
      item.cess_amount = (item.taxable_amount * item.cess_rate) / 100;
      
      // Calculate total tax amount
      item.total_tax_amount = item.cgst_amount + item.sgst_amount + item.igst_amount + item.cess_amount;
      
      // Calculate line total
      item.line_total = item.taxable_amount + item.total_tax_amount;
      
      // Validate GST rates consistency
      if (item.igst_rate > 0 && (item.cgst_rate > 0 || item.sgst_rate > 0)) {
        throw new Error('Cannot have both IGST and CGST/SGST rates');
      }
      
      if (item.igst_rate === 0 && item.cgst_rate + item.sgst_rate !== item.gst_rate) {
        throw new Error('CGST + SGST rates must equal GST rate');
      }
      
      if (item.igst_rate > 0 && item.igst_rate !== item.gst_rate) {
        throw new Error('IGST rate must equal GST rate');
      }
    }
  }
});

// Instance methods
SalesInvoiceItem.prototype.calculateAmounts = function() {
  return {
    gross_amount: this.gross_amount,
    discount_amount: this.discount_amount,
    taxable_amount: this.taxable_amount,
    total_tax_amount: this.total_tax_amount,
    line_total: this.line_total
  };
};

SalesInvoiceItem.prototype.getTaxBreakdown = function() {
  return {
    gst_rate: this.gst_rate,
    cgst_rate: this.cgst_rate,
    sgst_rate: this.sgst_rate,
    igst_rate: this.igst_rate,
    cess_rate: this.cess_rate,
    cgst_amount: this.cgst_amount,
    sgst_amount: this.sgst_amount,
    igst_amount: this.igst_amount,
    cess_amount: this.cess_amount,
    total_tax_amount: this.total_tax_amount
  };
};

SalesInvoiceItem.prototype.getDiscountInfo = function() {
  return {
    discount_type: this.discount_type,
    discount_value: this.discount_value,
    discount_amount: this.discount_amount,
    discount_percentage: this.gross_amount > 0 ? (this.discount_amount / this.gross_amount) * 100 : 0
  };
};

SalesInvoiceItem.prototype.getBatchInfo = function() {
  return {
    batch_id: this.batch_id,
    batch_number: this.batch_number,
    expiry_date: this.expiry_date,
    manufacturing_date: this.manufacturing_date,
    serial_numbers: this.serial_numbers
  };
};

SalesInvoiceItem.prototype.getWarrantyInfo = function() {
  if (!this.warranty_period || !this.warranty_type) return null;
  
  const warrantyEndDate = new Date();
  switch (this.warranty_type) {
    case 'days':
      warrantyEndDate.setDate(warrantyEndDate.getDate() + this.warranty_period);
      break;
    case 'months':
      warrantyEndDate.setMonth(warrantyEndDate.getMonth() + this.warranty_period);
      break;
    case 'years':
      warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + this.warranty_period);
      break;
  }
  
  return {
    warranty_period: this.warranty_period,
    warranty_type: this.warranty_type,
    warranty_end_date: warrantyEndDate.toISOString().split('T')[0]
  };
};

// Class methods
SalesInvoiceItem.getItemsBySalesInvoice = async function(salesInvoiceId) {
  return await this.findAll({
    where: { sales_invoice_id: salesInvoiceId },
    order: [['line_number', 'ASC']]
  });
};

SalesInvoiceItem.getItemsByProduct = async function(productId) {
  return await this.findAll({
    where: { product_id: productId },
    order: [['createdAt', 'DESC']]
  });
};

SalesInvoiceItem.getItemsByBatch = async function(batchId) {
  return await this.findAll({
    where: { batch_id: batchId },
    order: [['createdAt', 'DESC']]
  });
};

SalesInvoiceItem.getItemsByDateRange = async function(startDate, endDate) {
  const { Op } = require('sequelize');
  return await this.findAll({
    include: [{
      model: require('./SalesInvoice'),
      as: 'sales_invoice',
      where: {
        invoice_date: {
          [Op.between]: [startDate, endDate]
        }
      }
    }],
    order: [['createdAt', 'DESC']]
  });
};

SalesInvoiceItem.getTopSellingProducts = async function(limit = 10, startDate = null, endDate = null) {
  const { Op } = require('sequelize');
  const whereClause = {};
  
  if (startDate && endDate) {
    whereClause['$sales_invoice.invoice_date$'] = {
      [Op.between]: [startDate, endDate]
    };
  }
  
  return await this.findAll({
    attributes: [
      'product_id',
      'product_name',
      'product_sku',
      [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
      [sequelize.fn('SUM', sequelize.col('line_total')), 'total_value'],
      [sequelize.fn('COUNT', sequelize.col('SalesInvoiceItem.id')), 'transaction_count']
    ],
    include: [{
      model: require('./SalesInvoice'),
      as: 'sales_invoice',
      attributes: []
    }],
    where: whereClause,
    group: ['product_id', 'product_name', 'product_sku'],
    order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
    limit: limit
  });
};

SalesInvoiceItem.getSalesAnalytics = async function(startDate = null, endDate = null) {
  const { Op } = require('sequelize');
  const whereClause = {};
  
  if (startDate && endDate) {
    whereClause['$sales_invoice.invoice_date$'] = {
      [Op.between]: [startDate, endDate]
    };
  }
  
  const [totalItems, totalQuantity, totalValue, avgUnitPrice] = await Promise.all([
    this.count({
      include: [{
        model: require('./SalesInvoice'),
        as: 'sales_invoice',
        attributes: []
      }],
      where: whereClause
    }),
    this.sum('quantity', {
      include: [{
        model: require('./SalesInvoice'),
        as: 'sales_invoice',
        attributes: []
      }],
      where: whereClause
    }),
    this.sum('line_total', {
      include: [{
        model: require('./SalesInvoice'),
        as: 'sales_invoice',
        attributes: []
      }],
      where: whereClause
    }),
    this.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('unit_price')), 'avg_unit_price']],
      include: [{
        model: require('./SalesInvoice'),
        as: 'sales_invoice',
        attributes: []
      }],
      where: whereClause,
      raw: true
    })
  ]);
  
  return {
    total_items: totalItems || 0,
    total_quantity: totalQuantity || 0,
    total_value: totalValue || 0,
    average_unit_price: avgUnitPrice?.avg_unit_price || 0
  };
};

module.exports = SalesInvoiceItem;
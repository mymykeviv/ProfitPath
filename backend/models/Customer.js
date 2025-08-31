const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customer_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 20]
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  type: {
    type: DataTypes.ENUM('individual', 'business', 'government', 'ngo'),
    allowNull: false,
    defaultValue: 'individual'
  },
  contact_person: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true,
      len: [0, 255]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [0, 20]
    }
  },
  mobile: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [0, 20]
    }
  },
  address: {
    type: DataTypes.JSON,
    allowNull: true,
    validate: {
      isValidAddress(value) {
        if (value && typeof value === 'object') {
          const { street, city, state, postal_code, country } = value;
          if (street && typeof street !== 'string') {
            throw new Error('Address street must be a string');
          }
          if (city && typeof city !== 'string') {
            throw new Error('Address city must be a string');
          }
          if (state && typeof state !== 'string') {
            throw new Error('Address state must be a string');
          }
          if (postal_code && typeof postal_code !== 'string') {
            throw new Error('Address postal_code must be a string');
          }
          if (country && typeof country !== 'string') {
            throw new Error('Address country must be a string');
          }
        }
      }
    }
  },
  billing_address: {
    type: DataTypes.JSON,
    allowNull: true,
    validate: {
      isValidAddress(value) {
        if (value && typeof value === 'object') {
          const { street, city, state, postal_code, country } = value;
          if (street && typeof street !== 'string') {
            throw new Error('Billing address street must be a string');
          }
          if (city && typeof city !== 'string') {
            throw new Error('Billing address city must be a string');
          }
          if (state && typeof state !== 'string') {
            throw new Error('Billing address state must be a string');
          }
          if (postal_code && typeof postal_code !== 'string') {
            throw new Error('Billing address postal_code must be a string');
          }
          if (country && typeof country !== 'string') {
            throw new Error('Billing address country must be a string');
          }
        }
      }
    }
  },
  shipping_address: {
    type: DataTypes.JSON,
    allowNull: true,
    validate: {
      isValidAddress(value) {
        if (value && typeof value === 'object') {
          const { street, city, state, postal_code, country } = value;
          if (street && typeof street !== 'string') {
            throw new Error('Shipping address street must be a string');
          }
          if (city && typeof city !== 'string') {
            throw new Error('Shipping address city must be a string');
          }
          if (state && typeof state !== 'string') {
            throw new Error('Shipping address state must be a string');
          }
          if (postal_code && typeof postal_code !== 'string') {
            throw new Error('Shipping address postal_code must be a string');
          }
          if (country && typeof country !== 'string') {
            throw new Error('Shipping address country must be a string');
          }
        }
      }
    }
  },
  gst_number: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      len: [0, 15],
      isValidGST(value) {
        if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
          throw new Error('Invalid GST number format');
        }
      }
    }
  },
  pan_number: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      len: [0, 10],
      isValidPAN(value) {
        if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
          throw new Error('Invalid PAN number format');
        }
      }
    }
  },
  credit_limit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  credit_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 365
    }
  },
  payment_terms: {
    type: DataTypes.ENUM('cash', 'credit', 'advance', 'cod', 'net_30', 'net_60', 'net_90'),
    allowNull: false,
    defaultValue: 'cash'
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
  price_list: {
    type: DataTypes.ENUM('retail', 'wholesale', 'distributor', 'special'),
    allowNull: false,
    defaultValue: 'retail'
  },
  sales_person: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  territory: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  customer_group: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  tax_category: {
    type: DataTypes.ENUM('taxable', 'exempt', 'zero_rated', 'nil_rated'),
    allowNull: false,
    defaultValue: 'taxable'
  },
  registration_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  last_transaction_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  total_sales: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  outstanding_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'blocked', 'suspended'),
    allowNull: false,
    defaultValue: 'active'
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
  tableName: 'customers',
  indexes: [
    {
      unique: true,
      fields: ['customer_code']
    },
    {
      fields: ['name']
    },
    {
      fields: ['type']
    },
    {
      fields: ['email']
    },
    {
      fields: ['phone']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['registration_date']
    },
    {
      fields: ['last_transaction_date']
    },
    {
      fields: ['sales_person']
    },
    {
      fields: ['territory']
    },
    {
      fields: ['customer_group']
    }
  ],
  hooks: {
    beforeValidate: (customer) => {
      // Auto-generate customer code if not provided
      if (!customer.customer_code) {
        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        customer.customer_code = `CUST${timestamp}${randomNum}`;
      }
      
      // Ensure uppercase for codes
      if (customer.customer_code) {
        customer.customer_code = customer.customer_code.toUpperCase();
      }
      if (customer.gst_number) {
        customer.gst_number = customer.gst_number.toUpperCase();
      }
      if (customer.pan_number) {
        customer.pan_number = customer.pan_number.toUpperCase();
      }
    },
    beforeSave: (customer) => {
      // Validate credit limit vs outstanding amount
      if (customer.outstanding_amount > customer.credit_limit) {
        throw new Error('Outstanding amount cannot exceed credit limit');
      }
      
      // Set billing address same as address if not provided
      if (!customer.billing_address && customer.address) {
        customer.billing_address = customer.address;
      }
      
      // Set shipping address same as address if not provided
      if (!customer.shipping_address && customer.address) {
        customer.shipping_address = customer.address;
      }
    }
  }
});

// Instance methods
Customer.prototype.getFullAddress = function() {
  if (!this.address) return null;
  const { street, city, state, postal_code, country } = this.address;
  return [street, city, state, postal_code, country].filter(Boolean).join(', ');
};

Customer.prototype.getBillingAddress = function() {
  if (!this.billing_address) return null;
  const { street, city, state, postal_code, country } = this.billing_address;
  return [street, city, state, postal_code, country].filter(Boolean).join(', ');
};

Customer.prototype.getShippingAddress = function() {
  if (!this.shipping_address) return null;
  const { street, city, state, postal_code, country } = this.shipping_address;
  return [street, city, state, postal_code, country].filter(Boolean).join(', ');
};

Customer.prototype.getContactInfo = function() {
  return {
    name: this.name,
    contact_person: this.contact_person,
    email: this.email,
    phone: this.phone,
    mobile: this.mobile
  };
};

Customer.prototype.getCreditInfo = function() {
  return {
    credit_limit: this.credit_limit,
    credit_days: this.credit_days,
    outstanding_amount: this.outstanding_amount,
    available_credit: this.credit_limit - this.outstanding_amount,
    payment_terms: this.payment_terms
  };
};

Customer.prototype.isOverCreditLimit = function() {
  return this.outstanding_amount > this.credit_limit;
};

Customer.prototype.getCreditUtilization = function() {
  if (this.credit_limit === 0) return 0;
  return (this.outstanding_amount / this.credit_limit) * 100;
};

// Class methods
Customer.getActiveCustomers = async function() {
  return await this.findAll({
    where: {
      is_active: true,
      status: 'active'
    },
    order: [['name', 'ASC']]
  });
};

Customer.getCustomersByType = async function(type) {
  return await this.findAll({
    where: {
      type: type,
      is_active: true
    },
    order: [['name', 'ASC']]
  });
};

Customer.searchCustomers = async function(searchTerm) {
  const { Op } = require('sequelize');
  return await this.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { customer_code: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
        { phone: { [Op.like]: `%${searchTerm}%` } },
        { contact_person: { [Op.like]: `%${searchTerm}%` } }
      ],
      is_active: true
    },
    order: [['name', 'ASC']]
  });
};

Customer.getOverCreditLimitCustomers = async function() {
  const { Op } = require('sequelize');
  return await this.findAll({
    where: {
      outstanding_amount: {
        [Op.gt]: sequelize.col('credit_limit')
      },
      is_active: true
    },
    order: [['outstanding_amount', 'DESC']]
  });
};

Customer.getTopCustomersBySales = async function(limit = 10) {
  return await this.findAll({
    where: {
      is_active: true
    },
    order: [['total_sales', 'DESC']],
    limit: limit
  });
};

module.exports = Customer;
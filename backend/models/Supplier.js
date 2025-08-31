const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  supplier_code: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 20]
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  contact_person: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [10, 20]
    }
  },
  mobile: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [10, 20]
    }
  },
  address_line1: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  address_line2: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  postal_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      len: [5, 10]
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'India'
  },
  gst_number: {
    type: DataTypes.STRING(15),
    allowNull: true,
    unique: true,
    validate: {
      len: [15, 15],
      isGSTNumber(value) {
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
      len: [10, 10],
      isPANNumber(value) {
        if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
          throw new Error('Invalid PAN number format');
        }
      }
    }
  },
  bank_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bank_account_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  bank_ifsc_code: {
    type: DataTypes.STRING(11),
    allowNull: true,
    validate: {
      len: [11, 11],
      isIFSCCode(value) {
        if (value && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
          throw new Error('Invalid IFSC code format');
        }
      }
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
  credit_limit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  supplier_type: {
    type: DataTypes.ENUM('raw_material', 'finished_goods', 'services', 'both'),
    allowNull: false,
    defaultValue: 'raw_material'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'suppliers',
  timestamps: true,
  underscored: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['supplier_code']
    },
    {
      unique: true,
      fields: ['gst_number'],
      where: {
        gst_number: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      fields: ['name']
    },
    {
      fields: ['supplier_type']
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
Supplier.beforeValidate(async (supplier, options) => {
  // Auto-generate supplier code if not provided
  if (!supplier.supplier_code) {
    const count = await Supplier.count();
    supplier.supplier_code = `SUP${String(count + 1).padStart(4, '0')}`;
  }
  
  // Ensure supplier code is uppercase
  if (supplier.supplier_code) {
    supplier.supplier_code = supplier.supplier_code.toUpperCase();
  }
  
  // Ensure GST number is uppercase
  if (supplier.gst_number) {
    supplier.gst_number = supplier.gst_number.toUpperCase();
  }
  
  // Ensure PAN number is uppercase
  if (supplier.pan_number) {
    supplier.pan_number = supplier.pan_number.toUpperCase();
  }
  
  // Ensure IFSC code is uppercase
  if (supplier.bank_ifsc_code) {
    supplier.bank_ifsc_code = supplier.bank_ifsc_code.toUpperCase();
  }
});

Supplier.beforeSave(async (supplier, options) => {
  // Validate credit limit
  if (supplier.credit_limit < 0) {
    throw new Error('Credit limit cannot be negative');
  }
});

// Instance Methods
Supplier.prototype.getFullAddress = function() {
  const addressParts = [
    this.address_line1,
    this.address_line2,
    this.city,
    this.state,
    this.postal_code,
    this.country
  ].filter(part => part && part.trim());
  
  return addressParts.join(', ');
};

Supplier.prototype.getContactInfo = function() {
  return {
    contact_person: this.contact_person,
    email: this.email,
    phone: this.phone,
    mobile: this.mobile
  };
};

Supplier.prototype.getBankDetails = function() {
  return {
    bank_name: this.bank_name,
    account_number: this.bank_account_number,
    ifsc_code: this.bank_ifsc_code
  };
};

Supplier.prototype.getTaxInfo = function() {
  return {
    gst_number: this.gst_number,
    pan_number: this.pan_number
  };
};

// Class Methods
Supplier.getActiveSuppliers = function() {
  return this.findAll({
    where: {
      is_active: true
    },
    order: [['name', 'ASC']]
  });
};

Supplier.getSuppliersByType = function(type) {
  return this.findAll({
    where: {
      supplier_type: type,
      is_active: true
    },
    order: [['name', 'ASC']]
  });
};

Supplier.searchSuppliers = function(searchTerm) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        {
          name: {
            [Op.iLike]: `%${searchTerm}%`
          }
        },
        {
          supplier_code: {
            [Op.iLike]: `%${searchTerm}%`
          }
        },
        {
          contact_person: {
            [Op.iLike]: `%${searchTerm}%`
          }
        }
      ],
      is_active: true
    },
    order: [['name', 'ASC']]
  });
};

module.exports = Supplier;
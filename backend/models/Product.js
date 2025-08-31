const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 50]
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('finished_product', 'raw_material', 'semi_finished'),
    allowNull: false,
    defaultValue: 'finished_product'
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
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
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  selling_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
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
  hsn_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [0, 20]
    }
  },
  barcode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    validate: {
      len: [0, 50]
    }
  },
  minimum_stock_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  maximum_stock_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  reorder_point: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  current_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  batch_tracking_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  expiry_tracking_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  supplier_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'products',
  indexes: [
    {
      unique: true,
      fields: ['sku']
    },
    {
      fields: ['type']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['current_stock']
    },
    {
      fields: ['reorder_point']
    }
  ],
  hooks: {
    beforeValidate: (product) => {
      // Auto-generate SKU if not provided
      if (!product.sku) {
        const prefix = product.type === 'raw_material' ? 'RM' : 
                      product.type === 'semi_finished' ? 'SF' : 'FP';
        const timestamp = Date.now().toString().slice(-6);
        product.sku = `${prefix}-${timestamp}`;
      }
      
      // Ensure SKU is uppercase
      if (product.sku) {
        product.sku = product.sku.toUpperCase();
      }
    },
    beforeSave: (product) => {
      // Validate stock levels
      if (product.maximum_stock_level && product.minimum_stock_level > product.maximum_stock_level) {
        throw new Error('Minimum stock level cannot be greater than maximum stock level');
      }
      
      // Validate reorder point
      if (product.reorder_point > product.minimum_stock_level) {
        throw new Error('Reorder point cannot be greater than minimum stock level');
      }
    }
  }
});

// Instance methods
Product.prototype.isLowStock = function() {
  return this.current_stock <= this.reorder_point;
};

Product.prototype.isOutOfStock = function() {
  return this.current_stock === 0;
};

Product.prototype.getStockStatus = function() {
  if (this.isOutOfStock()) return 'out_of_stock';
  if (this.isLowStock()) return 'low_stock';
  if (this.maximum_stock_level && this.current_stock >= this.maximum_stock_level) return 'overstock';
  return 'normal';
};

Product.prototype.calculateMargin = function() {
  if (!this.cost_price || !this.selling_price) return null;
  return ((this.selling_price - this.cost_price) / this.selling_price * 100).toFixed(2);
};

// Class methods
Product.getLowStockProducts = async function() {
  return await this.findAll({
    where: {
      current_stock: {
        [sequelize.Sequelize.Op.lte]: sequelize.Sequelize.col('reorder_point')
      },
      is_active: true
    }
  });
};

Product.getOutOfStockProducts = async function() {
  return await this.findAll({
    where: {
      current_stock: 0,
      is_active: true
    }
  });
};

module.exports = Product;
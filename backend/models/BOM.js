const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BOM = sequelize.define('BOM', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bom_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  finished_product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1.0',
    validate: {
      notEmpty: true
    }
  },
  quantity_produced: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0.001
    }
  },
  unit_of_measure: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pcs',
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'inactive', 'archived'),
    allowNull: false,
    defaultValue: 'draft'
  },
  effective_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
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
  tableName: 'boms',
  indexes: [
    {
      fields: ['finished_product_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['effective_date']
    },
    {
      fields: ['bom_number']
    }
  ],
  hooks: {
    beforeCreate: async (bom) => {
      if (!bom.bom_number) {
        // Generate BOM number: BOM-YYYYMMDD-XXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await BOM.count({
          where: {
            bom_number: {
              [sequelize.Sequelize.Op.like]: `BOM-${dateStr}-%`
            }
          }
        });
        const sequence = (count + 1).toString().padStart(3, '0');
        bom.bom_number = `BOM-${dateStr}-${sequence}`;
      }
    },
    beforeSave: (bom) => {
      // Validate expiry date
      if (bom.expiry_date && new Date(bom.expiry_date) <= new Date(bom.effective_date)) {
        throw new Error('Expiry date must be after effective date');
      }
    }
  }
});

// Instance methods
BOM.prototype.isActive = function() {
  const now = new Date();
  const effectiveDate = new Date(this.effective_date);
  const expiryDate = this.expiry_date ? new Date(this.expiry_date) : null;
  
  return this.status === 'active' && 
         this.is_active && 
         effectiveDate <= now && 
         (!expiryDate || expiryDate > now);
};

BOM.prototype.isExpired = function() {
  if (!this.expiry_date) return false;
  return new Date(this.expiry_date) < new Date();
};

BOM.prototype.activate = async function() {
  this.status = 'active';
  this.approved_at = new Date();
  return await this.save();
};

BOM.prototype.deactivate = async function() {
  this.status = 'inactive';
  return await this.save();
};

BOM.prototype.archive = async function() {
  this.status = 'archived';
  this.is_active = false;
  return await this.save();
};

// Class methods
BOM.getActiveBOMForProduct = async function(productId) {
  return await this.findOne({
    where: {
      finished_product_id: productId,
      status: 'active',
      is_active: true,
      effective_date: {
        [sequelize.Sequelize.Op.lte]: new Date()
      },
      [sequelize.Sequelize.Op.or]: [
        { expiry_date: null },
        { expiry_date: { [sequelize.Sequelize.Op.gt]: new Date() } }
      ]
    },
    order: [['effective_date', 'DESC']]
  });
};

BOM.getBOMsByProduct = async function(productId) {
  return await this.findAll({
    where: {
      finished_product_id: productId,
      is_active: true
    },
    order: [['effective_date', 'DESC']]
  });
};

BOM.getActiveBOMs = async function() {
  return await this.findAll({
    where: {
      status: 'active',
      is_active: true,
      effective_date: {
        [sequelize.Sequelize.Op.lte]: new Date()
      },
      [sequelize.Sequelize.Op.or]: [
        { expiry_date: null },
        { expiry_date: { [sequelize.Sequelize.Op.gt]: new Date() } }
      ]
    },
    order: [['effective_date', 'DESC']]
  });
};

module.exports = BOM;
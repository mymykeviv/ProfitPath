const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BOMItem = sequelize.define('BOMItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bom_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'boms',
      key: 'id'
    }
  },
  raw_material_id: {
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
  quantity_required: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
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
  wastage_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  effective_quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    validate: {
      min: 0.001
    }
  },
  cost_per_unit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  total_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  is_optional: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  tableName: 'bom_items',
  indexes: [
    {
      unique: true,
      fields: ['bom_id', 'line_number']
    },
    {
      fields: ['bom_id']
    },
    {
      fields: ['raw_material_id']
    }
  ],
  hooks: {
    beforeValidate: (bomItem) => {
      // Calculate effective quantity including wastage
      if (bomItem.quantity_required && bomItem.wastage_percentage !== undefined) {
        const wastageMultiplier = 1 + (bomItem.wastage_percentage / 100);
        bomItem.effective_quantity = (bomItem.quantity_required * wastageMultiplier).toFixed(3);
      }
      
      // Calculate total cost
      if (bomItem.effective_quantity && bomItem.cost_per_unit) {
        bomItem.total_cost = (bomItem.effective_quantity * bomItem.cost_per_unit).toFixed(2);
      }
    },
    beforeSave: (bomItem) => {
      // Validate effective quantity
      if (bomItem.effective_quantity < bomItem.quantity_required) {
        throw new Error('Effective quantity cannot be less than required quantity');
      }
    }
  }
});

// Instance methods
BOMItem.prototype.calculateEffectiveQuantity = function() {
  const wastageMultiplier = 1 + (this.wastage_percentage / 100);
  return this.quantity_required * wastageMultiplier;
};

BOMItem.prototype.calculateTotalCost = function() {
  if (!this.cost_per_unit) return 0;
  return this.effective_quantity * this.cost_per_unit;
};

BOMItem.prototype.updateCostFromProduct = async function() {
  const Product = require('./Product');
  const product = await Product.findByPk(this.raw_material_id);
  if (product && product.cost_price) {
    this.cost_per_unit = product.cost_price;
    this.total_cost = this.calculateTotalCost();
    return await this.save();
  }
  return this;
};

// Class methods
BOMItem.getItemsByBOM = async function(bomId) {
  return await this.findAll({
    where: {
      bom_id: bomId,
      is_active: true
    },
    order: [['line_number', 'ASC']]
  });
};

BOMItem.getTotalCostForBOM = async function(bomId) {
  const items = await this.findAll({
    where: {
      bom_id: bomId,
      is_active: true
    },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('total_cost')), 'total_cost']
    ]
  });
  
  return items[0]?.dataValues?.total_cost || 0;
};

BOMItem.getRequiredMaterialsForProduction = async function(bomId, productionQuantity) {
  const items = await this.findAll({
    where: {
      bom_id: bomId,
      is_active: true
    },
    order: [['line_number', 'ASC']]
  });
  
  return items.map(item => ({
    raw_material_id: item.raw_material_id,
    line_number: item.line_number,
    quantity_required: item.quantity_required,
    effective_quantity: item.effective_quantity,
    total_required: item.effective_quantity * productionQuantity,
    unit_of_measure: item.unit_of_measure,
    is_optional: item.is_optional,
    notes: item.notes
  }));
};

BOMItem.validateMaterialAvailability = async function(bomId, productionQuantity) {
  const Product = require('./Product');
  const requiredMaterials = await this.getRequiredMaterialsForProduction(bomId, productionQuantity);
  
  const availability = [];
  
  for (const material of requiredMaterials) {
    const product = await Product.findByPk(material.raw_material_id);
    const available = product ? product.current_stock : 0;
    const shortage = Math.max(0, material.total_required - available);
    
    availability.push({
      ...material,
      available_stock: available,
      shortage: shortage,
      is_sufficient: shortage === 0
    });
  }
  
  return {
    materials: availability,
    all_sufficient: availability.every(m => m.is_sufficient),
    total_shortages: availability.filter(m => !m.is_sufficient).length
  };
};

module.exports = BOMItem;
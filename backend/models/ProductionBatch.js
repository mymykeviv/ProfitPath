const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductionBatch = sequelize.define('ProductionBatch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  batch_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  bom_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'boms',
      key: 'id'
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
  planned_quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    validate: {
      min: 0.001
    }
  },
  actual_quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  scrap_quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
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
    type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled', 'on_hold'),
    allowNull: false,
    defaultValue: 'planned'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  planned_start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  planned_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  actual_start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  actual_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  work_center: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  operator: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  supervisor: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  quality_status: {
    type: DataTypes.ENUM('pending', 'passed', 'failed', 'partial'),
    allowNull: false,
    defaultValue: 'pending'
  },
  cost_per_unit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  total_material_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_labor_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_overhead_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
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
  tableName: 'production_batches',
  indexes: [
    {
      fields: ['bom_id']
    },
    {
      fields: ['finished_product_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['planned_start_date']
    },
    {
      fields: ['planned_end_date']
    },
    {
      fields: ['quality_status']
    }
  ],
  hooks: {
    beforeCreate: async (productionBatch) => {
      if (!productionBatch.batch_number) {
        // Generate batch number: PB-YYYYMMDD-XXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await ProductionBatch.count({
          where: {
            batch_number: {
              [sequelize.Sequelize.Op.like]: `PB-${dateStr}-%`
            }
          }
        });
        const sequence = (count + 1).toString().padStart(3, '0');
        productionBatch.batch_number = `PB-${dateStr}-${sequence}`;
      }
    },
    beforeValidate: (productionBatch) => {
      // Calculate total cost
      productionBatch.total_cost = (
        parseFloat(productionBatch.total_material_cost || 0) +
        parseFloat(productionBatch.total_labor_cost || 0) +
        parseFloat(productionBatch.total_overhead_cost || 0)
      ).toFixed(2);
      
      // Calculate cost per unit if actual quantity is available
      if (productionBatch.actual_quantity && productionBatch.actual_quantity > 0) {
        productionBatch.cost_per_unit = (productionBatch.total_cost / productionBatch.actual_quantity).toFixed(2);
      }
    },
    beforeSave: (productionBatch) => {
      // Validate dates
      if (productionBatch.planned_end_date && new Date(productionBatch.planned_end_date) < new Date(productionBatch.planned_start_date)) {
        throw new Error('Planned end date must be after planned start date');
      }
      
      if (productionBatch.actual_start_date && productionBatch.actual_end_date) {
        if (new Date(productionBatch.actual_end_date) < new Date(productionBatch.actual_start_date)) {
          throw new Error('Actual end date must be after actual start date');
        }
      }
      
      // Validate quantities
      if (productionBatch.actual_quantity && productionBatch.scrap_quantity) {
        const totalProduced = parseFloat(productionBatch.actual_quantity) + parseFloat(productionBatch.scrap_quantity);
        if (totalProduced > parseFloat(productionBatch.planned_quantity) * 1.5) {
          throw new Error('Total produced quantity (actual + scrap) seems unusually high compared to planned quantity');
        }
      }
    }
  }
});

// Instance methods
ProductionBatch.prototype.start = async function() {
  this.status = 'in_progress';
  this.actual_start_date = new Date();
  return await this.save();
};

ProductionBatch.prototype.complete = async function(actualQuantity, scrapQuantity = 0) {
  this.status = 'completed';
  this.actual_quantity = actualQuantity;
  this.scrap_quantity = scrapQuantity;
  this.actual_end_date = new Date();
  return await this.save();
};

ProductionBatch.prototype.cancel = async function(reason) {
  this.status = 'cancelled';
  this.notes = this.notes ? `${this.notes}\n\nCancelled: ${reason}` : `Cancelled: ${reason}`;
  return await this.save();
};

ProductionBatch.prototype.hold = async function(reason) {
  this.status = 'on_hold';
  this.notes = this.notes ? `${this.notes}\n\nOn Hold: ${reason}` : `On Hold: ${reason}`;
  return await this.save();
};

ProductionBatch.prototype.resume = async function() {
  this.status = 'in_progress';
  return await this.save();
};

ProductionBatch.prototype.getEfficiency = function() {
  if (!this.actual_quantity || !this.planned_quantity) return null;
  return ((this.actual_quantity / this.planned_quantity) * 100).toFixed(2);
};

ProductionBatch.prototype.getYield = function() {
  if (!this.actual_quantity || !this.scrap_quantity) return null;
  const totalProduced = parseFloat(this.actual_quantity) + parseFloat(this.scrap_quantity);
  if (totalProduced === 0) return null;
  return ((this.actual_quantity / totalProduced) * 100).toFixed(2);
};

ProductionBatch.prototype.getDuration = function() {
  if (!this.actual_start_date || !this.actual_end_date) return null;
  const start = new Date(this.actual_start_date);
  const end = new Date(this.actual_end_date);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // days
};

// Class methods
ProductionBatch.getActiveProductions = async function() {
  return await this.findAll({
    where: {
      status: ['planned', 'in_progress'],
      is_active: true
    },
    order: [['planned_start_date', 'ASC']]
  });
};

ProductionBatch.getProductionsByProduct = async function(productId) {
  return await this.findAll({
    where: {
      finished_product_id: productId,
      is_active: true
    },
    order: [['planned_start_date', 'DESC']]
  });
};

ProductionBatch.getProductionStatistics = async function(startDate, endDate) {
  const whereClause = {
    status: 'completed',
    is_active: true
  };
  
  if (startDate && endDate) {
    whereClause.actual_end_date = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_batches'],
      [sequelize.fn('SUM', sequelize.col('planned_quantity')), 'total_planned'],
      [sequelize.fn('SUM', sequelize.col('actual_quantity')), 'total_actual'],
      [sequelize.fn('SUM', sequelize.col('scrap_quantity')), 'total_scrap'],
      [sequelize.fn('SUM', sequelize.col('total_cost')), 'total_cost'],
      [sequelize.fn('AVG', sequelize.col('total_cost')), 'avg_cost_per_batch']
    ]
  });
  
  const result = stats[0]?.dataValues || {};
  
  // Calculate efficiency and yield
  if (result.total_planned && result.total_actual) {
    result.overall_efficiency = ((result.total_actual / result.total_planned) * 100).toFixed(2);
  }
  
  if (result.total_actual && result.total_scrap) {
    const totalProduced = parseFloat(result.total_actual) + parseFloat(result.total_scrap);
    result.overall_yield = ((result.total_actual / totalProduced) * 100).toFixed(2);
  }
  
  return result;
};

module.exports = ProductionBatch;
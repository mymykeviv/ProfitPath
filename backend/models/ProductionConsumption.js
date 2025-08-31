const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductionConsumption = sequelize.define('ProductionConsumption', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  production_batch_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'production_batches',
      key: 'id'
    }
  },
  bom_item_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bom_items',
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
  batch_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'batches',
      key: 'id'
    }
  },
  planned_quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  actual_quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  wastage_quantity: {
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
  unit_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  total_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  consumption_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  consumption_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  operator: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  work_center: {
    type: DataTypes.STRING(100),
    allowNull: true
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
  tableName: 'production_consumptions',
  indexes: [
    {
      fields: ['production_batch_id']
    },
    {
      fields: ['bom_item_id']
    },
    {
      fields: ['raw_material_id']
    },
    {
      fields: ['batch_id']
    },
    {
      fields: ['consumption_date']
    }
  ],
  hooks: {
    beforeValidate: (consumption) => {
      // Calculate total cost
      if (consumption.actual_quantity && consumption.unit_cost) {
        consumption.total_cost = (consumption.actual_quantity * consumption.unit_cost).toFixed(2);
      }
      
      // Set consumption time if not provided
      if (!consumption.consumption_time) {
        const now = new Date();
        consumption.consumption_time = now.toTimeString().slice(0, 8);
      }
    },
    beforeSave: (consumption) => {
      // Validate quantities
      if (consumption.actual_quantity < 0) {
        throw new Error('Actual quantity cannot be negative');
      }
      
      if (consumption.wastage_quantity < 0) {
        throw new Error('Wastage quantity cannot be negative');
      }
      
      // Validate that actual + wastage doesn't exceed planned by too much
      const totalUsed = parseFloat(consumption.actual_quantity) + parseFloat(consumption.wastage_quantity);
      if (totalUsed > parseFloat(consumption.planned_quantity) * 1.5) {
        throw new Error('Total consumption (actual + wastage) seems unusually high compared to planned quantity');
      }
    },
    afterCreate: async (consumption) => {
      // Update inventory transaction
      const InventoryTransaction = require('./InventoryTransaction');
      await InventoryTransaction.create({
        product_id: consumption.raw_material_id,
        batch_id: consumption.batch_id,
        transaction_type: 'consumption',
        quantity: -consumption.actual_quantity, // negative for consumption
        unit_cost: consumption.unit_cost,
        total_value: -consumption.total_cost, // negative for consumption
        reference_type: 'production_consumption',
        reference_id: consumption.id,
        transaction_date: consumption.consumption_date,
        notes: `Production consumption for batch ${consumption.production_batch_id}`
      });
      
      // Update product stock
      const Product = require('./Product');
      const product = await Product.findByPk(consumption.raw_material_id);
      if (product) {
        await product.update({
          current_stock: Math.max(0, product.current_stock - consumption.actual_quantity)
        });
      }
      
      // Update batch remaining quantity if batch is specified
      if (consumption.batch_id) {
        const Batch = require('./Batch');
        const batch = await Batch.findByPk(consumption.batch_id);
        if (batch) {
          await batch.update({
            remaining_quantity: Math.max(0, batch.remaining_quantity - consumption.actual_quantity)
          });
        }
      }
    }
  }
});

// Instance methods
ProductionConsumption.prototype.getVariance = function() {
  const variance = this.actual_quantity - this.planned_quantity;
  const variancePercentage = this.planned_quantity > 0 ? 
    ((variance / this.planned_quantity) * 100).toFixed(2) : 0;
  
  return {
    quantity_variance: variance,
    variance_percentage: variancePercentage,
    is_over_consumption: variance > 0,
    is_under_consumption: variance < 0
  };
};

ProductionConsumption.prototype.getWastagePercentage = function() {
  const totalUsed = parseFloat(this.actual_quantity) + parseFloat(this.wastage_quantity);
  if (totalUsed === 0) return 0;
  return ((this.wastage_quantity / totalUsed) * 100).toFixed(2);
};

ProductionConsumption.prototype.getEfficiency = function() {
  if (this.planned_quantity === 0) return 100;
  return ((this.actual_quantity / this.planned_quantity) * 100).toFixed(2);
};

// Class methods
ProductionConsumption.getConsumptionByBatch = async function(productionBatchId) {
  return await this.findAll({
    where: {
      production_batch_id: productionBatchId,
      is_active: true
    },
    order: [['consumption_date', 'ASC'], ['consumption_time', 'ASC']]
  });
};

ProductionConsumption.getConsumptionByMaterial = async function(rawMaterialId, startDate, endDate) {
  const whereClause = {
    raw_material_id: rawMaterialId,
    is_active: true
  };
  
  if (startDate && endDate) {
    whereClause.consumption_date = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  return await this.findAll({
    where: whereClause,
    order: [['consumption_date', 'DESC']]
  });
};

ProductionConsumption.getConsumptionStatistics = async function(productionBatchId) {
  const stats = await this.findAll({
    where: {
      production_batch_id: productionBatchId,
      is_active: true
    },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_items'],
      [sequelize.fn('SUM', sequelize.col('planned_quantity')), 'total_planned'],
      [sequelize.fn('SUM', sequelize.col('actual_quantity')), 'total_actual'],
      [sequelize.fn('SUM', sequelize.col('wastage_quantity')), 'total_wastage'],
      [sequelize.fn('SUM', sequelize.col('total_cost')), 'total_cost'],
      [sequelize.fn('AVG', sequelize.col('unit_cost')), 'avg_unit_cost']
    ]
  });
  
  const result = stats[0]?.dataValues || {};
  
  // Calculate overall efficiency and wastage
  if (result.total_planned && result.total_actual) {
    result.overall_efficiency = ((result.total_actual / result.total_planned) * 100).toFixed(2);
  }
  
  if (result.total_actual && result.total_wastage) {
    const totalUsed = parseFloat(result.total_actual) + parseFloat(result.total_wastage);
    result.wastage_percentage = ((result.total_wastage / totalUsed) * 100).toFixed(2);
  }
  
  return result;
};

ProductionConsumption.getMaterialUsageReport = async function(startDate, endDate) {
  const whereClause = {
    is_active: true
  };
  
  if (startDate && endDate) {
    whereClause.consumption_date = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  return await this.findAll({
    where: whereClause,
    attributes: [
      'raw_material_id',
      [sequelize.fn('SUM', sequelize.col('actual_quantity')), 'total_consumed'],
      [sequelize.fn('SUM', sequelize.col('wastage_quantity')), 'total_wastage'],
      [sequelize.fn('SUM', sequelize.col('total_cost')), 'total_cost'],
      [sequelize.fn('AVG', sequelize.col('unit_cost')), 'avg_unit_cost'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'consumption_count']
    ],
    group: ['raw_material_id'],
    order: [[sequelize.fn('SUM', sequelize.col('total_cost')), 'DESC']]
  });
};

ProductionConsumption.validateConsumption = async function(productionBatchId, bomItemId, requestedQuantity) {
  const BOMItem = require('./BOMItem');
  const Product = require('./Product');
  
  const bomItem = await BOMItem.findByPk(bomItemId);
  if (!bomItem) {
    throw new Error('BOM item not found');
  }
  
  const product = await Product.findByPk(bomItem.raw_material_id);
  if (!product) {
    throw new Error('Raw material not found');
  }
  
  // Check if sufficient stock is available
  if (product.current_stock < requestedQuantity) {
    throw new Error(`Insufficient stock. Available: ${product.current_stock}, Required: ${requestedQuantity}`);
  }
  
  // Get existing consumption for this BOM item in this production batch
  const existingConsumption = await this.findAll({
    where: {
      production_batch_id: productionBatchId,
      bom_item_id: bomItemId,
      is_active: true
    },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('actual_quantity')), 'total_consumed']
    ]
  });
  
  const totalConsumed = existingConsumption[0]?.dataValues?.total_consumed || 0;
  const remainingAllowed = bomItem.effective_quantity - totalConsumed;
  
  if (requestedQuantity > remainingAllowed * 1.2) { // Allow 20% variance
    throw new Error(`Consumption exceeds BOM requirement. Remaining allowed: ${remainingAllowed}`);
  }
  
  return {
    is_valid: true,
    available_stock: product.current_stock,
    bom_requirement: bomItem.effective_quantity,
    already_consumed: totalConsumed,
    remaining_allowed: remainingAllowed
  };
};

module.exports = ProductionConsumption;
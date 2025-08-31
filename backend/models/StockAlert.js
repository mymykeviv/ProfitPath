const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockAlert = sequelize.define('StockAlert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  alert_type: {
    type: DataTypes.ENUM(
      'low_stock',
      'out_of_stock',
      'reorder_point',
      'overstock',
      'expiry_warning',
      'negative_stock'
    ),
    allowNull: false
  },
  alert_level: {
    type: DataTypes.ENUM('info', 'warning', 'critical'),
    allowNull: false,
    defaultValue: 'warning'
  },
  current_stock: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false
  },
  threshold_value: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: true
  },
  alert_message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  warehouse: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Main Warehouse'
  },
  batch_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'batches',
      key: 'id'
    }
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  days_to_expiry: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_acknowledged: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  acknowledged_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  acknowledged_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_resolved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 10
    }
  },
  auto_generated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  notification_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  notification_sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'stock_alerts',
  indexes: [
    {
      fields: ['product_id']
    },
    {
      fields: ['alert_type']
    },
    {
      fields: ['alert_level']
    },
    {
      fields: ['is_acknowledged']
    },
    {
      fields: ['is_resolved']
    },
    {
      fields: ['warehouse']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['expiry_date']
    },
    {
      fields: ['is_active']
    }
  ],
  hooks: {
    beforeSave: (alert) => {
      // Set priority based on alert type and level
      if (alert.alert_type === 'out_of_stock' || alert.alert_level === 'critical') {
        alert.priority = 10;
      } else if (alert.alert_type === 'negative_stock') {
        alert.priority = 9;
      } else if (alert.alert_type === 'low_stock' && alert.alert_level === 'warning') {
        alert.priority = 7;
      } else if (alert.alert_type === 'reorder_point') {
        alert.priority = 6;
      } else if (alert.alert_type === 'expiry_warning') {
        alert.priority = 5;
      } else {
        alert.priority = 3;
      }
      
      // Calculate days to expiry if expiry_date is provided
      if (alert.expiry_date && !alert.days_to_expiry) {
        const today = new Date();
        const expiryDate = new Date(alert.expiry_date);
        const diffTime = expiryDate - today;
        alert.days_to_expiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
  }
});

// Instance methods
StockAlert.prototype.acknowledge = async function(acknowledgedBy) {
  this.is_acknowledged = true;
  this.acknowledged_by = acknowledgedBy;
  this.acknowledged_at = new Date();
  return await this.save();
};

StockAlert.prototype.resolve = async function() {
  this.is_resolved = true;
  this.resolved_at = new Date();
  return await this.save();
};

StockAlert.prototype.markNotificationSent = async function() {
  this.notification_sent = true;
  this.notification_sent_at = new Date();
  return await this.save();
};

StockAlert.prototype.isExpired = function() {
  if (!this.expiry_date) return false;
  return new Date() > new Date(this.expiry_date);
};

StockAlert.prototype.isExpiringSoon = function(days = 30) {
  if (!this.expiry_date) return false;
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + days);
  return new Date(this.expiry_date) <= warningDate;
};

// Class methods
StockAlert.generateStockAlerts = async function() {
  const Product = require('./Product');
  const Batch = require('./Batch');
  
  const alerts = [];
  
  // Get all active products
  const products = await Product.findAll({
    where: {
      is_active: true
    }
  });
  
  for (const product of products) {
    // Check for stock level alerts
    if (product.current_stock <= 0) {
      // Out of stock
      const existingAlert = await this.findOne({
        where: {
          product_id: product.id,
          alert_type: 'out_of_stock',
          is_resolved: false,
          is_active: true
        }
      });
      
      if (!existingAlert) {
        alerts.push(await this.create({
          product_id: product.id,
          alert_type: 'out_of_stock',
          alert_level: 'critical',
          current_stock: product.current_stock,
          threshold_value: 0,
          alert_message: `Product "${product.name}" (${product.sku}) is out of stock`,
          priority: 10
        }));
      }
    } else if (product.current_stock < 0) {
      // Negative stock
      const existingAlert = await this.findOne({
        where: {
          product_id: product.id,
          alert_type: 'negative_stock',
          is_resolved: false,
          is_active: true
        }
      });
      
      if (!existingAlert) {
        alerts.push(await this.create({
          product_id: product.id,
          alert_type: 'negative_stock',
          alert_level: 'critical',
          current_stock: product.current_stock,
          threshold_value: 0,
          alert_message: `Product "${product.name}" (${product.sku}) has negative stock: ${product.current_stock}`,
          priority: 9
        }));
      }
    } else if (product.current_stock <= product.reorder_point) {
      // Reorder point reached
      const existingAlert = await this.findOne({
        where: {
          product_id: product.id,
          alert_type: 'reorder_point',
          is_resolved: false,
          is_active: true
        }
      });
      
      if (!existingAlert) {
        alerts.push(await this.create({
          product_id: product.id,
          alert_type: 'reorder_point',
          alert_level: 'warning',
          current_stock: product.current_stock,
          threshold_value: product.reorder_point,
          alert_message: `Product "${product.name}" (${product.sku}) has reached reorder point. Current: ${product.current_stock}, Reorder at: ${product.reorder_point}`,
          priority: 6
        }));
      }
    } else if (product.current_stock <= product.minimum_stock_level) {
      // Low stock
      const existingAlert = await this.findOne({
        where: {
          product_id: product.id,
          alert_type: 'low_stock',
          is_resolved: false,
          is_active: true
        }
      });
      
      if (!existingAlert) {
        alerts.push(await this.create({
          product_id: product.id,
          alert_type: 'low_stock',
          alert_level: 'warning',
          current_stock: product.current_stock,
          threshold_value: product.minimum_stock_level,
          alert_message: `Product "${product.name}" (${product.sku}) is running low. Current: ${product.current_stock}, Minimum: ${product.minimum_stock_level}`,
          priority: 7
        }));
      }
    }
    
    // Check for overstock
    if (product.maximum_stock_level && product.current_stock > product.maximum_stock_level) {
      const existingAlert = await this.findOne({
        where: {
          product_id: product.id,
          alert_type: 'overstock',
          is_resolved: false,
          is_active: true
        }
      });
      
      if (!existingAlert) {
        alerts.push(await this.create({
          product_id: product.id,
          alert_type: 'overstock',
          alert_level: 'info',
          current_stock: product.current_stock,
          threshold_value: product.maximum_stock_level,
          alert_message: `Product "${product.name}" (${product.sku}) is overstocked. Current: ${product.current_stock}, Maximum: ${product.maximum_stock_level}`,
          priority: 3
        }));
      }
    }
  }
  
  // Check for expiry alerts
  const expiringBatches = await Batch.getExpiringSoonBatches(30);
  
  for (const batch of expiringBatches) {
    const existingAlert = await this.findOne({
      where: {
        batch_id: batch.id,
        alert_type: 'expiry_warning',
        is_resolved: false,
        is_active: true
      }
    });
    
    if (!existingAlert) {
      const daysToExpiry = Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      const alertLevel = daysToExpiry <= 7 ? 'critical' : daysToExpiry <= 15 ? 'warning' : 'info';
      
      alerts.push(await this.create({
        product_id: batch.product_id,
        batch_id: batch.id,
        alert_type: 'expiry_warning',
        alert_level: alertLevel,
        current_stock: batch.remaining_quantity,
        expiry_date: batch.expiry_date,
        days_to_expiry: daysToExpiry,
        alert_message: `Batch "${batch.batch_number}" expires in ${daysToExpiry} days (${batch.expiry_date}). Remaining quantity: ${batch.remaining_quantity}`,
        priority: alertLevel === 'critical' ? 8 : 5
      }));
    }
  }
  
  return alerts;
};

StockAlert.getActiveAlerts = async function(alertType = null, alertLevel = null) {
  const { Op } = require('sequelize');
  const whereClause = {
    is_resolved: false,
    is_active: true
  };
  
  if (alertType) {
    whereClause.alert_type = alertType;
  }
  
  if (alertLevel) {
    whereClause.alert_level = alertLevel;
  }
  
  return await this.findAll({
    where: whereClause,
    include: [
      {
        model: require('./Product'),
        as: 'product',
        attributes: ['name', 'sku', 'type']
      },
      {
        model: require('./Batch'),
        as: 'batch',
        attributes: ['batch_number', 'expiry_date'],
        required: false
      }
    ],
    order: [['priority', 'DESC'], ['created_at', 'DESC']]
  });
};

StockAlert.getCriticalAlerts = async function() {
  return await this.getActiveAlerts(null, 'critical');
};

StockAlert.getUnacknowledgedAlerts = async function() {
  return await this.findAll({
    where: {
      is_acknowledged: false,
      is_resolved: false,
      is_active: true
    },
    include: [
      {
        model: require('./Product'),
        as: 'product',
        attributes: ['name', 'sku', 'type']
      }
    ],
    order: [['priority', 'DESC'], ['created_at', 'DESC']]
  });
};

StockAlert.getAlertsSummary = async function() {
  const { Op } = require('sequelize');
  
  const [total, critical, warning, info, unacknowledged, resolved] = await Promise.all([
    this.count({ where: { is_active: true } }),
    this.count({ where: { alert_level: 'critical', is_resolved: false, is_active: true } }),
    this.count({ where: { alert_level: 'warning', is_resolved: false, is_active: true } }),
    this.count({ where: { alert_level: 'info', is_resolved: false, is_active: true } }),
    this.count({ where: { is_acknowledged: false, is_resolved: false, is_active: true } }),
    this.count({ where: { is_resolved: true, is_active: true } })
  ]);
  
  return {
    total,
    active: total - resolved,
    critical,
    warning,
    info,
    unacknowledged,
    resolved
  };
};

StockAlert.resolveAlertsForProduct = async function(productId) {
  return await this.update(
    {
      is_resolved: true,
      resolved_at: new Date()
    },
    {
      where: {
        product_id: productId,
        is_resolved: false,
        is_active: true
      }
    }
  );
};

module.exports = StockAlert;
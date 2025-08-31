const { sequelize } = require('../config/database');
const Product = require('./Product');
const Category = require('./Category');
const Batch = require('./Batch');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const Customer = require('./Customer');
const SalesInvoice = require('./SalesInvoice');
const SalesInvoiceItem = require('./SalesInvoiceItem');
const InventoryTransaction = require('./InventoryTransaction');
const StockValuation = require('./StockValuation');
const StockAlert = require('./StockAlert');
const Payment = require('./Payment');
const PaymentReminder = require('./PaymentReminder');
const BOM = require('./BOM');
const BOMItem = require('./BOMItem');
const ProductionBatch = require('./ProductionBatch');
const ProductionConsumption = require('./ProductionConsumption');

// Define associations

// Product belongs to Category
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

// Category has many Products
Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products'
});

// Product has many Batches
Product.hasMany(Batch, {
  foreignKey: 'product_id',
  as: 'batches'
});

// Batch belongs to Product
Batch.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Batch belongs to Supplier
Batch.belongsTo(Supplier, {
  foreignKey: 'supplier_id',
  as: 'supplier'
});

// Supplier has many Batches
Supplier.hasMany(Batch, {
  foreignKey: 'supplier_id',
  as: 'batches'
});

// PurchaseOrder belongs to Supplier
PurchaseOrder.belongsTo(Supplier, {
  foreignKey: 'supplier_id',
  as: 'supplier'
});

// Supplier has many PurchaseOrders
Supplier.hasMany(PurchaseOrder, {
  foreignKey: 'supplier_id',
  as: 'purchase_orders'
});

// PurchaseOrder has many PurchaseOrderItems
PurchaseOrder.hasMany(PurchaseOrderItem, {
  foreignKey: 'purchase_order_id',
  as: 'items'
});

// PurchaseOrderItem belongs to PurchaseOrder
PurchaseOrderItem.belongsTo(PurchaseOrder, {
  foreignKey: 'purchase_order_id',
  as: 'purchase_order'
});

// PurchaseOrderItem belongs to Product
PurchaseOrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Product has many PurchaseOrderItems
Product.hasMany(PurchaseOrderItem, {
  foreignKey: 'product_id',
  as: 'purchase_order_items'
});

// SalesInvoice belongs to Customer
SalesInvoice.belongsTo(Customer, {
  foreignKey: 'customer_id',
  as: 'customer'
});

// Customer has many SalesInvoices
Customer.hasMany(SalesInvoice, {
  foreignKey: 'customer_id',
  as: 'sales_invoices'
});

// SalesInvoice has many SalesInvoiceItems
SalesInvoice.hasMany(SalesInvoiceItem, {
  foreignKey: 'sales_invoice_id',
  as: 'items'
});

// SalesInvoiceItem belongs to SalesInvoice
SalesInvoiceItem.belongsTo(SalesInvoice, {
  foreignKey: 'sales_invoice_id',
  as: 'sales_invoice'
});

// SalesInvoiceItem belongs to Product
SalesInvoiceItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Product has many SalesInvoiceItems
Product.hasMany(SalesInvoiceItem, {
  foreignKey: 'product_id',
  as: 'sales_invoice_items'
});

// SalesInvoiceItem belongs to Batch (optional)
SalesInvoiceItem.belongsTo(Batch, {
  foreignKey: 'batch_id',
  as: 'batch'
});

// Batch has many SalesInvoiceItems
Batch.hasMany(SalesInvoiceItem, {
  foreignKey: 'batch_id',
  as: 'sales_invoice_items'
});

// InventoryTransaction belongs to Product
InventoryTransaction.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Product has many InventoryTransactions
Product.hasMany(InventoryTransaction, {
  foreignKey: 'product_id',
  as: 'inventory_transactions'
});

// InventoryTransaction belongs to Batch (optional)
InventoryTransaction.belongsTo(Batch, {
  foreignKey: 'batch_id',
  as: 'batch'
});

// Batch has many InventoryTransactions
Batch.hasMany(InventoryTransaction, {
  foreignKey: 'batch_id',
  as: 'inventory_transactions'
});

// StockValuation belongs to Product
StockValuation.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Product has many StockValuations
Product.hasMany(StockValuation, {
  foreignKey: 'product_id',
  as: 'stock_valuations'
});

// StockAlert belongs to Product
StockAlert.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Product has many StockAlerts
Product.hasMany(StockAlert, {
  foreignKey: 'product_id',
  as: 'stock_alerts'
});

// StockAlert belongs to Batch (optional)
StockAlert.belongsTo(Batch, {
  foreignKey: 'batch_id',
  as: 'batch'
});

// Batch has many StockAlerts
Batch.hasMany(StockAlert, {
  foreignKey: 'batch_id',
  as: 'stock_alerts'
});

// Payment associations
Payment.belongsTo(Customer, {
  foreignKey: 'customer_id',
  as: 'customer'
});

Customer.hasMany(Payment, {
  foreignKey: 'customer_id',
  as: 'payments'
});

Payment.belongsTo(Supplier, {
  foreignKey: 'supplier_id',
  as: 'supplier'
});

Supplier.hasMany(Payment, {
  foreignKey: 'supplier_id',
  as: 'payments'
});

Payment.belongsTo(SalesInvoice, {
  foreignKey: 'reference_id',
  as: 'sales_invoice',
  constraints: false,
  scope: {
    reference_type: 'sales_invoice'
  }
});

SalesInvoice.hasMany(Payment, {
  foreignKey: 'reference_id',
  as: 'payments',
  constraints: false,
  scope: {
    reference_type: 'sales_invoice'
  }
});

Payment.belongsTo(PurchaseOrder, {
  foreignKey: 'reference_id',
  as: 'purchase_order',
  constraints: false,
  scope: {
    reference_type: 'purchase_order'
  }
});

PurchaseOrder.hasMany(Payment, {
  foreignKey: 'reference_id',
  as: 'payments',
  constraints: false,
  scope: {
    reference_type: 'purchase_order'
  }
});

// PaymentReminder associations
PaymentReminder.belongsTo(Customer, {
  foreignKey: 'customer_id',
  as: 'customer'
});

Customer.hasMany(PaymentReminder, {
  foreignKey: 'customer_id',
  as: 'payment_reminders'
});

PaymentReminder.belongsTo(Supplier, {
  foreignKey: 'supplier_id',
  as: 'supplier'
});

Supplier.hasMany(PaymentReminder, {
  foreignKey: 'supplier_id',
  as: 'payment_reminders'
});

PaymentReminder.belongsTo(SalesInvoice, {
  foreignKey: 'reference_id',
  as: 'sales_invoice',
  constraints: false,
  scope: {
    reference_type: 'sales_invoice'
  }
});

SalesInvoice.hasMany(PaymentReminder, {
  foreignKey: 'reference_id',
  as: 'payment_reminders',
  constraints: false,
  scope: {
    reference_type: 'sales_invoice'
  }
});

PaymentReminder.belongsTo(PurchaseOrder, {
  foreignKey: 'reference_id',
  as: 'purchase_order',
  constraints: false,
  scope: {
    reference_type: 'purchase_order'
  }
});

PurchaseOrder.hasMany(PaymentReminder, {
  foreignKey: 'reference_id',
  as: 'payment_reminders',
  constraints: false,
  scope: {
    reference_type: 'purchase_order'
  }
});

// BOM and BOMItem associations
BOM.belongsTo(Product, { foreignKey: 'finished_product_id', as: 'finishedProduct' });
BOM.hasMany(BOMItem, { foreignKey: 'bom_id', as: 'bomItems' });
BOM.hasMany(ProductionBatch, { foreignKey: 'bom_id', as: 'productionBatches' });

Product.hasMany(BOM, { foreignKey: 'finished_product_id', as: 'boms' });

BOMItem.belongsTo(BOM, { foreignKey: 'bom_id', as: 'bom' });
BOMItem.belongsTo(Product, { foreignKey: 'raw_material_id', as: 'rawMaterial' });
BOMItem.hasMany(ProductionConsumption, { foreignKey: 'bom_item_id', as: 'consumptions' });

Product.hasMany(BOMItem, { foreignKey: 'raw_material_id', as: 'bomItems' });

// ProductionBatch associations
ProductionBatch.belongsTo(BOM, { foreignKey: 'bom_id', as: 'bom' });
ProductionBatch.belongsTo(Product, { foreignKey: 'finished_product_id', as: 'finishedProduct' });
ProductionBatch.hasMany(ProductionConsumption, { foreignKey: 'production_batch_id', as: 'consumptions' });

Product.hasMany(ProductionBatch, { foreignKey: 'finished_product_id', as: 'productionBatches' });

// ProductionConsumption associations
ProductionConsumption.belongsTo(ProductionBatch, { foreignKey: 'production_batch_id', as: 'productionBatch' });
ProductionConsumption.belongsTo(BOMItem, { foreignKey: 'bom_item_id', as: 'bomItem' });
ProductionConsumption.belongsTo(Product, { foreignKey: 'raw_material_id', as: 'rawMaterial' });

Product.hasMany(ProductionConsumption, { foreignKey: 'raw_material_id', as: 'productionConsumptions' });

module.exports = {
  sequelize,
  Product,
  Category,
  Batch,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  Customer,
  SalesInvoice,
  SalesInvoiceItem,
  InventoryTransaction,
  StockValuation,
  StockAlert,
  Payment,
  PaymentReminder,
  BOM,
  BOMItem,
  ProductionBatch,
  ProductionConsumption
};
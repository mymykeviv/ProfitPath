# Models

This directory contains all the Sequelize models for the ProfitPath ERP system. Each model represents a database table and defines the structure, relationships, and business logic for specific entities.

## Implemented Models

### Core Product Management
- **Product.js** - Products and raw materials with SKU, pricing, and stock tracking
- **Category.js** - Product categorization system
- **Batch.js** - Batch tracking for inventory management

### Purchase Management
- **Supplier.js** - Supplier information and contact details
- **PurchaseOrder.js** - Purchase order management with GST compliance
- **PurchaseOrderItem.js** - Individual line items in purchase orders

### Sales Management
- **Customer.js** - Customer information and billing details
- **SalesInvoice.js** - GST-compliant sales invoices
- **SalesInvoiceItem.js** - Individual line items in sales invoices

### Inventory Management
- **InventoryTransaction.js** - Real-time inventory movement tracking
- **StockValuation.js** - FIFO/LIFO stock valuation calculations
- **StockAlert.js** - Automated reorder point alerts

### Production Management
- **BOM.js** - Bill of Materials with versioning and status management
- **BOMItem.js** - Raw material requirements for each BOM
- **ProductionBatch.js** - Production run tracking with cost analysis
- **ProductionConsumption.js** - Actual material consumption during production

### Financial Management
- **Payment.js** - Payment recording and tracking
- **PaymentReminder.js** - Automated payment reminders and aging

## Model Features

### Common Features
All models implement:
- **Timestamps** - Automatic createdAt and updatedAt fields
- **Validation** - Data validation rules and constraints
- **Hooks** - Pre/post save operations for business logic
- **Associations** - Proper relationships between entities
- **Soft Deletes** - Safe deletion with recovery capability (where applicable)

### Advanced Features
- **Status Management** - Lifecycle status tracking (draft, active, completed, etc.)
- **Audit Trail** - Change tracking for critical business data
- **Calculated Fields** - Automatic calculation of derived values
- **Business Logic** - Domain-specific methods and validations

## Database Relationships

### Core Relationships
```
Product
├── hasMany: PurchaseOrderItem
├── hasMany: SalesInvoiceItem
├── hasMany: InventoryTransaction
├── hasMany: StockValuation
├── hasMany: BOMItem (as rawMaterial)
├── hasMany: BOM (as finishedProduct)
└── belongsTo: Category

PurchaseOrder
├── hasMany: PurchaseOrderItem
├── belongsTo: Supplier
└── hasMany: Payment

SalesInvoice
├── hasMany: SalesInvoiceItem
├── belongsTo: Customer
└── hasMany: Payment

BOM
├── hasMany: BOMItem
├── belongsTo: Product (as finishedProduct)
└── hasMany: ProductionBatch

ProductionBatch
├── belongsTo: BOM
├── belongsTo: Product (as finishedProduct)
└── hasMany: ProductionConsumption
```

## Model Conventions

### Naming
- **Models**: PascalCase (e.g., `ProductionBatch`)
- **Tables**: snake_case (e.g., `production_batches`)
- **Fields**: snake_case (e.g., `created_at`)
- **Foreign Keys**: `{model}_id` (e.g., `product_id`)

### Status Fields
Many models include status enums:
- **draft** - Initial state
- **active** - In use/published
- **completed** - Finished/closed
- **cancelled** - Cancelled/voided
- **archived** - Historical/inactive

### Common Fields
- **id** - Primary key (auto-increment)
- **created_at** - Record creation timestamp
- **updated_at** - Last modification timestamp
- **deleted_at** - Soft delete timestamp (where applicable)
- **status** - Entity lifecycle status

## Usage

Models are automatically loaded and associated through the `index.js` file. They can be imported and used in controllers, services, and other parts of the application:

```javascript
const { Product, Category, BOM } = require('../models');

// Create a new product
const product = await Product.create({
  name: 'Sample Product',
  sku: 'SP001',
  category_id: 1
});

// Query with associations
const productWithCategory = await Product.findByPk(1, {
  include: [Category]
});
```

## Database Schema

The models automatically create and maintain the SQLite database schema. All relationships, constraints, and indexes are defined within the model files and applied during database synchronization.
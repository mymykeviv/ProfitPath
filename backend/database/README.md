# Database

This directory contains the SQLite database file and related database documentation for the ProfitPath ERP system.

## Database File

- **profitpath.db** - Main SQLite database file containing all application data

## Database Structure

The database is automatically created and maintained by Sequelize ORM based on the model definitions in the `/models` directory.

### Core Tables

#### Product Management
- **products** - Product and raw material catalog
- **categories** - Product categorization
- **batches** - Batch tracking for inventory

#### Purchase Management
- **suppliers** - Supplier information
- **purchase_orders** - Purchase order headers
- **purchase_order_items** - Purchase order line items

#### Sales Management
- **customers** - Customer information
- **sales_invoices** - Sales invoice headers
- **sales_invoice_items** - Sales invoice line items

#### Inventory Management
- **inventory_transactions** - Inventory movement tracking
- **stock_valuations** - Stock valuation records
- **stock_alerts** - Reorder point alerts

#### Production Management
- **boms** - Bill of Materials
- **bom_items** - BOM component requirements
- **production_batches** - Production batch tracking
- **production_consumptions** - Material consumption records

#### Financial Management
- **payments** - Payment records
- **payment_reminders** - Payment reminder tracking

## Database Configuration

Database configuration is managed in `/config/database.js`:

```javascript
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/profitpath.db'),
  logging: false, // Set to console.log for SQL debugging
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});
```

## Key Features

### Data Integrity
- **Foreign Key Constraints** - Maintain referential integrity
- **Validation Rules** - Data validation at model level
- **Unique Constraints** - Prevent duplicate records
- **Required Fields** - Ensure critical data is present

### Performance
- **Indexes** - Optimized queries on frequently accessed fields
- **Associations** - Efficient joins between related tables
- **Pagination** - Large dataset handling

### Audit Trail
- **Timestamps** - Automatic created_at and updated_at fields
- **Soft Deletes** - Safe deletion with recovery capability
- **Status Tracking** - Entity lifecycle management

## Database Schema Overview

### Relationships
```
Product (1) ←→ (N) Category
Product (1) ←→ (N) PurchaseOrderItem
Product (1) ←→ (N) SalesInvoiceItem
Product (1) ←→ (N) InventoryTransaction
Product (1) ←→ (N) BOMItem (as rawMaterial)
Product (1) ←→ (N) BOM (as finishedProduct)

Supplier (1) ←→ (N) PurchaseOrder
Customer (1) ←→ (N) SalesInvoice

BOM (1) ←→ (N) BOMItem
BOM (1) ←→ (N) ProductionBatch

ProductionBatch (1) ←→ (N) ProductionConsumption
```

### Common Field Patterns
- **id** - Primary key (INTEGER, AUTO_INCREMENT)
- **created_at** - Record creation timestamp
- **updated_at** - Last modification timestamp
- **deleted_at** - Soft delete timestamp (where applicable)
- **status** - Entity status (ENUM)

## Data Types

### Standard Types
- **STRING** - Text fields (names, descriptions)
- **TEXT** - Long text fields (notes, comments)
- **INTEGER** - Numeric IDs and quantities
- **DECIMAL** - Monetary amounts and precise calculations
- **DATE** - Date fields
- **DATETIME** - Timestamp fields
- **BOOLEAN** - True/false flags
- **ENUM** - Predefined value lists

### Business-Specific Types
- **SKU** - Product identification codes
- **GST Numbers** - Tax identification
- **Phone Numbers** - Contact information
- **Email Addresses** - Communication

## Backup and Recovery

### Manual Backup
```bash
# Copy database file
cp backend/database/profitpath.db backup/profitpath_backup_$(date +%Y%m%d).db
```

### Automated Backup (Planned)
- Daily automated backups
- Retention policy for old backups
- Cloud storage integration

## Development

### Database Reset
To reset the database during development:

```bash
# Stop the server
npm run backend:stop

# Delete database file
rm backend/database/profitpath.db

# Restart server (will recreate database)
npm run backend:dev
```

### Schema Changes
Schema changes are handled automatically by Sequelize:
1. Update model definitions
2. Restart the application
3. Sequelize will sync the schema

### Data Seeding (Planned)
- Sample data for development
- Test data for automated testing
- Production data migration scripts

## Monitoring

### Database Size
Monitor database growth:
```bash
ls -lh backend/database/profitpath.db
```

### Performance
- Query performance monitoring
- Slow query identification
- Index optimization

## Security

### Access Control
- File system permissions
- Application-level access control
- Data encryption (planned)

### Data Protection
- Regular backups
- Corruption detection
- Recovery procedures

## Troubleshooting

### Common Issues
1. **Database locked** - Ensure no other processes are accessing the file
2. **Schema mismatch** - Delete and recreate database
3. **Corruption** - Restore from backup

### Debug Mode
Enable SQL logging in database configuration:
```javascript
logging: console.log
```

## Future Enhancements

### Planned Features
- Database migrations
- Automated backup system
- Performance monitoring
- Data archiving
- Multi-tenant support

### Scalability
- PostgreSQL migration path
- Read replicas
- Connection pooling
- Query optimization
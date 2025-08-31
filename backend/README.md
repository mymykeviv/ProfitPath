# ProfitPath ERP - Backend

This is the backend API server for the ProfitPath ERP system, built with Node.js, Express.js, and SQLite.

## Overview

The backend provides a comprehensive REST API for managing all aspects of the ERP system, including product management, purchase orders, sales invoices, inventory tracking, production management, and financial operations.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with Sequelize ORM
- **Authentication**: JWT (planned)
- **Validation**: Express Validator
- **Documentation**: Auto-generated API docs (planned)

## Project Structure

```
backend/
├── config/
│   ├── database.js          # Database configuration
│   └── server.js            # Server configuration
├── controllers/             # Business logic controllers
│   ├── productController.js
│   ├── supplierController.js
│   ├── customerController.js
│   ├── purchaseOrderController.js
│   ├── salesInvoiceController.js
│   ├── inventoryController.js
│   ├── bomController.js
│   ├── productionBatchController.js
│   ├── paymentController.js
│   └── ...
├── models/                  # Sequelize data models
│   ├── Product.js
│   ├── Supplier.js
│   ├── Customer.js
│   ├── PurchaseOrder.js
│   ├── SalesInvoice.js
│   ├── InventoryTransaction.js
│   ├── BOM.js
│   ├── ProductionBatch.js
│   ├── Payment.js
│   └── ...
├── routes/                  # API route definitions
│   ├── index.js            # Main router
│   ├── products.js
│   ├── suppliers.js
│   ├── customers.js
│   ├── purchaseOrders.js
│   ├── salesInvoices.js
│   ├── inventory.js
│   ├── boms.js
│   ├── productionBatches.js
│   ├── payments.js
│   └── ...
├── middleware/              # Custom middleware (planned)
├── services/                # Business logic services (planned)
├── utils/                   # Utility functions (planned)
├── database/               # Database files and documentation
│   ├── profitpath.db       # SQLite database file
│   └── README.md           # Database documentation
└── server.js               # Application entry point
```

## Features Implemented

### ✅ Core Product Management (ITEM-001)
- Product and raw material catalog
- SKU management and batch tracking
- Category organization
- Stock level monitoring

### ✅ Purchase Management (PURCHASE-001)
- Purchase order creation and management
- Supplier information management
- GST compliance and tax calculations
- Order status tracking

### ✅ Sales Management (SALES-001)
- GST-compliant sales invoice generation
- Customer management
- Pricing and payment terms
- Invoice status tracking

### ✅ Inventory Tracking (INVENTORY-001)
- Real-time stock tracking
- FIFO/LIFO valuation methods
- Reorder point alerts
- Stock movement history

### ✅ Production & Consumption (PRODUCTION-001)
- Bill of Materials (BOM) management
- Production batch tracking
- Material consumption recording
- Production efficiency metrics

### ✅ Payment Tracking (PAYMENT-001)
- Payment recording and tracking
- Aging reports
- Payment reminders
- Outstanding balance management

## API Endpoints

### Product Management
```
GET    /api/products              # List all products
POST   /api/products              # Create new product
GET    /api/products/:id          # Get product details
PUT    /api/products/:id          # Update product
DELETE /api/products/:id          # Delete product
GET    /api/products/search       # Search products
GET    /api/products/low-stock    # Get low stock alerts
```

### Purchase Management
```
GET    /api/purchase-orders       # List purchase orders
POST   /api/purchase-orders       # Create purchase order
GET    /api/purchase-orders/:id   # Get order details
PUT    /api/purchase-orders/:id   # Update order
DELETE /api/purchase-orders/:id   # Delete order
POST   /api/purchase-orders/:id/receive # Receive order
```

### Sales Management
```
GET    /api/sales-invoices        # List sales invoices
POST   /api/sales-invoices        # Create invoice
GET    /api/sales-invoices/:id    # Get invoice details
PUT    /api/sales-invoices/:id    # Update invoice
DELETE /api/sales-invoices/:id    # Delete invoice
POST   /api/sales-invoices/:id/send # Send invoice
```

### Inventory Management
```
GET    /api/inventory             # List inventory items
GET    /api/inventory/:id         # Get item details
POST   /api/inventory/adjust      # Adjust stock levels
GET    /api/inventory/transactions # Get transaction history
GET    /api/inventory/valuation   # Get stock valuation
```

### Production Management
```
GET    /api/boms                  # List BOMs
POST   /api/boms                  # Create BOM
GET    /api/production-batches    # List production batches
POST   /api/production-batches    # Create batch
GET    /api/production-consumptions # List consumptions
POST   /api/production-consumptions # Record consumption
```

### Financial Management
```
GET    /api/payments              # List payments
POST   /api/payments              # Record payment
GET    /api/payments/aging        # Get aging report
GET    /api/payments/reminders    # Get payment reminders
```

## API Features

### Query Parameters
- **Pagination**: `page`, `limit`
- **Sorting**: `sort`, `order`
- **Filtering**: Field-specific filters
- **Search**: `search` parameter
- **Date Ranges**: `start_date`, `end_date`

### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Handling
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {...}
  }
}
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run backend:dev

# Start production server
npm run backend:start
```

### Environment Variables
Create a `.env` file in the backend directory:
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
DB_PATH=./database/profitpath.db
```

## Development

### Code Structure
- **Controllers**: Handle HTTP requests and responses
- **Models**: Define data structure and relationships
- **Routes**: Define API endpoints and middleware
- **Services**: Business logic and external integrations (planned)
- **Utils**: Helper functions and utilities (planned)

### Database
- SQLite database with Sequelize ORM
- Automatic schema synchronization
- Model associations and validations
- Soft deletes and timestamps

### Testing
```bash
# Run tests (planned)
npm test

# Run test coverage (planned)
npm run test:coverage
```

### API Testing
Test endpoints using curl or Postman:
```bash
# Test products endpoint
curl http://localhost:3001/api/products

# Test with pagination
curl "http://localhost:3001/api/products?page=1&limit=5"
```

## Deployment

### Production Build
```bash
# Install production dependencies
npm ci --only=production

# Start production server
npm run backend:start
```

### Docker (Planned)
```bash
# Build Docker image
docker build -t profitpath-backend .

# Run container
docker run -p 3001:3001 profitpath-backend
```

## Security

### Implemented
- Input validation and sanitization
- SQL injection prevention (Sequelize ORM)
- CORS configuration
- Error message sanitization

### Planned
- JWT authentication
- Role-based access control
- Rate limiting
- API key management
- Data encryption

## Performance

### Optimizations
- Database indexing
- Query optimization
- Pagination for large datasets
- Efficient associations

### Monitoring (Planned)
- Request logging
- Performance metrics
- Error tracking
- Database monitoring

## Contributing

### Code Style
- ESLint configuration
- Prettier formatting
- Consistent naming conventions
- Comprehensive comments

### Git Workflow
- Feature branches
- Pull request reviews
- Automated testing
- Semantic versioning

## Troubleshooting

### Common Issues
1. **Port already in use**: Change PORT in .env file
2. **Database locked**: Ensure no other processes are using the database
3. **Module not found**: Run `npm install`
4. **Permission denied**: Check file permissions

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run backend:dev

# Enable SQL logging
# Set logging: console.log in database config
```

## Future Enhancements

### Planned Features
- Authentication and authorization
- Real-time notifications
- File upload handling
- Email integration
- Report generation
- Data export/import
- Multi-tenant support

### Performance Improvements
- Redis caching
- Database connection pooling
- Query optimization
- Background job processing

### Integration
- External API integrations
- Webhook support
- Third-party service connections
- Mobile app API support

## License

This project is proprietary software for ProfitPath ERP system.

## Support

For technical support and questions, please refer to the project documentation or contact the development team.
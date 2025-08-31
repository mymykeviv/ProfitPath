# Routes

This directory contains all the API route definitions for the ProfitPath ERP system. Each route file defines RESTful endpoints for specific business entities and connects them to their corresponding controllers.

## Implemented Routes

### Core Product Management
- **products.js** - `/api/products` - Product and raw material catalog endpoints
- **categories.js** - `/api/categories` - Product categorization endpoints
- **batches.js** - `/api/batches` - Batch tracking endpoints

### Purchase Management
- **suppliers.js** - `/api/suppliers` - Supplier management endpoints
- **purchaseOrders.js** - `/api/purchase-orders` - Purchase order lifecycle endpoints
- **purchaseOrderItems.js** - `/api/purchase-order-items` - Purchase order line item endpoints

### Sales Management
- **customers.js** - `/api/customers` - Customer management endpoints
- **salesInvoices.js** - `/api/sales-invoices` - Sales invoice generation endpoints
- **salesInvoiceItems.js** - `/api/sales-invoice-items` - Sales invoice line item endpoints

### Inventory Management
- **inventoryTransactions.js** - `/api/inventory-transactions` - Inventory movement tracking endpoints
- **stockValuations.js** - `/api/stock-valuations` - Stock valuation calculation endpoints
- **stockAlerts.js** - `/api/stock-alerts` - Reorder point alert endpoints

### Production Management
- **boms.js** - `/api/boms` - Bill of Materials management endpoints
- **bomItems.js** - `/api/bom-items` - BOM component management endpoints
- **productionBatches.js** - `/api/production-batches` - Production batch tracking endpoints
- **productionConsumptions.js** - `/api/production-consumptions` - Material consumption tracking endpoints

### Financial Management
- **payments.js** - `/api/payments` - Payment recording endpoints
- **paymentReminders.js** - `/api/payment-reminders` - Payment reminder endpoints

## Route Structure

All route files follow a consistent RESTful pattern:

### Standard CRUD Operations
```
GET    /api/{resource}           # List all resources (with pagination/filtering)
GET    /api/{resource}/:id       # Get specific resource by ID
POST   /api/{resource}           # Create new resource
PUT    /api/{resource}/:id       # Update existing resource
DELETE /api/{resource}/:id       # Delete resource
```

### Extended Operations
Many routes include additional endpoints for business-specific operations:

```
# Status Management
PUT    /api/{resource}/:id/activate
PUT    /api/{resource}/:id/deactivate
PUT    /api/{resource}/:id/complete
PUT    /api/{resource}/:id/cancel

# Reporting & Analytics
GET    /api/{resource}/statistics
GET    /api/{resource}/reports
GET    /api/{resource}/summary

# Relationship Queries
GET    /api/{resource}/:id/{related}
GET    /api/{resource}/by-{field}/:value
```

## API Features

### Query Parameters
All GET endpoints support:
- **Pagination**: `page`, `limit`
- **Sorting**: `sort_by`, `sort_order`
- **Filtering**: Field-specific filters
- **Search**: `search` parameter for text search
- **Includes**: `include` parameter for related data

### Response Format
All endpoints return consistent JSON responses:

```json
{
  "success": true,
  "data": {},
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_items": 100,
    "total_pages": 10
  }
}
```

### Error Responses
Standardized error format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Specific Route Examples

### Production Management Routes

#### BOM Management
```
GET    /api/boms                    # List all BOMs
POST   /api/boms                    # Create new BOM
GET    /api/boms/:id                # Get BOM details
PUT    /api/boms/:id                # Update BOM
DELETE /api/boms/:id                # Delete BOM
PUT    /api/boms/:id/activate       # Activate BOM
PUT    /api/boms/:id/deactivate     # Deactivate BOM
GET    /api/boms/active             # Get active BOMs
GET    /api/boms/by-product/:id     # Get BOMs for product
```

#### Production Batch Management
```
GET    /api/production-batches                 # List all batches
POST   /api/production-batches                 # Create new batch
GET    /api/production-batches/:id             # Get batch details
PUT    /api/production-batches/:id             # Update batch
DELETE /api/production-batches/:id             # Delete batch
PUT    /api/production-batches/:id/start       # Start production
PUT    /api/production-batches/:id/complete    # Complete production
PUT    /api/production-batches/:id/cancel      # Cancel production
GET    /api/production-batches/statistics      # Production statistics
GET    /api/production-batches/by-product/:id  # Batches by product
```

### Financial Routes

#### Payment Management
```
GET    /api/payments                    # List all payments
POST   /api/payments                    # Record new payment
GET    /api/payments/:id                # Get payment details
PUT    /api/payments/:id                # Update payment
DELETE /api/payments/:id                # Delete payment
GET    /api/payments/by-invoice/:id     # Payments for invoice
GET    /api/payments/aging-report       # Payment aging report
```

## Middleware Integration

Routes integrate with middleware for:
- **Validation** - Request data validation
- **Authentication** - User authentication (when implemented)
- **Authorization** - Permission checking (when implemented)
- **Logging** - Request/response logging
- **Error Handling** - Centralized error processing

## Usage

Routes are automatically loaded through the main `index.js` file and mounted on the Express application. The base path for all API routes is `/api`.

```javascript
// Example usage in frontend
fetch('/api/products?page=1&limit=10')
  .then(response => response.json())
  .then(data => console.log(data));

// Create new product
fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'New Product', sku: 'NP001' })
});
```

## Testing

All routes can be tested using:
- **curl** commands
- **Postman** collections
- **Automated tests** (when implemented)

Example curl command:
```bash
curl -X GET "http://localhost:3001/api/products?page=1&limit=5" \
     -H "Content-Type: application/json"
```
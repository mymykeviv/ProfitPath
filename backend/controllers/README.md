# Controllers

This directory contains all the API controllers for the ProfitPath ERP system. Each controller handles HTTP requests and responses for specific business entities.

## Implemented Controllers

### Core Product Management
- **productController.js** - Product and raw material catalog management
- **categoryController.js** - Product categorization system
- **batchController.js** - Batch tracking for products

### Purchase Management
- **supplierController.js** - Supplier information management
- **purchaseOrderController.js** - Purchase order lifecycle management
- **purchaseOrderItemController.js** - Individual purchase order line items

### Sales Management
- **customerController.js** - Customer information management
- **salesInvoiceController.js** - GST-compliant sales invoice generation
- **salesInvoiceItemController.js** - Individual sales invoice line items

### Inventory Management
- **inventoryTransactionController.js** - Real-time inventory tracking
- **stockValuationController.js** - FIFO/LIFO stock valuation
- **stockAlertController.js** - Reorder point alerts and notifications

### Production Management
- **bomController.js** - Bill of Materials (BOM) management
- **bomItemController.js** - BOM component and material requirements
- **productionBatchController.js** - Production batch lifecycle and tracking
- **productionConsumptionController.js** - Material consumption during production

### Financial Management
- **paymentController.js** - Payment recording and tracking
- **paymentReminderController.js** - Automated payment reminders and aging reports

## Controller Features

All controllers implement:
- **CRUD Operations** - Create, Read, Update, Delete functionality
- **Validation** - Input validation and error handling
- **Pagination** - Efficient data retrieval with pagination
- **Filtering** - Advanced filtering and search capabilities
- **Associations** - Proper handling of related data
- **Error Handling** - Comprehensive error responses
- **Status Management** - Entity lifecycle management where applicable

## API Response Format

All controllers follow a consistent response format:

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

## Error Handling

Controllers implement standardized error responses:
- **400** - Bad Request (validation errors)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error (system errors)

## Usage

Controllers are automatically loaded and used by the corresponding route files in the `/routes` directory. Each controller exports functions that handle specific HTTP endpoints.
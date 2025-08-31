# Utils

This directory contains utility functions and helper modules that provide common functionality across the ProfitPath ERP system. Utilities are reusable, stateless functions that perform specific tasks and can be used throughout the application.

## Purpose

Utilities are designed to:
- **Provide Common Functionality** - Shared helper functions across the application
- **Promote Code Reusability** - Avoid code duplication
- **Simplify Complex Operations** - Abstract complex logic into simple functions
- **Maintain Consistency** - Standardize common operations
- **Improve Maintainability** - Centralize utility logic for easy updates

## Planned Utilities

While no utilities are currently implemented, the following utilities are planned for future development:

### Data Processing
- **dateUtils.js** - Date formatting, parsing, and calculation functions
- **numberUtils.js** - Number formatting, rounding, and calculation helpers
- **stringUtils.js** - String manipulation and validation functions
- **validationUtils.js** - Common validation rules and functions

### Business Logic Helpers
- **gstUtils.js** - GST calculation and formatting functions
- **pricingUtils.js** - Price calculation and discount utilities
- **inventoryUtils.js** - Stock calculation and valuation helpers
- **reportUtils.js** - Report generation and formatting utilities

### System Utilities
- **responseUtils.js** - Standardized API response formatting
- **errorUtils.js** - Error handling and formatting utilities
- **loggerUtils.js** - Logging configuration and helpers
- **configUtils.js** - Configuration management utilities

### File and Data Utilities
- **fileUtils.js** - File upload, processing, and validation
- **exportUtils.js** - Data export to various formats (CSV, PDF, Excel)
- **importUtils.js** - Data import and parsing utilities
- **encryptionUtils.js** - Data encryption and security functions

## Utility Structure

Utilities should follow this general structure:

```javascript
/**
 * Utility functions for [specific purpose]
 */

/**
 * Description of what this function does
 * @param {type} param1 - Description of parameter
 * @param {type} param2 - Description of parameter
 * @returns {type} Description of return value
 */
function utilityFunction(param1, param2) {
  // Implementation
  return result;
}

/**
 * Another utility function
 */
function anotherUtilityFunction() {
  // Implementation
}

module.exports = {
  utilityFunction,
  anotherUtilityFunction
};
```

## Usage Examples

### Date Utilities (Planned)
```javascript
const { formatDate, addDays, isValidDate } = require('../utils/dateUtils');

// Format date for display
const formattedDate = formatDate(new Date(), 'DD/MM/YYYY');

// Add days to a date
const futureDate = addDays(new Date(), 30);

// Validate date
if (isValidDate(inputDate)) {
  // Process valid date
}
```

### GST Utilities (Planned)
```javascript
const { calculateGST, formatGSTNumber, validateGSTIN } = require('../utils/gstUtils');

// Calculate GST amount
const gstAmount = calculateGST(baseAmount, gstRate);

// Format GST number
const formattedGST = formatGSTNumber(gstNumber);

// Validate GSTIN
if (validateGSTIN(gstin)) {
  // Process valid GSTIN
}
```

### Response Utilities (Planned)
```javascript
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseUtils');

// Success response
res.json(successResponse(data));

// Error response
res.status(400).json(errorResponse('Validation failed', 'VALIDATION_ERROR'));

// Paginated response
res.json(paginatedResponse(data, pagination));
```

## Best Practices

### Function Design
- **Pure Functions** - Functions should be stateless and predictable
- **Single Responsibility** - Each function should have one clear purpose
- **Clear Naming** - Function names should clearly describe their purpose
- **Documentation** - All functions should have JSDoc comments
- **Error Handling** - Handle edge cases and invalid inputs gracefully

### Code Quality
- **Input Validation** - Validate all input parameters
- **Type Safety** - Use proper type checking where needed
- **Performance** - Optimize for performance when dealing with large datasets
- **Testing** - All utilities should be thoroughly tested
- **Consistency** - Follow consistent coding patterns across utilities

### Organization
- **Logical Grouping** - Group related functions in the same file
- **Clear Exports** - Export functions with descriptive names
- **Dependencies** - Minimize external dependencies
- **Modularity** - Keep utilities independent and reusable

## Common Utility Patterns

### Validation Utilities
```javascript
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
}
```

### Formatting Utilities
```javascript
function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

function formatPercentage(value, decimals = 2) {
  return `${(value * 100).toFixed(decimals)}%`;
}
```

### Calculation Utilities
```javascript
function roundToDecimal(number, decimals = 2) {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function calculatePercentage(part, total) {
  return total === 0 ? 0 : (part / total) * 100;
}
```

## Current Implementation

Currently, utility functions are implemented inline within controllers and models. As the application grows, common functionality should be extracted into dedicated utility modules to improve code reusability and maintainability.

## Future Development

Utilities will be implemented as needed when:
- Common functionality is identified across multiple modules
- Complex calculations need to be standardized
- Data formatting requirements become consistent
- Validation rules need to be centralized

This directory serves as a foundation for organizing utility functions as the application evolves and common patterns emerge.
# Shared Module

## Overview
The Shared Module contains common utilities, services, and components used across all microservices in the CoffyPlatform ecosystem. This module helps maintain consistency and reduces code duplication.

## Project Structure
```
shared/
├── config/              # Shared configuration files
│   ├── errorMessages.js # Error message constants
│   ├── successMessages.js # Success message constants
│   └── redis.js         # Redis configuration
├── middlewares/         # Common Express middlewares
│   ├── adminMiddleware.js # Admin authentication
│   ├── requestContext.js  # Request context management
│   └── errorHandler/      # Error handling middleware
├── models/              # Shared data models
│   ├── admin.model.js   # Admin user model
│   └── log.model.js     # Logging model
├── services/            # Shared services
│   ├── token.service.js # JWT token management
│   ├── redis.service.js # Redis operations
│   └── log.service.js   # Logging service
└── utils/               # Utility functions
    ├── validationUtils.js # Input validation
    ├── tokenUtils.js      # Token utilities
    └── textUtils.js       # Text manipulation
```

## Features

### Authentication & Authorization
- JWT token generation and validation
- Admin authentication middleware
- Role-based access control

### Logging & Monitoring
- Centralized logging service
- Request/response logging
- Error tracking
- Performance monitoring

### Caching
- Redis integration
- Cache management utilities
- Session handling

### Validation
- Input validation utilities
- Schema validation
- Custom validation rules

### Error Handling
- Standardized error responses
- Error logging
- Custom error classes

## Installation

### Using npm
```bash
# Install the shared module
npm install @coffy/shared
```

### Local Development
```bash
# Link the shared module locally
npm link

# Use in other services
npm link @coffy/shared
```

## Usage Examples

### Authentication
```javascript
const { tokenService } = require('@coffy/shared');

// Generate token
const token = await tokenService.generateToken(userId);

// Verify token
const decoded = await tokenService.verifyToken(token);
```

### Logging
```javascript
const { logService } = require('@coffy/shared');

// Log info
await logService.info('Operation successful', { userId });

// Log error
await logService.error('Operation failed', { error, userId });
```

### Validation
```javascript
const { validationUtils } = require('@coffy/shared');

// Validate input
const isValid = validationUtils.validateEmail(email);

// Validate schema
const validationResult = validationUtils.validateSchema(data, schema);
```

### Error Handling
```javascript
const { AppError } = require('@coffy/shared');

// Throw custom error
throw new AppError('Invalid input', 400);

// Handle error
try {
  // ... code
} catch (error) {
  errorHandler.handleError(error, req, res);
}
```

## Contributing
When adding new functionality to the shared module:
1. Ensure it's truly shared functionality
2. Add appropriate tests
3. Update documentation
4. Follow the established coding standards

## Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/validation.test.js
```

## License
 
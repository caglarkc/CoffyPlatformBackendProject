# API Gateway

## Overview
The API Gateway is the central entry point for all microservices in the CoffyPlatform. It routes requests to the appropriate services, handles authentication verification, and provides centralized API documentation through Swagger UI.

## Features
- Request routing to appropriate microservices
- Authentication verification
- Cross-Origin Resource Sharing (CORS) support
- Request/response logging
- Centralized API documentation with Swagger UI
- Health checks for all services

## Configuration
Gateway configuration is stored in the `config/services.js` file, which contains the routing information for each microservice:

```javascript
module.exports = {
  "admin-service": "http://localhost:3002",
  "admin-auth-service": "http://localhost:3001",
  "user-auth-service": "http://localhost:3003",
  "product-service": "http://localhost:3004",
  "store-service": "http://localhost:3005"
};
```

## API Documentation
The gateway provides centralized API documentation for all microservices using Swagger UI, accessible at:

```
http://localhost:8080/api-docs
```

### Using the API Documentation
1. Navigate to the URL in your browser
2. All available endpoints from all services will be displayed
3. For protected endpoints:
   - First use the login endpoint to obtain an authentication token
   - Click the "Authorize" button at the top right
   - Enter your token in the bearerAuth field (without "Bearer" prefix)
   - Click "Authorize"
4. Now you can test protected endpoints by clicking "Try it out"

### Documentation Status
Currently, the following services are fully documented with Swagger:
- Admin Auth Service (complete with JSDoc annotations)

Other services are in the process of being documented and will be added to the centralized API documentation in the upcoming sprints.

## Development
To start the gateway in development mode:

```bash
cd gateway
npm install
npm run dev
```

## Environment Variables
The gateway uses the following environment variables:

- `GATEWAY_PORT`: Port on which the gateway will run (default: 8080)
- `NODE_ENV`: Current environment (development, production) 
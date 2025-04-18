# Store Service

## Overview
The Store Service is responsible for managing coffee shop locations, store information, and related operations within the CoffyPlatform ecosystem.

## Features
- Store registration and management
- Store profile information
- Store location and contact details
- Store operating hours
- Store status management
- Store analytics and reporting

## Project Structure
```
store-service/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.js           # Express application
│   └── index.js         # Entry point
├── tests/               # Test files
├── Dockerfile           # Docker configuration
├── .env.example         # Example environment variables
├── package.json         # Project dependencies
└── README.md            # This file
```

## Prerequisites
- Node.js v16 or higher
- MongoDB v4.4 or higher
- Redis

## Installation

### Using Docker
```bash
# Build and run with Docker
docker build -t store-service .
docker run -p 3002:3002 store-service
```

### Manual Installation
```bash
# Install dependencies
npm install

# Start the service
npm run dev
```

## Environment Variables
Create a `.env` file based on `.env.example`:
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/store-db
REDIS_URL=redis://localhost:6379
```

## API Endpoints

### Store Management
- `POST /api/stores` - Create a new store
- `GET /api/stores` - List all stores
- `GET /api/stores/:id` - Get store details
- `PUT /api/stores/:id` - Update store information
- `DELETE /api/stores/:id` - Delete a store

### Store Operations
- `GET /api/stores/:id/status` - Get store status
- `PUT /api/stores/:id/status` - Update store status
- `GET /api/stores/:id/analytics` - Get store analytics

## Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/store.test.js
```

## API Documentation
Swagger documentation is available at `http://localhost:3002/api-docs`

## Contributing
Please read the main project's CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details. 
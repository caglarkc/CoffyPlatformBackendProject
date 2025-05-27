# CoffyPlatform Backend

## Overview
CoffyPlatform's backend is built with a microservices architecture, providing a robust and scalable foundation for the coffee chain management system.

## Load Test Results (Authentication System)
✨ Completed 15,000 concurrent operations in 130 seconds:
- 5000x admin creation
- 5000x login operations (101.17 RPS)
- 5000x logout operations

📊 Performance Metrics:
- 115 operations/second overall
- Previous RPS metrics:
  - Login: 101.17 RPS with 796ms avg response
  - Logout: Fast Redis cleanup (<100ms)
- 8.67ms average response time
- 100% success rate
- Zero failures/timeouts
- Stable under high concurrency (100 batch size)

🔒 Security operations including:
- JWT token management
- Redis session handling
- Password hashing
- Cookie management
- MongoDB operations

💪 System proved capable of handling:
- High concurrent loads
- Batch processing
- Enterprise-scale operations
- Production-level stability

## Project Structure
```
backend/
├── config/                   # Common configuration files
├── gateway/                  # API Gateway
├── services/                 # Microservices
│   ├── auth-service/         # Authentication service
│   ├── store-service/        # Store management service
│   └── [other-services]/     # Other microservices
├── shared/                   # Shared code and utilities
├── docker-compose.yml        # Docker configuration
└── README.md                 # This file
```

## Prerequisites
- Node.js v16 or higher
- MongoDB v4.4 or higher
- Redis
- Docker and Docker Compose

## Installation

### Using Docker
```bash
# Navigate to the backend directory
cd backend

# Start all services with Docker Compose
docker-compose up
```

### Manual Installation
```bash
# Install dependencies
npm install

# Start all services
npm run start:all

# Start individual service
cd services/auth-service
npm install
npm start
```

## Development

### Running Services Individually
Each service can be run independently for development:
```bash
# Auth Service
cd services/auth-service
npm run dev

# Store Service
cd services/store-service
npm run dev
```

### Environment Variables
Each service requires its own `.env` file. Example structure:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/auth-db
REDIS_URL=redis://localhost:6379
```

## Testing
```bash
# Run all tests
npm test

# Run specific service tests
cd services/auth-service
npm test
```

## API Documentation
Each service provides its own Swagger documentation, but we also have a centralized API documentation accessible through the API Gateway:
- Gateway API Documentation: `http://localhost:8080/api-docs`
- Auth Service: `http://localhost:3001/admin-auth/api-docs`


### Using the Swagger UI Documentation
Our API documentation is interactive and allows you to test endpoints directly from your browser:

1. Navigate to `http://localhost:8080/api-docs` in your browser
2. Browse available endpoints organized by service and functionality
3. For secured endpoints (marked with a lock icon), authorize yourself:
   - First make a request to the login endpoint to get a token
   - Click the "Authorize" button at the top of the page
   - Enter your token in the "bearerAuth" field (without "Bearer" prefix)
   - Click "Authorize" to save
4. Now you can test secured endpoints by clicking "Try it out"
5. Fill in required parameters and click "Execute"
6. View the response directly in the browser

This eliminates the need for tools like Postman during development and provides clear documentation for frontend developers.

### Current Implementation Status
Currently, Swagger documentation has been fully integrated for:
- API Gateway (centralized documentation)
- Admin Auth Service

Other services will be integrated in upcoming sprints following the same pattern.

### Adding Documentation to Other Services
To add Swagger documentation to additional services:

1. Install swagger packages in your service:
   ```bash
   cd services/your-service
   npm install swagger-jsdoc swagger-ui-express --save
   ```

2. Create a swagger configuration file
3. Add JSDoc comments to your routes
4. Integrate the Swagger UI in your service's main file

## Contributing
Please read the main project's CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Mikroservis Yönetim Sistemi

Bu sistem, tüm mikroservisleri tek bir komutla yönetmenizi sağlar. Sistemin özellikleri:

- İstediğiniz servisleri seçerek toplu başlatma
- Otomatik kod değişikliği izleme ve yeniden başlatma (nodemon)
- Renkli konsolda servis çıktılarını görüntüleme
- Kolay port yönetimi

### Nasıl Kullanılır

1. `service-config.json` dosyasını düzenleyin:

```json
{
  "admin-auth-service": true,  // true: aktif, false: pasif
  "admin-service": true,
  "user-auth-service": true,
  "product-service": false,    // bu servis çalışmayacak
  "store-service": true
}
```

2. Servisleri başlatın:

```bash
cd backend
npm run services
```

3. Konsolda tüm servislerin çıktısını göreceksiniz, her biri farklı renkte.

### Port Yönetimi

Servis portları `.env` dosyasında tanımlanmıştır:

```
ADMIN_AUTH_SERVICE_PORT=3001
ADMIN_SERVICE_PORT=3002
USER_AUTH_SERVICE_PORT=3003
PRODUCT_SERVICE_PORT=3004
STORE_SERVICE_PORT=3005
```

Her mikroservis kendi portunu şu şekilde kullanabilir:

```javascript
// Her servisin index.js dosyasında
const PORT = process.env.ADMIN_SERVICE_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servis ${PORT} portunda çalışıyor`);
});
```

### Gereksinimler

- Her mikroservis klasöründe bir `package.json` olmalı
- Her mikroservis için `"dev": "nodemon index.js"` scripti tanımlanmış olmalı
- Root klasörde `concurrently` paketi yüklü olmalı 
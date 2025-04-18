/**
 * Store Service Database Configuration
 * Contains connection settings for MongoDB
 */

// .env dosyasından bağlantı bilgilerini al
const getMongoConnectionInfo = (uri) => {
  // mongodb://localhost:27017/dbName formatını parçala
  const matches = uri.match(/mongodb:\/\/([^/]+)\/([^?]+)(\?.*)?$/);
  
  if (matches) {
    return {
      url: `mongodb://${matches[1]}`,
      dbName: matches[2],
      options: {
        serverSelectionTimeoutMS: 5000, // 5 saniye sonra timeout
        socketTimeoutMS: 45000, // 45 saniye sonra socket timeout
      }
    };
  }
  
  // Eğer uri geçerli değilse varsayılan değerleri döndür
  return {
    url: 'mongodb://localhost:27017',
    dbName: 'storeServiceDB',
    options: {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  };
};

// Auth veritabanı URI'sı (admins, users ve logs koleksiyonları burada)
const authUri = process.env.AUTH_MONGODB_URI || 'mongodb://localhost:27017/authServiceDB';

// Store veritabanı URI'sı (mağaza bilgileri burada)
const storeUri = process.env.STORE_MONGODB_URI || 'mongodb://localhost:27017/storeServiceDB';

module.exports = {
  // Store servisinin ana veritabanı - varsayılan olarak kullanılır
  mongodb: getMongoConnectionInfo(storeUri),
  
  // Auth veritabanı bağlantısı - admin, user ve log verileri için
  auth: getMongoConnectionInfo(authUri),
  
  // Store veritabanı bağlantısı - mağaza verileri için  
  store: getMongoConnectionInfo(storeUri),
  
  // Test veritabanı
  testDB: {
    url: 'mongodb://localhost:27017',
    dbName: 'storeServiceDBTest',
    options: {
      serverSelectionTimeoutMS: 5000, // 5 saniye sonra timeout
    }
  }
}; 
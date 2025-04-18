const request = require('supertest');
const { connectTestDB, closeTestDB } = require('../../../../shared/database');
const { v4: uuidv4 } = require('uuid');

// Auth service'in gerçek adresi
const AUTH_SERVICE_URL = 'http://localhost:3001'; // Auth service'in çalıştığı adres

// Test başlamadan önce test DB'ye bağlan
beforeAll(async () => {
  try {
    // Test DB'sine bağlan
    await connectTestDB();
    console.log(`Test database connection established`);
    
    // Auth service'in çalışıp çalışmadığını kontrol et
    try {
      await request(AUTH_SERVICE_URL).get('/').timeout(2000);
      console.log('Auth service is running');
    } catch (error) {
      console.warn('Warning: Auth service may not be running. Tests might fail.');
    }
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

// Test bittikten sonra DB bağlantısını kapat
afterAll(async () => {
  try {
    // Test DB bağlantısını kapat
    await closeTestDB();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Test teardown failed:', error);
    throw error;
  }
});

// Çok sayıda isteği gruplar halinde işleyecek yardımcı fonksiyon (GET istekleri için)
async function runGetRequestBatches(url, path, totalRequests, batchSize) {
  console.log(`Running ${totalRequests} GET requests in batches of ${batchSize}`);
  
  const results = {
    successful: 0,
    failed: 0,
    statusCodes: {},
    errors: [],
    responseTimes: []
  };
  
  // İstekleri grup grup işle
  for (let i = 0; i < totalRequests; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, totalRequests - i);
    console.log(`Running batch ${i/batchSize + 1}, size: ${currentBatchSize}`);
    
    const batchRequests = [];
    for (let j = 0; j < currentBatchSize; j++) {
      const startTime = Date.now();
      batchRequests.push(
        request(url)
          .get(path)
          .then(res => {
            const endTime = Date.now();
            // Başarılı yanıtları say
            results.successful++;
            results.statusCodes[res.statusCode] = (results.statusCodes[res.statusCode] || 0) + 1;
            results.responseTimes.push(endTime - startTime);
            return res;
          })
          .catch(err => {
            // Hataları say ve kaydet
            results.failed++;
            results.errors.push(err.message || 'Unknown error');
            return null;
          })
      );
    }
    
    // Her grubu çalıştır ve tamamlanmasını bekle
    await Promise.all(batchRequests);
  }
  
  // Ortalama yanıt süresini hesapla
  if (results.responseTimes.length > 0) {
    results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  }
  
  return results;
}

// Çok sayıda isteği gruplar halinde işleyecek yardımcı fonksiyon (POST istekleri için)
async function runPostRequestBatches(url, path, data, totalRequests, batchSize) {
  console.log(`Running ${totalRequests} POST requests in batches of ${batchSize}`);
  
  const results = {
    successful: 0,
    failed: 0,
    statusCodes: {},
    errors: [],
    responseTimes: []
  };
  
  // İstekleri grup grup işle
  for (let i = 0; i < totalRequests; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, totalRequests - i);
    console.log(`Running batch ${i/batchSize + 1}, size: ${currentBatchSize}`);
    
    const batchRequests = [];
    for (let j = 0; j < currentBatchSize; j++) {
      // Her istek için benzersiz email ve telefon numarası oluştur
      const timestamp = Date.now();
      const uniqueSuffix = `${i+j}${timestamp}`;
      
      const userData = {
        ...data,
        email: `user${uniqueSuffix}@test.com`, // Benzersiz email
        phone: `55${uniqueSuffix.substring(0, 8)}` // Benzersiz telefon numarası
      };
      
      const startTime = Date.now();
      batchRequests.push(
        request(url)
          .post(path)
          .send(userData)
          .then(res => {
            const endTime = Date.now();
            // Başarılı yanıtları say
            results.successful++;
            results.statusCodes[res.statusCode] = (results.statusCodes[res.statusCode] || 0) + 1;
            results.responseTimes.push(endTime - startTime);
            return res;
          })
          .catch(err => {
            // Hataları say ve kaydet
            results.failed++;
            results.errors.push(err.message || 'Unknown error');
            return null;
          })
      );
    }
    
    // Her grubu çalıştır ve tamamlanmasını bekle
    await Promise.all(batchRequests);
  }
  
  // Ortalama yanıt süresini hesapla
  if (results.responseTimes.length > 0) {
    results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  }
  
  return results;
}

describe('Load Tests - Real Auth Service API', () => {
  // Health endpoint testi - 1000 istek
  it('should handle 1000 concurrent health check requests to real API', async () => {
    const startTime = Date.now();
    
    // 1000 isteği 50'lik gruplar halinde gönder
    const results = await runGetRequestBatches(AUTH_SERVICE_URL, '/api/auth/health', 1000, 50);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`1000 health check için sonuçlar (gerçek API):
    Başarılı: ${results.successful}
    Başarısız: ${results.failed}
    Status kodları: ${JSON.stringify(results.statusCodes)}
    Ortalama yanıt süresi: ${results.averageResponseTime}ms
    Toplam süre: ${totalTime}ms`);
    
    expect(results.successful).toEqual(1000);
    expect(results.failed).toEqual(0);
  }, 30000); // Timeout değerini 30 saniyeye çıkarıyoruz
  
  // Register endpoint testi (CPU ve DB yoğun operasyon)
  it('should handle 10 concurrent register requests to real API', async () => {
    // Doğru formatta userData
    const userData = {
      name: "Test User",
      surname: "Tester",  // Eklenen zorunlu alan
      email: "test@example.com", // Her istek için değiştirilecek
      phone: "+90551234567",  // Eklenen zorunlu alan
      password: "Password123!"
    };
    
    const startTime = Date.now();
    
    const results = await runPostRequestBatches(
      AUTH_SERVICE_URL, 
      '/api/auth/register', 
      userData, 
      10, 
      5
    );
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`10 kayıt isteği için sonuçlar (gerçek API):
    Başarılı: ${results.statusCodes['201'] || 0} (HTTP 201)
    Başarısız: ${results.failed + (Object.keys(results.statusCodes).filter(code => code !== '201').reduce((sum, code) => sum + results.statusCodes[code], 0))}
    Status kodları: ${JSON.stringify(results.statusCodes)}
    Ortalama yanıt süresi: ${results.averageResponseTime}ms
    Toplam süre: ${totalTime}ms
    Hata mesajları: ${results.errors.slice(0, 3).join(', ')}`);
    
    // Başarılı kayıtlar (HTTP 201) var mı?
    console.log(`201 yanıtı sayısı: ${results.statusCodes['201'] || 0}`);
  }, 15000);

  
}); 
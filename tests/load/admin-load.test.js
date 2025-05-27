const request = require('supertest');
let cookies = null;
const loginIds = [];
const loginCookies = new Map(); // Her admin için cookie'leri saklayacağız

// Test bitiminde açık bağlantıları kapat
afterAll(done => {
  // Tüm bağlantıları temizle
  if (global.gc) global.gc();
  
  // Timeout ile process'in temizlenmesini bekle
  setTimeout(() => {
    done();
  }, 500);
});


describe('POST /login', () => {
  const baseURL = 'http://localhost:3001/api/v1/admin-auth';
  it('should handle login attempt with valid credentials', async () => {
    const loginData = {
      email: 'alicaglarkocer@gmail.com',
      password: 'Ali13032003_'
    };

    const response = await request(baseURL)
      .post('/login')
      .send(loginData)
      .expect('Content-Type', /json/)
      .expect(200);

    // Cookie'leri kaydet
    if (response.headers['set-cookie']) {
      cookies = response.headers['set-cookie'];
    }

    // Kullanıcı zaten giriş yapmışsa
    if (response.body.alreadyLoggedIn) {
      expect(response.body.alreadyLoggedIn).toBe(true);
    } else {
      expect(response.body.message).toBe('Giriş yapıldı');
    }
  });
});


describe('5000x POST /create-admin Load Test', () => {
  const baseURL = 'http://localhost:3001/api/v1/admin-auth';
  
  it('should handle 5000 concurrent create admin requests', async () => {
    const totalRequests = 5000;
    const batchSize = 100;
    const batches = Math.ceil(totalRequests / batchSize);
    
    console.log(`\n🚀 Starting ${totalRequests} concurrent admin creation requests in batches of ${batchSize}`);
    
    const results = {
      successful: 0,
      failed: 0,
      statusCodes: {},
      responseTimes: [],
      errors: []
    };

    const startTime = Date.now();

    // Batch'ler halinde istekleri gönder
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const currentBatchSize = Math.min(batchSize, totalRequests - (batchIndex * batchSize));
      console.log(`📦 Running batch ${batchIndex + 1}/${batches}, size: ${currentBatchSize}`);

      // Bu batch'teki tüm istekleri paralel olarak oluştur
      const batchPromises = [];
      
      for (let i = 0; i < currentBatchSize; i++) {
        const requestIndex = (batchIndex * batchSize) + i;
        const requestStartTime = Date.now();
        
        const createAdminData = {
          email: `sonDeneme${requestIndex}@gmail.com`,
          password: 'Ali13032003_',
          name: `LoadTestAdmin`,
          surname: `TestUser`,
          phone: `5${(560000000 + requestIndex).toString()}`,
          city: 'İstanbul',
          region: 'LoadTest',
          district: `Batch${batchIndex}`
        };
        
        const requestPromise = request(baseURL)
          .post('/create-admin')
          .send(createAdminData)
          .set('Cookie', cookies)
          .then(response => {
            if (i === 0) {
              console.log(response.body);
            }
            const responseTime = Date.now() - requestStartTime;
            results.responseTimes.push(responseTime);
            
            // Status code sayısını güncelle
            const statusCode = response.status.toString();
            results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;
            
            if (response.status >= 200 && response.status < 300) {
              results.successful++;
            } else {
              results.failed++;
            }
            
            return {
              success: true,
              status: response.status,
              responseTime
            };
          })
          .catch(error => {
            const responseTime = Date.now() - requestStartTime;
            results.responseTimes.push(responseTime);
            results.failed++;
            
            // Hata mesajını kaydet (sadece ilk 10 hatayı)
            if (results.errors.length < 10) {
              results.errors.push(error.message);
            }
            
            // Hata durumunda status code'u kaydet
            const statusCode = error.status ? error.status.toString() : 'ERROR';
            results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;
            
            return {
              success: false,
              error: error.message,
              status: error.status,
              responseTime
            };
          });

        batchPromises.push(requestPromise);
      }

      // Bu batch'teki tüm istekleri paralel olarak bekle
      await Promise.all(batchPromises);
      
      // Batch'ler arası kısa bir bekleme (sunucuyu rahatlatmak için)
      if (batchIndex < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const totalTime = Date.now() - startTime;
    const averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;

    // Sonuçları logla
    console.log(`\n📊 ${totalRequests} admin creation request sonuçları:`);
    console.log(`   ✅ Başarılı: ${results.successful}`);
    console.log(`   ❌ Başarısız: ${results.failed}`);
    console.log(`   📋 Status kodları: ${JSON.stringify(results.statusCodes)}`);
    console.log(`   ⏱️  Ortalama yanıt süresi: ${averageResponseTime.toFixed(3)}ms`);
    console.log(`   🕐 Toplam süre: ${totalTime}ms`);
    console.log(`   🚀 İstek/saniye: ${(totalRequests / (totalTime / 1000)).toFixed(2)} RPS`);
    if (results.errors.length > 0) {
      console.log(`   🚨 Hata örnekleri:`, results.errors.slice(0, 3));
    }

    // Test assertions
    expect(results.successful + results.failed).toBe(totalRequests);
    expect(averageResponseTime).toBeLessThan(10000); // 10 saniyeden az olsun
    
    // Başarı oranı hesapla
    const successRate = (results.successful / totalRequests) * 100;
    console.log(`   📈 Başarı oranı: %${successRate.toFixed(2)}`);
    
  }, 300000); // 5 dakika timeout
});

describe('GET /logout', () => {

  const baseURL = 'http://localhost:3001/api/v1/admin-auth';

  //Passed
  it('should handle logout attempt with auth cookie', async () => {

    // Cookie ile logout isteği
    const response = await request(baseURL)
      .get('/logout')
      .set('Cookie', cookies)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Çıkış yapıldı');
    expect(response.body.success).toBe(true);
  });

});


describe('5000x POST /login Load Test', () => {
  const baseURL = 'http://localhost:3001/api/v1/admin-auth';
  
  it('should handle 5000 concurrent login requests with created admin accounts', async () => {
    const totalRequests = 5000;
    const batchSize = 100;
    const batches = Math.ceil(totalRequests / batchSize);
    
    console.log(`\n🔐 Starting ${totalRequests} concurrent login requests with created admin accounts in batches of ${batchSize}`);
    
    const results = {
      successful: 0,
      failed: 0,
      alreadyLoggedIn: 0,
      statusCodes: {},
      responseTimes: [],
      errors: []
    };

    const startTime = Date.now();

    // Batch'ler halinde istekleri gönder
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const currentBatchSize = Math.min(batchSize, totalRequests - (batchIndex * batchSize));
      console.log(`📦 Running batch ${batchIndex + 1}/${batches}, size: ${currentBatchSize}`);

      // Bu batch'teki tüm istekleri paralel olarak oluştur
      const batchPromises = [];
      
      for (let i = 0; i < currentBatchSize; i++) {
        const requestIndex = (batchIndex * batchSize) + i;
        const requestStartTime = Date.now();
        
        // Önceden oluşturduğumuz admin hesaplarının bilgilerini kullan
        const loginData = {
          email: `sonDeneme${requestIndex}@gmail.com`,
          password: 'Ali13032003_'
        };
        
        const requestPromise = request(baseURL)
          .post('/login')
          .send(loginData)
          .then(response => {
            const responseTime = Date.now() - requestStartTime;
            results.responseTimes.push(responseTime);

            // İlk response'u göster
            if (requestIndex === 0) {
              console.log('📝 First response:', response.body);
            }
            
            // Status code sayısını güncelle
            const statusCode = response.status.toString();
            results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;
            
            if (response.status === 200) {
              results.successful++;
              
              // Cookie'leri ve admin ID'yi sakla
              if (response.headers['set-cookie']) {
                loginCookies.set(requestIndex, response.headers['set-cookie']);
              }
              loginIds.push(response.body.adminId);
              
              // Response validation - hem normal login hem already logged in durumları için
              if (response.body.alreadyLoggedIn) {
                results.alreadyLoggedIn++;
                expect(response.body).toHaveProperty('adminId');
                expect(response.body).toHaveProperty('adminName');
              } else if (response.body.accessTokenRefreshed) {
                expect(response.body).toHaveProperty('admin');
                expect(response.body).toHaveProperty('message', 'Oturumunuz yenilendi, yeni token oluşturuldu');
              } else {
                expect(response.body).toHaveProperty('admin');
                expect(response.body).toHaveProperty('message', 'Giriş yapıldı');
              }
            } else {
              results.failed++;
            }
            
            return {
              success: response.status === 200,
              status: response.status,
              responseTime,
              adminId: response.body.adminId
            };
          })
          .catch(error => {
            const responseTime = Date.now() - requestStartTime;
            results.responseTimes.push(responseTime);
            results.failed++;
            
            // Hata mesajını kaydet (sadece ilk 10 hatayı)
            if (results.errors.length < 10) {
              results.errors.push(error.message);
            }
            
            // Hata durumunda status code'u kaydet
            const statusCode = error.status ? error.status.toString() : 'ERROR';
            results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;
            
            return {
              success: false,
              error: error.message,
              status: error.status,
              responseTime
            };
          });

        batchPromises.push(requestPromise);
      }

      // Bu batch'teki tüm istekleri paralel olarak bekle
      const batchResults = await Promise.all(batchPromises);
      
      // Batch sonuçlarını logla
      const batchSuccessful = batchResults.filter(r => r.success).length;
      console.log(`   ✓ Batch ${batchIndex + 1} completed: ${batchSuccessful}/${currentBatchSize} successful`);
      
      // Batch'ler arası kısa bir bekleme (sunucuyu rahatlatmak için)
      if (batchIndex < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const totalTime = Date.now() - startTime;
    const averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;

    // Sonuçları logla
    console.log(`\n📊 ${totalRequests} login request sonuçları:`);
    console.log(`   ✅ Başarılı: ${results.successful}`);
    console.log(`   ❌ Başarısız: ${results.failed}`);
    console.log(`   🔄 Already Logged In: ${results.alreadyLoggedIn}`);
    console.log(`   📋 Status kodları: ${JSON.stringify(results.statusCodes)}`);
    console.log(`   ⏱️  Ortalama yanıt süresi: ${averageResponseTime.toFixed(3)}ms`);
    console.log(`   🕐 Toplam süre: ${totalTime}ms`);
    console.log(`   🚀 İstek/saniye: ${(totalRequests / (totalTime / 1000)).toFixed(2)} RPS`);
    
    if (results.errors.length > 0) {
      console.log(`   🚨 İlk ${Math.min(3, results.errors.length)} hata örneği:`, results.errors.slice(0, 3));
    }

    // Test assertions
    expect(results.successful + results.failed).toBe(totalRequests);
    expect(averageResponseTime).toBeLessThan(10000); // 10 saniyeden az olsun
    
    // Başarı oranı hesapla
    const successRate = (results.successful / totalRequests) * 100;
    console.log(`   📈 Başarı oranı: %${successRate.toFixed(2)}`);
    
  }, 300000); // 5 dakika timeout
});

describe('5000x GET /logout Load Test', () => {
  const baseURL = 'http://localhost:3001/api/v1/admin-auth';
  
  it('should handle 5000 concurrent logout requests with created admin accounts', async () => {
    const totalRequests = 5000;
    const batchSize = 100;
    const batches = Math.ceil(totalRequests / batchSize);
    
    console.log(`\n🔐 Starting ${totalRequests} concurrent logout requests with created admin accounts in batches of ${batchSize}`);
    
    const results = {
      successful: 0,
      failed: 0,
      statusCodes: {},
      responseTimes: [],
      errors: []
    };

    const startTime = Date.now();

    // Batch'ler halinde istekleri gönder
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const currentBatchSize = Math.min(batchSize, totalRequests - (batchIndex * batchSize));
      console.log(`📦 Running batch ${batchIndex + 1}/${batches}, size: ${currentBatchSize}`);

      // Bu batch'teki tüm istekleri paralel olarak oluştur
      const batchPromises = [];
      
      for (let i = 0; i < currentBatchSize; i++) {
        const requestIndex = (batchIndex * batchSize) + i;
        const requestStartTime = Date.now();
        
        // Her admin için kendi cookie'lerini kullan
        const adminCookies = loginCookies.get(requestIndex);
        
        const requestPromise = request(baseURL)
          .get('/logout')
          .set('Cookie', adminCookies)
          .then(response => {
            const responseTime = Date.now() - requestStartTime;
            results.responseTimes.push(responseTime);
            
            // İlk response'u göster
            if (requestIndex === 0) {
              console.log('📝 First response:', response.body);
            }
            
            // Status code sayısını güncelle
            const statusCode = response.status.toString();
            results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;
            
            if (response.status === 200) {
              results.successful++;
              
              // Validate response structure
              expect(response.body).toHaveProperty('message');
              expect(response.body.message).toBe('Çıkış yapıldı');
              expect(response.body.success).toBe(true);
            } else {
              results.failed++;
            }
            
            return {
              success: response.status === 200,
              status: response.status,
              responseTime,
            };
          })
          .catch(error => {
            const responseTime = Date.now() - requestStartTime;
            results.responseTimes.push(responseTime);
            results.failed++;
            
            // Hata mesajını kaydet (sadece ilk 10 hatayı)
            if (results.errors.length < 10) {
              results.errors.push(error.message);
            }
            
            // Hata durumunda status code'u kaydet
            const statusCode = error.status ? error.status.toString() : 'ERROR';
            results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;
            
            return {
              success: false,
              error: error.message,
              status: error.status,
              responseTime
            };
          });

        batchPromises.push(requestPromise);
      }

      // Bu batch'teki tüm istekleri paralel olarak bekle
      const batchResults = await Promise.all(batchPromises);
      
      // Batch sonuçlarını logla
      const batchSuccessful = batchResults.filter(r => r.success).length;
      console.log(`   ✓ Batch ${batchIndex + 1} completed: ${batchSuccessful}/${currentBatchSize} successful`);
      
      // Batch'ler arası kısa bir bekleme (sunucuyu rahatlatmak için)
      if (batchIndex < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const totalTime = Date.now() - startTime;
    const averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;

    // Sonuçları logla
    console.log(`\n📊 ${totalRequests} logout request sonuçları:`);
    console.log(`   ✅ Başarılı: ${results.successful}`);
    console.log(`   ❌ Başarısız: ${results.failed}`);
    console.log(`   📋 Status kodları: ${JSON.stringify(results.statusCodes)}`);
    console.log(`   ⏱️  Ortalama yanıt süresi: ${averageResponseTime.toFixed(3)}ms`);
    console.log(`   🕐 Toplam süre: ${totalTime}ms`);
    console.log(`   🚀 İstek/saniye: ${(totalRequests / (totalTime / 1000)).toFixed(2)} RPS`);
    
    if (results.errors.length > 0) {
      console.log(`   🚨 İlk ${Math.min(3, results.errors.length)} hata örneği:`, results.errors.slice(0, 3));
    }

    // Test assertions
    expect(results.successful + results.failed).toBe(totalRequests);
    expect(averageResponseTime).toBeLessThan(10000); // 10 saniyeden az olsun
    
    // Başarı oranı hesapla
    const successRate = (results.successful / totalRequests) * 100;
    console.log(`   📈 Başarı oranı: %${successRate.toFixed(2)}`);
    
  }, 300000); // 5 dakika timeout
});





const request = require('supertest');
const { connectTestDB, closeTestDB } = require('../../../../shared/database');
const { v4: uuidv4 } = require('uuid');
const User = require('../../src/models/user.model');

const AUTH_SERVICE_URL = 'http://localhost:3001';

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
  
// Test senaryolarını bir tabloda tanımlayın
const passwordTestCases = [
    ['çok kısa', 'Pass1', 'Geçersiz şifre, şifre en az 8 karakter, en fazla 20 karakter ve en az birer büyük harf, küçük harf ve rakam içermelidir.'],
    ['büyük harf eksik', 'password123', 'Geçersiz şifre, şifre en az 8 karakter, en fazla 20 karakter ve en az birer büyük harf, küçük harf ve rakam içermelidir.'],
    ['küçük harf eksik', 'PASSWORD123', 'Geçersiz şifre, şifre en az 8 karakter, en fazla 20 karakter ve en az birer büyük harf, küçük harf ve rakam içermelidir.'],
    ['sayı eksik', 'PasswordTest', 'Geçersiz şifre, şifre en az 8 karakter, en fazla 20 karakter ve en az birer büyük harf, küçük harf ve rakam içermelidir.'],
    ['geçerli şifre', 'Password123', null] // Hata beklenmez
  ];


  
  // Tüm senaryoları tek bir test bloğuyla kontrol edin
  describe('Password validation tests', () => {
    it.each(passwordTestCases)(
      'should validate password when %s',
      async (scenario, password, expectedError) => {
        const response = await request(AUTH_SERVICE_URL)
          .post('/api/auth/register')
          .send({
            name: 'Test',
            surname: 'User',
            email: `test${Date.now() % 10000}@example.com`,
            password: password,
            phone: `555144${Date.now() % 10000}`
          });
  
          console.log(scenario);
        if (expectedError) {
          // Hata bekliyorsak
          expect(response.status).toBe(400); // veya ilgili hata kodu
          expect(response.body.message).toContain(expectedError);
        } else {
          // Hata beklemiyorsak
          expect(response.status).toBe(201); // veya ilgili başarı kodu
        }
      }
    );
  });
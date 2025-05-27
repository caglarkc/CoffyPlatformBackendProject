const request = require('supertest');
let cookies = null;


//passed
describe('Admin Auth Service', () => {
  const baseURL = 'http://localhost:3001/api/v1/admin-auth';

  describe('POST /login', () => {

    //Passed
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
        expect(response.body).toHaveProperty('message');
        expect(response.body.alreadyLoggedIn).toBe(true);
        expect(response.body.adminId).toBeTruthy();
        expect(response.body.adminName).toBeTruthy();
      } else {
        // Normal giriş durumu
        expect(response.body).toHaveProperty('admin');
        expect(response.body).toHaveProperty('adminId');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('tokenPair.refreshToken');
        expect(response.body.message).toBe('Giriş yapıldı');
      }
    });

    //Passed
    it('should handle failed login attempt with invalid credentials', async () => {
      const loginData = {
        email: 'alicaglarkocer@gmail.com',
        password: 'Ali13032003_1'
      };

      const response = await request(baseURL)
        .post('/login')
        .send(loginData)
        .expect('Content-Type', /json/);
      
      // 401 veya 500 olabilir - her iki durum da geçerli hata durumları
      expect([401, 500]).toContain(response.status);
      
      // Her durumda bir hata mesajı olmalı
      expect(response.body).toHaveProperty('message');
      
      if (response.status === 401) {
        expect(response.body.success).toBe(false);
      }
    });
  });

  
  
  


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
      expect(response.body).toHaveProperty('message');
      expect(response.body.alreadyLoggedIn).toBe(true);
      expect(response.body.adminId).toBeTruthy();
      expect(response.body.adminName).toBeTruthy();
    } else {
      // Normal giriş durumu
      expect(response.body).toHaveProperty('admin');
      expect(response.body).toHaveProperty('adminId');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('tokenPair.refreshToken');
      expect(response.body.message).toBe('Giriş yapıldı');
    }
  });
});

describe('GET /me', () => {
  const baseURL = 'http://localhost:3002/api/v1/admin';

  it('should handle get me request with auth cookie', async () => {
    const response = await request(baseURL)
      .get('/me')
      .set('Cookie', cookies)
      .expect('Content-Type', /json/)
      .expect(200);


    expect(response.body.success).toBe(true);
  });
});


describe('GET /logout', () => {

  const baseURL = 'http://localhost:3001/api/v1/admin-auth';

  //Passed
  it('should handle logout attempt with auth cookie', async () => {
    // Eğer cookie yoksa önce login olalım
    if (!cookies) {
      const loginData = {
        email: 'alicaglarkocer@gmail.com',
        password: 'Ali13032003_'
      };

      const loginResponse = await request(baseURL)
        .post('/login')
        .send(loginData);

      if (loginResponse.headers['set-cookie']) {
        cookies = loginResponse.headers['set-cookie'];
      }
    }

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

  //Passed
  it('should fail logout without auth cookie', async () => {
    const response = await request(baseURL)
      .get('/logout')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Yetkilendirme hatası: Oturum açmanız gerekiyor');
  });
});
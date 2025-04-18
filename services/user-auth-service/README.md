# Auth Service

<div align="center">
  <img src="https://raw.githubusercontent.com/caglarkc/CoffyPlatform/main/docs/assets/auth-service-logo.png" alt="Auth Service Logo" width="150" height="auto">
  <br/>
  <p><strong>CoffyPlatform Kimlik Doğrulama ve Yetkilendirme Servisi</strong></p>
  <br/>
  
  ![Node.js](https://img.shields.io/badge/Node.js-v16+-green)
  ![Express](https://img.shields.io/badge/Express-v4.18+-blue)
  ![MongoDB](https://img.shields.io/badge/MongoDB-v4.4+-lightgreen)
  ![JWT](https://img.shields.io/badge/JWT-Authorization-orange)
</div>

## 📑 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Özellikler](#-özellikler)
- [Mimari](#-mimari)
- [API Endpointleri](#-api-endpointleri)
- [Kurulum & Geliştirme](#-kurulum--geliştirme)
- [Çevresel Değişkenler](#-çevresel-değişkenler)
- [Veri Modelleri](#-veri-modelleri)
- [Güvenlik](#-güvenlik)
- [Test](#-test)

## 🔍 Genel Bakış

Auth Service, CoffyPlatform ekosisteminin kimlik doğrulama ve yetkilendirme ihtiyaçlarını karşılayan temel bir mikroservistir. Bu servis, kullanıcı kaydı, girişi, oturum yönetimi, şifre sıfırlama ve token doğrulama gibi temel kimlik doğrulama süreçlerini yönetir.

## ✨ Özellikler

- **Kullanıcı Yönetimi**
  - Kayıt ve giriş işlemleri
  - E-posta doğrulama
  - Şifre sıfırlama
  - Profil güncelleme

- **Oturum Yönetimi**
  - JWT (JSON Web Token) tabanlı kimlik doğrulama
  - Access ve Refresh token mekanizması
  - Token yenileme ve geçersiz kılma

- **Sosyal Medya Entegrasyonu**
  - Google ile giriş yapma
  - Facebook ile giriş yapma

- **Yetkilendirme**
  - Rol tabanlı erişim kontrolü (Admin, Kullanıcı, Personel)
  - İzin tabanlı kaynak erişimi

- **Güvenlik**
  - Şifre hashleme (bcrypt)
  - Rate limiting
  - CSRF koruması
  - Güvenli HTTP başlıkları

## 🏗 Mimari

Auth Service, aşağıdaki katmanlı mimari yapısını kullanır:

```
src/
├── config/          # Konfigürasyon dosyaları
├── controllers/     # HTTP isteklerini karşılayan kontrolcüler
├── middlewares/     # Express.js middleware'leri
├── models/          # MongoDB/Mongoose veri modelleri
├── routes/          # API endpoint yönlendirmeleri
├── services/        # İş mantığını içeren servis katmanı
├── utils/           # Yardımcı fonksiyonlar ve araçlar
├── validations/     # Girdi doğrulama şemaları (Joi/Yup)
└── app.js           # Express uygulaması tanımı
```

## 🔌 API Endpointleri

| Endpoint | Metod | Açıklama | Parametreler | Cevap |
|----------|-------|----------|-------------|-------|
| `/api/auth/register` | POST | Yeni kullanıcı kaydı | `name`, `surname`, `email`, `phone`, `password` | `{ user, tokens }` |
| `/api/auth/login` | POST | Kullanıcı girişi | `email`, `password` | `{ user, tokens }` |
| `/api/auth/verify-email` | POST | E-posta doğrulama | `email`, `code` | `{ success, message }` |
| `/api/auth/send-verification-email` | POST | Doğrulama e-postası gönderme | `email` | `{ success, message }` |
| `/api/auth/refresh-token` | POST | Access token yenileme | `refreshToken` | `{ accessToken, refreshToken }` |
| `/api/auth/forgot-password` | POST | Şifre sıfırlama e-postası | `email` | `{ success, message }` |
| `/api/auth/reset-password` | POST | Şifre sıfırlama | `resetToken`, `newPassword` | `{ success, message }` |
| `/api/auth/logout` | POST | Kullanıcı çıkışı | `refreshToken` | `{ success, message }` |
| `/api/auth/me` | GET | Kullanıcı bilgilerini getir | - | `{ user }` |
| `/api/auth/google` | POST | Google ile giriş | `idToken` | `{ user, tokens }` |
| `/api/auth/facebook` | POST | Facebook ile giriş | `accessToken` | `{ user, tokens }` |

Detaylı API dokümantasyonu için Swagger arayüzünü kullanabilirsiniz: `http://localhost:3001/api-docs`

## 🚀 Kurulum & Geliştirme

### Ön Gereksinimler

- Node.js v16 veya üzeri
- MongoDB v4.4 veya üzeri
- NPM veya Yarn

### Kurulum

```bash
# Auth Service dizinine gidin
cd backend/services/auth-service

# Bağımlılıkları yükleyin
npm install

# .env.example dosyasını kopyalayın
cp .env.example .env

# .env dosyasını düzenleyin
nano .env

# Servisi başlatın
npm start

# Geliştirme modunda başlatmak için
npm run dev
```

### Docker ile Çalıştırma

```bash
# Auth Service dizinine gidin
cd backend/services/auth-service

# Docker image'ini oluşturun
docker build -t coffy-auth-service .

# Container'ı çalıştırın
docker run -p 3001:3001 --env-file .env coffy-auth-service
```

## 🔧 Çevresel Değişkenler

Auth Service için gerekli çevresel değişkenler:

| Değişken | Açıklama | Örnek Değer |
|----------|----------|-------------|
| `PORT` | Servisin çalışacağı port | `3001` |
| `NODE_ENV` | Çalışma ortamı | `development`, `production`, `test` |
| `MONGODB_URI` | MongoDB bağlantı URI'si | `mongodb://localhost:27017/coffy-auth` |
| `JWT_SECRET` | JWT imzalama anahtarı | `your-secret-key` |
| `JWT_ACCESS_EXPIRATION` | Access token süresi | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token süresi | `7d` |
| `EMAIL_SMTP_HOST` | SMTP sunucu adresi | `smtp.gmail.com` |
| `EMAIL_SMTP_PORT` | SMTP sunucu portu | `587` |
| `EMAIL_SMTP_USER` | SMTP kullanıcı adı | `your-email@gmail.com` |
| `EMAIL_SMTP_PASS` | SMTP şifresi | `your-password` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `google-client-id` |
| `FACEBOOK_APP_ID` | Facebook App ID | `facebook-app-id` |
| `FACEBOOK_APP_SECRET` | Facebook App Secret | `facebook-app-secret` |
| `REDIS_URL` | Redis bağlantı URI'si (opsiyonel) | `redis://localhost:6379` |

## 📊 Veri Modelleri

### User Model

```javascript
{
  name: String,            // Kullanıcı adı
  surname: String,         // Kullanıcı soyadı
  email: String,           // Kullanıcı e-posta (benzersiz)
  phone: String,           // Telefon numarası
  password: String,        // Hashlenmiş şifre
  isEmailVerified: Boolean,// E-posta doğrulama durumu
  role: String,            // Kullanıcı rolü (user, admin, staff)
  verificationCode: String,// E-posta doğrulama kodu
  verificationExpiry: Date,// Doğrulama kodunun geçerlilik süresi
  resetPasswordToken: String,// Şifre sıfırlama tokeni
  resetPasswordExpiry: Date,// Şifre sıfırlama tokeninin geçerlilik süresi
  createdAt: Date,         // Kayıt tarihi
  updatedAt: Date          // Güncelleme tarihi
}
```

### Token Model

```javascript
{
  token: String,          // Refresh token değeri
  user: ObjectId,         // İlişkili kullanıcı ID'si
  type: String,           // Token tipi (refresh)
  expires: Date,          // Geçerlilik süresi
  blacklisted: Boolean,   // Kara listeye alınma durumu
  createdAt: Date,        // Oluşturulma tarihi
  updatedAt: Date         // Güncelleme tarihi
}
```

## 🔐 Güvenlik

Auth Service, çeşitli güvenlik önlemleri ile korunmaktadır:

- **Şifre Güvenliği**: Şifreler bcrypt ile hashlenmiştir
- **Rate Limiting**: Brute force saldırılarına karşı istek sınırlaması
- **JWT Güvenliği**: Kısa ömürlü access tokenlar, refresh token rotasyonu
- **CORS Koruması**: Belirli originlerden gelen isteklere izin verme
- **HTTP Güvenliği**: Helmet.js ile güvenli HTTP başlıkları
- **Input Validation**: Joi/Yup ile kapsamlı girdi doğrulama

## 🧪 Test

Auth Service için test komutları:

```bash
# Tüm testleri çalıştır
npm test

# Birim testleri çalıştır
npm run test:unit

# Entegrasyon testleri çalıştır
npm run test:integration

# Test coverage raporu
npm run test:coverage
```

## 🔄 Servis Entegrasyonları

Auth Service, diğer CoffyPlatform servisleri ile şu şekilde entegre olur:

- **Gateway**: API Gateway üzerinden erişilebilir
- **User Service**: Kullanıcı profil bilgilerini senkronize eder
- **Notification Service**: E-posta doğrulama ve şifre sıfırlama bildirimleri gönderir

---

Auth Service ile ilgili herhangi bir sorun veya öneriniz varsa, lütfen GitHub issue açın veya pull request gönderin. 
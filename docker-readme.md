# Docker ile CoffyPlatform Backend Çalıştırma Rehberi

Bu belge, CoffyPlatform Backend projesini Docker ve Docker Compose kullanarak nasıl çalıştıracağınızı açıklar.

## Gereksinimler

- Docker [İndirme linki](https://www.docker.com/products/docker-desktop/)
- Docker Compose (Docker Desktop ile birlikte gelir)

## Kurulum Adımları

### 1. Çevre Değişkenlerini Yapılandırma

Projenin kök dizinindeki `.env` dosyası tüm servislerin ortak kullanacağı değişkenleri içerir. Bu dosya Docker Compose tarafından otomatik olarak okunur ve tüm servislere dağıtılır.

Mevcut `.env` dosyanız Docker ortamı için güncellenmiştir. Özellikle veritabanı bağlantı ayarları (MongoDB, Redis, RabbitMQ) Docker container isimlerini referans alacak şekilde değiştirilmiştir.

Ana `.env` dosyasında şunlar bulunmalıdır:
- Tüm mikroservislerin port numaraları
- Veritabanı bağlantı bilgileri (Docker host isimleriyle)
- Gizli anahtarlar ve şifreler
- Diğer ortak yapılandırma parametreleri

Eğer `.env` dosyanızda hassas bilgiler (API anahtarları, şifreler) varsa, bu bilgilerin güvenliğinden emin olun. Projeyi üretim ortamına taşırken bu bilgileri gözden geçirin.

### 2. Docker Container'larını Oluşturma ve Başlatma

Proje kök dizininde aşağıdaki komutu çalıştırın:

```bash
docker-compose up
```

Bu komut tüm servisleri ve bağımlı sistemleri (MongoDB, Redis, RabbitMQ) başlatacaktır.

Arkaplanda çalıştırmak için:

```bash
docker-compose up -d
```

### 3. Tek Bir Servisin Başlatılması

Sadece belirli bir servisi başlatmak için:

```bash
docker-compose up [servis-adı]
```

Örneğin:

```bash
docker-compose up gateway
```

### 4. Sistemin Durdurulması

Çalışan Docker container'larını durdurmak için:

```bash
docker-compose down
```

Veritabanı verilerini ve diğer volume'ları kaldırmak için:

```bash
docker-compose down -v
```

## Servis ve Port Bilgileri

| Servis | Port | URL |
|--------|------|-----|
| API Gateway | 8080 | http://localhost:8080 |
| Admin Auth Service | 3001 | http://localhost:3001 |
| Admin Service | 3002 | http://localhost:3002 |
| User Auth Service | 3003 | http://localhost:3003 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Redis | 6379 | redis://localhost:6379 |
| RabbitMQ | 5672, 15672 | http://localhost:15672 (Yönetim UI) |

## Log Görüntüleme

Tüm servislerin loglarını görmek için:

```bash
docker-compose logs
```

Belirli bir servisin loglarını takip etmek için:

```bash
docker-compose logs -f [servis-adı]
```

Örneğin:

```bash
docker-compose logs -f gateway
```

## Servisler Arası İletişim

Docker Compose ağı içinde, servisler birbirleriyle container isimleri üzerinden iletişim kurabilirler:

- MongoDB: `mongodb:27017`
- Redis: `redis:6379`
- RabbitMQ: `rabbitmq:5672`
- Gateway: `gateway:8080`
- Admin Auth Service: `admin-auth-service:3001`
- Admin Service: `admin-service:3002`
- User Auth Service: `user-auth-service:3003`

## Veritabanı Yönetimi

### MongoDB'ye Erişim

```bash
docker-compose exec mongodb mongo -u admin -p Erebus13032003_ --authenticationDatabase admin
```

### Redis'e Erişim

```bash
docker-compose exec redis redis-cli
```

### RabbitMQ Yönetim Paneli

RabbitMQ yönetim paneline erişmek için tarayıcınızda şu adresi açın:
http://localhost:15672

Kullanıcı Adı: admin
Şifre: Erebus13032003_

## Sorun Giderme

1. **Servisler başlatılamıyor:**
   - `docker-compose logs [servis-adı]` komutu ile servise ait hata mesajlarını kontrol edin.

2. **Portlar kullanılıyor hatası:**
   - Bilgisayarınızda bu portların kullanımda olmadığından emin olun.
   - Gerekirse docker-compose.yml dosyasında port yapılandırmasını değiştirin.

3. **Veritabanı bağlantı sorunları:**
   - Veritabanı servislerinin çalıştığından emin olun: `docker-compose ps`
   - Bağlantı URL'lerinin doğru olduğunu kontrol edin.
   - MongoDB, Redis ve RabbitMQ'nun doğru şekilde başlatıldığından emin olun.

4. **Docker kaynakları:**
   - Docker Desktop'ta yeterli kaynak ayrıldığından emin olun (CPU, RAM).

5. **Çevre Değişkeni Sorunları:**
   - Servislerin log'larında çevre değişkeni hatası var mı kontrol edin.
   - `.env` dosyasının doğru formatta olduğunu doğrulayın.

## Kaynakları Yönetme

Kullanılmayan Docker imajlarını ve containerlarını temizlemek için:

```bash
docker system prune
```

Tüm durmuş containerları ve kullanılmayan imajları, networkleri ve volumeleri temizlemek için:

```bash
docker system prune -a
```

## Disk Alanı Kullanımı

Docker volume'larının ne kadar disk alanı kullandığını görmek için:

```bash
docker system df -v
``` 
# Admin Kayıt Yük Testi (k6)

Bu klasör, Coffy platformunun admin kayıt API'sine yönelik yük testleri içerir. Bu testler, k6 test aracı kullanılarak gerçekleştirilir ve sistemin performansını, yanıt sürelerini ve RAM kullanımını ölçer.

## Kurulum

### k6 Kurulumu

k6'yı bilgisayarınıza yüklemek için aşağıdaki adımları izleyin:

#### Windows için:

1. [k6 İndirme Sayfası](https://k6.io/docs/getting-started/installation/)ndan Windows yükleyicisini indirin.
2. İndirilen dosyayı çalıştırın ve kurulum sihirbazını takip edin.
3. Kurulum tamamlandıktan sonra, PowerShell veya Command Prompt'ta `k6 version` komutunu çalıştırarak kurulumu doğrulayın.

#### macOS için:

```bash
brew install k6
```

#### Linux için:

```bash
sudo apt-get install k6
# veya
sudo dnf install k6
```

### Node.js Gereksinimleri

RAM izleme aracı için Node.js gereklidir. Eğer yüklü değilse [Node.js resmi sitesinden](https://nodejs.org/) indirip yükleyin.

## Testleri Çalıştırma

### Admin Bilgilerini Ayarlama

Admin kayıt işlemi için öncelikle bir admin hesabı ile giriş yapılması gerekir. Test dosyasında (`admin-register-test.js`) aşağıdaki bilgileri kendi admin hesabınıza göre güncelleyin:

```javascript
// Admin giriş bilgileri (Creator veya yüksek yetkili admin)
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com', // Bu kısmı kendi admin email'inizle değiştirin
  password: 'adminpasswordhere' // Bu kısmı kendi admin şifrenizle değiştirin
};
```

**Not**: Admin hesabınızın yeni admin oluşturma yetkisine sahip olması gerekmektedir (role değeri en az 4 olmalı).

### Testi Çalıştırma

Admin kayıt yük testini çalıştırmak için iki yöntem vardır:

#### 1. Otomatik Çalıştırma (Önerilen)

Bu yöntem, hem k6 testini hem de RAM izleme aracını otomatik olarak çalıştırır:

##### Windows için:

```bash
run-test.bat
```

##### Linux/macOS için:

```bash
# Önce çalıştırma izni verin
chmod +x run-test.sh
# Sonra çalıştırın
./run-test.sh
```

#### 2. Manuel Çalıştırma

1. Admin Auth servisinin çalıştığından emin olun (varsayılan olarak `http://localhost:3002` adresinde).
2. Terminal veya PowerShell'de bu klasöre gidin:

```bash
cd backend/tests/load
```

3. k6 ile testi çalıştırın:

```bash
k6 run admin-register-test.js
```

4. (İsteğe bağlı) Ayrı bir terminal penceresinde RAM izleme aracını çalıştırın:

```bash
# Admin Auth servisinin PID'sini bulun (örn: 1234)
node external-monitor.js --pid=1234 --duration=60 --interval=1000
```

## Test Akışı

Test şu adımları izler:

1. **Admin Giriş İşlemi**: Test başlangıcında, belirtilen admin bilgileriyle sisteme giriş yapılır ve bir access token alınır.
2. **Admin Kayıt İşlemi**: Alınan token kullanılarak toplam 150 adet rastgele admin kaydı oluşturulur.

## Test Yapılandırması

`admin-register-test.js` dosyası aşağıdaki test senaryosunu içerir:

- Toplam 150 admin kayıt isteği gönderir
- İstekler, belirli bir hızda ve gruplar halinde gönderilir:
  - 10 saniyede 10 RPS'ye (saniyede istek) çıkar
  - 20 saniyede 15 RPS'ye çıkar
  - 10 saniyede 0'a düşer
- Her istek için rastgele admin verileri oluşturulur
- Başarı kriteri:
  - İsteklerin %95'i 3 saniyeden kısa sürmeli
  - %90 başarı oranı hedeflenir
  - %10'dan az hata oranı

## Oluşturulan Admin Verileri

Her test isteğinde aşağıdaki yapıda rastgele admin verileri oluşturulur:

```javascript
{
  name: "TestXxxxx",
  surname: "UserYyyyy",
  email: "testxxxxx.useryyyy@coffy.test",
  password: "PassZzzzzzzz123!",
  phone: "+905512345678",
  role: 0-3, // 0: STORE_WORKER, 1: STORE_ADMIN, 2: DISTRICT_ADMIN, 3: CITY_ADMIN
  location: {
    city: "Istanbul", // Rastgele bir şehir
    region: "Marmara", // Rastgele bir bölge
    district: "Kadıköy", // Rastgele bir ilçe
    storeId: "store-xxxxxxxx" // Rastgele bir mağaza ID'si
  }
}
```

## RAM İzleme Aracı

`external-monitor.js` dosyası, test sırasında Admin Auth servisinin veya belirtilen bir process'in RAM kullanımını izler:

- Belirli bir PID veya process adına göre bellek kullanımını takip eder
- Sistem belleği kullanımını ölçer
- Belirtilen süre boyunca belirli aralıklarla ölçüm yapar
- JSON formatında detaylı rapor oluşturur

### RAM İzleme Aracı Parametreleri

```bash
node external-monitor.js [--pid=1234] [--name=node] [--duration=60] [--interval=1000] [--output=ram-usage.json]
```

- `--pid`: İzlenecek process ID (belirtilmezse --name kullanılır)
- `--name`: İzlenecek process adı (pid belirtilmezse kullanılır)
- `--duration`: İzleme süresi (saniye)
- `--interval`: Örnekleme aralığı (milisaniye)
- `--output`: Çıktı dosyası adı

## Çıktılar

Test tamamlandığında aşağıdaki çıktılar oluşturulur:

1. **k6 Test Sonuçları**:
   - Konsol çıktısı: Test sonuçlarının özeti
   - `admin-register-load-test-summary.json`: JSON formatında detaylı sonuçlar
   - `admin-register-load-test-summary.html`: Görsel olarak zengin, detaylı HTML raporu

2. **RAM İzleme Sonuçları**:
   - `ram-usage-[tarih-saat].json`: RAM kullanım ölçümleri ve özet istatistikler

HTML raporu aşağıdaki metrikleri içerir:

- Toplam test süresi
- Saniyede ortalama istek sayısı
- Başarı oranı
- Giriş işlemi süresi
- Yanıt süreleri (ortalama, medyan, minimum, maksimum, 90., 95. ve 99. yüzdelikler)
- RAM kullanımı (ortalama, minimum, maksimum)
- HTTP durum kodları dağılımı
- Başarılı ve başarısız istek sayıları

## Metriklerin Açıklaması

- **Yanıt Süresi**: API'nin bir isteği işlemesi ve yanıt vermesi için geçen süre (milisaniye cinsinden)
- **RPS (Requests Per Second)**: Saniyede işlenen istek sayısı
- **Başarı Oranı**: Başarılı isteklerin toplam isteklere oranı
- **Giriş Süresi**: Admin giriş işleminin tamamlanması için geçen süre (milisaniye cinsinden)
- **RAM Kullanımı**: 
  - **RSS (Resident Set Size)**: Process'in fiziksel bellek kullanımı (MB)
  - **Heap**: Process'in heap bellek kullanımı (MB)
  - **Sistem Belleği**: Tüm sistemin bellek kullanım oranı (%)

## Test Sonuçlarını Yorumlama

- **Yüksek Yanıt Süreleri**: 500 ms'den yüksek ortalama yanıt süreleri, API'nin optimize edilmesi gerektiğini gösterebilir
- **Düşük Başarı Oranı**: %90'ın altındaki başarı oranları, sistemde hata veya kapasite sorunları olduğunu gösterebilir
- **Yüksek RAM Kullanımı**: 
  - Sürekli artan RAM kullanımı, bellek sızıntısı olabileceğini gösterir
  - Yüksek anlık bellek kullanımı, bellek optimizasyonu gerektiğini gösterebilir

## Notlar

- Test öncesinde veritabanının durumunu kontrol edin, test sonrası temizlik gerekebilir
- Üretim ortamında test yapmadan önce, test ortamında kapsamlı testler yapın
- RAM izleme aracı, Windows'ta PowerShell komutlarını kullanır, Linux/macOS'ta farklı komutlar kullanılır 
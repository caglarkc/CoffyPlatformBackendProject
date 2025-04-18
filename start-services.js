const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🚀 Mikroservis Yönetim Aracı");
console.log("----------------------------");

// Yapılandırma dosyasını oku
const configPath = path.join(__dirname, 'service-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Servisler klasörünün tam yolu
const servicesPath = path.join(__dirname, 'services');

// Aktif edilecek servisleri belirle
const activeServices = Object.entries(config)
    .filter(([serviceName, shouldRun]) => shouldRun && serviceName !== 'gateway')
    .map(([serviceName]) => ({
        name: serviceName,
        path: path.join(servicesPath, serviceName)
    }));

// Gateway aktif mi kontrol et
const isGatewayActive = config.gateway === true;

if (activeServices.length === 0 && !isGatewayActive) {
    console.log("❌ Çalıştırılacak servis bulunamadı.");
    process.exit(0);
}

// Her servisin package.json kontrolü
activeServices.forEach(service => {
    const packageJsonPath = path.join(service.path, 'package.json');
    
    // Servis klasörü ve package.json kontrolü
    if (!fs.existsSync(service.path)) {
        console.error(`❌ ${service.name} servisi bulunamadı: ${service.path}`);
        process.exit(1);
    }
    
    if (!fs.existsSync(packageJsonPath)) {
        console.error(`❌ ${service.name} servisinde package.json bulunamadı`);
        process.exit(1);
    }
    
    // package.json içinde dev script kontrolü
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    if (!packageJson.scripts || !packageJson.scripts.dev) {
        console.error(`❌ ${service.name} servisinde "dev" script bulunamadı`);
        process.exit(1);
    }
});

// Aktif servisleri göster
console.log("✅ Başlatılacak servisler:");
activeServices.forEach(service => {
    console.log(`   - ${service.name}`);
});

// Gateway durumunu göster
if (isGatewayActive) {
    console.log(`   - gateway (API Gateway)`);
}

// Pasif servisleri göster
const inactiveServices = Object.entries(config)
    .filter(([serviceName, shouldRun]) => !shouldRun && serviceName !== 'gateway')
    .map(([serviceName]) => serviceName);

if (inactiveServices.length > 0) {
    console.log("\n⏸️  Devre dışı servisler:");
    inactiveServices.forEach(serviceName => {
        console.log(`   - ${serviceName}`);
    });
}

console.log("\n🔄 Servisler başlatılıyor...");

// Concurrently'nin command dizileri
const commands = activeServices.map(service => {
    // Windows PowerShell için uyumlu hale getir
    return `"cd .\\services\\${service.name} && npm run dev"`;
});

// Gateway ekliyoruz
if (isGatewayActive) {
    commands.push(`"cd .\\gateway && npm run dev"`);
}

try {
    // Windows PowerShell için uyumlu tek bir concurrently komutu
    const serviceNames = [...activeServices.map(s => s.name), ...(isGatewayActive ? ['gateway'] : [])];
    const concurrentlyCommand = `npx concurrently -k -p "[{name}]" -n "${serviceNames.join(',')}" -c "blue.bold,green.bold,yellow.bold,magenta.bold,cyan.bold,red.bold" ${commands.join(' ')}`;
    
    // Doğrudan execSync kullan, shell'e ilk yüklendiğinde varsa daha iyi çalışır
    execSync(concurrentlyCommand, {
        stdio: 'inherit', 
        shell: true
    });
} catch (error) {
    console.error("❌ Servisler çalıştırılırken bir hata oluştu:", error.message);
}
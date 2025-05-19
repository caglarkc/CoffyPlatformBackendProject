/**
 * Admin Auth Service - RAM Kullanımı İzleme Aracı
 * 
 * Bu script, yük testi sırasında Admin Auth servisinin RAM kullanımını izler.
 * k6 testi ile birlikte çalıştırılmalıdır.
 * 
 * Kullanım:
 * node external-monitor.js --pid=1234 --duration=60 --interval=1000 --output=ram-usage.json
 */

const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Komut satırı argümanlarını parse et
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  if (key.startsWith('--')) {
    acc[key.slice(2)] = value;
  }
  return acc;
}, {});

// Varsayılan değerler
const options = {
  pid: args.pid || null,          // İzlenecek process ID
  processName: args.name || 'node', // İzlenecek process adı
  duration: parseInt(args.duration || 60),  // İzleme süresi (saniye)
  interval: parseInt(args.interval || 1000), // Örnekleme aralığı (ms)
  output: args.output || 'ram-usage.json'   // Çıktı dosyası
};

console.log('RAM Kullanımı İzleme Aracı');
console.log('---------------------------');
console.log(`İzleme süresi: ${options.duration} saniye`);
console.log(`Örnekleme aralığı: ${options.interval} ms`);
console.log(`Çıktı dosyası: ${options.output}`);

// Toplam sistem belleği
const totalMemoryMB = os.totalmem() / 1024 / 1024;
console.log(`Toplam sistem belleği: ${totalMemoryMB.toFixed(2)} MB`);

// Belirli bir process'in RAM kullanımını ölç (Windows için)
function getProcessMemoryUsage(pid) {
  return new Promise((resolve, reject) => {
    if (!pid) {
      resolve({ pid: null, rss: 0, heapTotal: 0, heapUsed: 0 });
      return;
    }
    
    // Windows'ta PowerShell ile process bellek kullanımını sorgula
    const command = `powershell "Get-Process -Id ${pid} | Select-Object -Property WorkingSet, PM | ConvertTo-Json"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Process izleme hatası: ${error.message}`);
        resolve({ pid, rss: 0, heapTotal: 0, heapUsed: 0 });
        return;
      }
      
      try {
        const data = JSON.parse(stdout);
        // WorkingSet: Fiziksel bellek kullanımı (byte)
        // PM: Sayfalama belleği kullanımı (byte)
        const rss = data.WorkingSet / 1024 / 1024; // MB'a çevir
        const heapTotal = data.PM / 1024 / 1024;   // MB'a çevir
        
        resolve({
          pid,
          rss,           // Resident Set Size (fiziksel bellek)
          heapTotal,     // Toplam heap boyutu
          heapUsed: 0    // Windows'ta doğrudan erişilemiyor
        });
      } catch (e) {
        console.error(`JSON parse hatası: ${e.message}`);
        resolve({ pid, rss: 0, heapTotal: 0, heapUsed: 0 });
      }
    });
  });
}

// Process adına göre PID bul (Windows için)
function findProcessIdByName(name) {
  return new Promise((resolve, reject) => {
    const command = `powershell "Get-Process ${name} | Select-Object -Property Id | ConvertTo-Json"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Process bulunamadı: ${error.message}`);
        resolve(null);
        return;
      }
      
      try {
        const data = JSON.parse(stdout);
        // Birden fazla process varsa ilkini al
        const processes = Array.isArray(data) ? data : [data];
        
        if (processes.length > 0) {
          resolve(processes[0].Id);
        } else {
          resolve(null);
        }
      } catch (e) {
        console.error(`JSON parse hatası: ${e.message}`);
        resolve(null);
      }
    });
  });
}

// İzleme fonksiyonu
async function monitorMemory() {
  let pid = options.pid;
  
  // PID belirtilmemişse process adına göre bul
  if (!pid && options.processName) {
    console.log(`"${options.processName}" adlı process aranıyor...`);
    pid = await findProcessIdByName(options.processName);
    
    if (pid) {
      console.log(`Process bulundu: PID ${pid}`);
    } else {
      console.log(`"${options.processName}" adlı process bulunamadı. Sistem belleği izlenecek.`);
    }
  }
  
  const startTime = Date.now();
  const endTime = startTime + (options.duration * 1000);
  
  const memoryUsage = [];
  let maxRSS = 0;
  let maxHeapTotal = 0;
  
  console.log('\nİzleme başlatıldı...');
  console.log('Zaman\t\tRSS (MB)\tHeap (MB)\tSistem (MB)\tKullanım %');
  
  // İzleme döngüsü
  const interval = setInterval(async () => {
    const currentTime = Date.now();
    
    // Süre doldu mu kontrol et
    if (currentTime > endTime) {
      clearInterval(interval);
      await saveResults(memoryUsage, maxRSS, maxHeapTotal);
      return;
    }
    
    // Process bellek kullanımını ölç
    const processMemory = await getProcessMemoryUsage(pid);
    
    // Sistem bellek kullanımını ölç
    const freeMemoryMB = os.freemem() / 1024 / 1024;
    const usedMemoryMB = totalMemoryMB - freeMemoryMB;
    const usedMemoryPercentage = (usedMemoryMB / totalMemoryMB) * 100;
    
    // Maksimum değerleri güncelle
    maxRSS = Math.max(maxRSS, processMemory.rss);
    maxHeapTotal = Math.max(maxHeapTotal, processMemory.heapTotal);
    
    // Zaman damgası
    const timestamp = new Date(currentTime).toISOString();
    const elapsedSeconds = ((currentTime - startTime) / 1000).toFixed(1);
    
    // Konsola yazdır
    console.log(
      `${elapsedSeconds}s\t${processMemory.rss.toFixed(2)}\t\t${processMemory.heapTotal.toFixed(2)}\t\t${usedMemoryMB.toFixed(2)}\t\t${usedMemoryPercentage.toFixed(2)}%`
    );
    
    // Sonuçları kaydet
    memoryUsage.push({
      timestamp,
      elapsedMs: currentTime - startTime,
      processRSS: processMemory.rss,
      processHeapTotal: processMemory.heapTotal,
      systemUsed: usedMemoryMB,
      systemUsedPercentage: usedMemoryPercentage
    });
    
  }, options.interval);
}

// Sonuçları dosyaya kaydet
async function saveResults(memoryUsage, maxRSS, maxHeapTotal) {
  const results = {
    testInfo: {
      startTime: new Date(memoryUsage[0].timestamp).toISOString(),
      endTime: new Date(memoryUsage[memoryUsage.length - 1].timestamp).toISOString(),
      duration: options.duration,
      samplingInterval: options.interval,
      pid: options.pid,
      processName: options.processName
    },
    systemInfo: {
      platform: os.platform(),
      release: os.release(),
      totalMemoryMB: totalMemoryMB,
      cpus: os.cpus().length
    },
    summary: {
      samples: memoryUsage.length,
      maxProcessRSS: maxRSS,
      maxProcessHeapTotal: maxHeapTotal,
      avgProcessRSS: memoryUsage.reduce((sum, item) => sum + item.processRSS, 0) / memoryUsage.length,
      avgSystemUsedPercentage: memoryUsage.reduce((sum, item) => sum + item.systemUsedPercentage, 0) / memoryUsage.length
    },
    samples: memoryUsage
  };
  
  // Sonuçları dosyaya yaz
  fs.writeFileSync(options.output, JSON.stringify(results, null, 2));
  
  console.log('\nİzleme tamamlandı!');
  console.log(`Sonuçlar ${options.output} dosyasına kaydedildi.`);
  console.log('\nÖzet:');
  console.log(`Toplam örnek sayısı: ${results.summary.samples}`);
  console.log(`Maksimum process RSS: ${results.summary.maxProcessRSS.toFixed(2)} MB`);
  console.log(`Maksimum process Heap: ${results.summary.maxProcessHeapTotal.toFixed(2)} MB`);
  console.log(`Ortalama process RSS: ${results.summary.avgProcessRSS.toFixed(2)} MB`);
  console.log(`Ortalama sistem bellek kullanımı: ${results.summary.avgSystemUsedPercentage.toFixed(2)}%`);
}

// Ana fonksiyon
monitorMemory().catch(error => {
  console.error('İzleme hatası:', error);
  process.exit(1);
}); 
#!/bin/bash
# Admin Register Yük Testi ve RAM İzleme Aracı
# Bu script, k6 yük testini ve RAM izleme aracını aynı anda çalıştırır

echo "=== Admin Register Yuk Testi ve RAM Izleme Araci ==="
echo

# Admin Auth servisinin PID'sini bul
echo "Admin Auth servisinin PID'i araniyor..."
ADMIN_AUTH_PID=$(ps aux | grep "node" | grep "admin-auth-service" | grep -v "grep" | awk '{print $2}' | head -n 1)

if [ -n "$ADMIN_AUTH_PID" ]; then
    echo "Admin Auth servisi PID: $ADMIN_AUTH_PID"
else
    echo "Admin Auth servisi bulunamadi. Sistem RAM'i izlenecek."
fi

# Test süresini belirle (saniye)
TEST_DURATION=60

# Tarih ve saat bilgisini al
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# RAM izleme aracını başlat (arka planda)
echo "RAM izleme araci baslatiliyor..."
if [ -n "$ADMIN_AUTH_PID" ]; then
    node external-monitor.js --pid=$ADMIN_AUTH_PID --duration=$TEST_DURATION --interval=1000 --output=ram-usage-$TIMESTAMP.json &
else
    node external-monitor.js --name=node --duration=$TEST_DURATION --interval=1000 --output=ram-usage-$TIMESTAMP.json &
fi

# RAM izleme aracının PID'sini kaydet
MONITOR_PID=$!

# k6 testini başlat
echo
echo "k6 yuk testi baslatiliyor..."
k6 run admin-register-test.js

# RAM izleme aracı hala çalışıyorsa bekle
if ps -p $MONITOR_PID > /dev/null; then
    echo "RAM izleme araci hala calisiyor, tamamlanmasi bekleniyor..."
    wait $MONITOR_PID
fi

echo
echo "Test tamamlandi! Sonuclari kontrol edin."
echo "RAM kullanim raporu: ram-usage-$TIMESTAMP.json"
echo "Yuk testi raporu: admin-register-load-test-summary.html"
echo

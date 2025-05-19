@echo off
REM Admin Register Yük Testi ve RAM İzleme Aracı
REM Bu script, k6 yük testini ve RAM izleme aracını aynı anda çalıştırır

echo === Admin Register Yuk Testi ve RAM Izleme Araci ===
echo.

REM Admin Auth servisinin PID'sini bul
echo Admin Auth servisinin PID'i araniyor...
powershell "Get-Process -Name node | Where-Object {$_.CommandLine -like '*admin-auth-service*'} | Select-Object -Property Id | ConvertTo-Json" > temp_pid.txt
set /p PID_DATA=<temp_pid.txt
del temp_pid.txt

REM PID'i ayıkla (JSON formatından)
echo %PID_DATA% | findstr /C:"Id" > nul
if %errorlevel% equ 0 (
    for /f "tokens=2 delims=:, " %%a in ('echo %PID_DATA% ^| findstr /C:"Id"') do (
        set ADMIN_AUTH_PID=%%a
    )
    echo Admin Auth servisi PID: %ADMIN_AUTH_PID%
) else (
    echo Admin Auth servisi bulunamadi. Sistem RAM'i izlenecek.
    set ADMIN_AUTH_PID=
)

REM Test süresini belirle (saniye)
set TEST_DURATION=60

REM RAM izleme aracını başlat (arka planda)
echo RAM izleme araci baslatiliyor...
if defined ADMIN_AUTH_PID (
    start "RAM Monitor" cmd /c "node external-monitor.js --pid=%ADMIN_AUTH_PID% --duration=%TEST_DURATION% --interval=1000 --output=ram-usage-%date:~-4,4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%%time:~6,2%.json"
) else (
    start "RAM Monitor" cmd /c "node external-monitor.js --name=node --duration=%TEST_DURATION% --interval=1000 --output=ram-usage-%date:~-4,4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%%time:~6,2%.json"
)

REM k6 testini başlat
echo.
echo k6 yuk testi baslatiliyor...
k6 run admin-register-test.js

echo.
echo Test tamamlandi! Sonuclari kontrol edin.
echo RAM kullanim raporu: ram-usage-*.json
echo Yuk testi raporu: admin-register-load-test-summary.html
echo. 
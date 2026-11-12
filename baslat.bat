@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  echo Ilk calistirma: gerekli paketler kuruluyor...
  call npm install
)
start "" http://localhost:8080/panel
node server.js
pause

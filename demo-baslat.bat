@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules call npm install
start "" http://localhost:8080/
node server.js --demo
pause

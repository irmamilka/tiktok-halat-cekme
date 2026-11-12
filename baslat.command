#!/bin/bash
# Mac: çift tıklayarak oyunu TikTok yayınına bağlı başlatır
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js bulunamadı. Lütfen https://nodejs.org adresinden LTS sürümünü kurup tekrar dene."
  read -p "Kapatmak için Enter'a bas..."; exit 1
fi
if [ ! -d node_modules ]; then
  echo "İlk çalıştırma: gerekli paketler kuruluyor..."
  npm install || { read -p "Kurulum başarısız. Kapatmak için Enter'a bas..."; exit 1; }
fi
(sleep 2; open "http://localhost:8080/panel") &
node server.js
read -p "Oyun durdu. Kapatmak için Enter'a bas..."

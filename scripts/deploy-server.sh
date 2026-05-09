#!/bin/bash
# Copy to server as /root/deploy.sh (Terence VPS).
# After git pull, ensure Laravel storage is writable by www-data (profile photos, cache, logs).
set -e

echo "[1/5] GitHub'dan cekiliyor..."
cd /var/www/terence
git pull origin main

echo "[2/5] Laravel storage izinleri..."
BACKEND="/var/www/terence/nazliyavuz-platform/backend"
if [ -d "$BACKEND" ]; then
  mkdir -p "$BACKEND/storage/app/public/profile-photos"
  mkdir -p "$BACKEND/storage/framework/cache/data"
  mkdir -p "$BACKEND/storage/framework/sessions"
  mkdir -p "$BACKEND/storage/framework/views"
  mkdir -p "$BACKEND/storage/logs"
  chown -R www-data:www-data "$BACKEND/storage" "$BACKEND/bootstrap/cache"
  chmod -R ug+rwx "$BACKEND/storage" "$BACKEND/bootstrap/cache"
  cd "$BACKEND"
  # storage:link may fail if symlink already exists; do not abort deploy
  set +e
  sudo -u www-data php artisan storage:link >/dev/null 2>&1
  set -e
fi

echo "[3/5] npm install + build..."
cd /var/www/terence/web
npm install --legacy-peer-deps
npm run build

echo "[4/5] PM2 restart..."
pm2 restart terence-web

echo "[5/5] DEPLOY TAMAMLANDI"

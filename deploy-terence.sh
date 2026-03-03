#!/bin/bash
# Terence Egitim - Full Deployment Script (includes PHP PPA, clean .env)
# Server: 31.210.53.84 | Domain: terenceegitim.com

set -e
export DEBIAN_FRONTEND=noninteractive

DB_PASS="Terence2025!Secure"

echo "=== Step 1: System Update ==="
apt update && apt upgrade -y

echo "=== Step 2: PHP PPA + Packages ==="
apt install -y software-properties-common
add-apt-repository -y ppa:ondrej/php
apt update
apt install -y git nginx mysql-server php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath unzip curl

echo "=== Step 3: Composer ==="
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

echo "=== Step 4: Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "=== Step 5: MySQL ==="
mysql -e "CREATE DATABASE IF NOT EXISTS terence_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
mysql -e "DROP USER IF EXISTS 'terence_user'@'localhost';"
mysql -e "CREATE USER 'terence_user'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON terence_db.* TO 'terence_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "=== Step 6: Clone ==="
mkdir -p /var/www && cd /var/www
[ -d terence ] && (cd terence && git pull) || git clone https://github.com/CanAhmet12/terence.git

echo "=== Step 7: Laravel (clean .env from valid vars only) ==="
cd /var/www/terence/nazliyavuz-platform/backend
grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env.example 2>/dev/null | grep -vE '^[0-9]|^cd |^php |^mv ' > .env
sed -i 's|APP_ENV=.*|APP_ENV=production|' .env
sed -i 's|APP_DEBUG=.*|APP_DEBUG=false|' .env
sed -i 's|APP_URL=.*|APP_URL=https://terenceegitim.com|' .env
sed -i 's|DB_CONNECTION=.*|DB_CONNECTION=mysql|' .env
grep -q DB_HOST .env || echo "DB_HOST=127.0.0.1" >> .env
grep -q DB_PORT .env || echo "DB_PORT=3306" >> .env
grep -q DB_DATABASE .env || echo "DB_DATABASE=terence_db" >> .env
grep -q DB_USERNAME .env || echo "DB_USERNAME=terence_user" >> .env
grep -q DB_PASSWORD .env || echo "DB_PASSWORD=$DB_PASS" >> .env
echo "FRONTEND_URL=https://terenceegitim.com" >> .env
composer install --no-dev --optimize-autoloader
php artisan key:generate --force
php artisan jwt:secret --force 2>/dev/null || true
php artisan migrate --force
php artisan storage:link 2>/dev/null || true
php artisan config:cache
chown -R www-data:www-data storage bootstrap/cache

echo "=== Step 8: Next.js ==="
cd /var/www/terence/web
echo "NEXT_PUBLIC_API_URL=https://terenceegitim.com/api/v1" > .env.local
npm ci && npm run build

echo "=== Step 9: PM2 ==="
npm install -g pm2
pm2 delete terence-web 2>/dev/null || true
cd /var/www/terence/web && pm2 start npm --name terence-web -- start
pm2 save && pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "=== Step 10: Nginx (use nginx-terence.conf) ==="
ln -sf /etc/nginx/sites-available/terence /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== Step 11: SSL (run after DNS points to server) ==="
apt install -y certbot python3-certbot-nginx 2>/dev/null || true
certbot --nginx -d terenceegitim.com -d www.terenceegitim.com --non-interactive --agree-tos -m admin@terenceegitim.com 2>/dev/null || echo "SSL: configure DNS first"

echo "=== Step 12: Crontab ==="
(crontab -l 2>/dev/null | grep -v "artisan schedule"); echo "* * * * * cd /var/www/terence/nazliyavuz-platform/backend && php artisan schedule:run >> /dev/null 2>&1" | crontab -

echo "=== DONE ==="
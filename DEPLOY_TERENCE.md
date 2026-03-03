# Terence Eğitim – Sunucu Kurulum Rehberi

**Sunucu:** 31.210.53.84 | **Domain:** terenceegitim.com | **OS:** Ubuntu 24.04

---

## 1. GitHub Push (Sizin Yapmanız Gereken)

Proje commit edildi. Push için PowerShell veya CMD açıp:

```powershell
cd "c:\Users\AHMET CAN\Desktop\nazliyavuz - Kopya - Kopya (3)"
git push terence main
```

GitHub giriş isteyebilir; bilgilerinizle giriş yapın.

---

## 2. SSH ile Sunucuya Bağlan

```bash
ssh root@31.210.53.84
# Şifre: 2EhbrhzP
```

---

## 3. Sunucu Kurulum Komutları

Aşağıdaki komutları sunucuda **sırayla** çalıştırın:

### 3.1 Sistem Güncellemesi ve Temel Araçlar

```bash
apt update && apt upgrade -y
apt install -y curl git nginx mysql-server php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath unzip
```

### 3.2 Composer Kurulumu

```bash
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
```

### 3.3 Node.js 20 Kurulumu

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 3.4 MySQL Ayarları

```bash
mysql -e "CREATE DATABASE terence_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER 'terence_user'@'localhost' IDENTIFIED BY 'GÜÇLÜ_ŞİFRE_BURAYA';"
mysql -e "GRANT ALL ON terence_db.* TO 'terence_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
```

**ÖNEMLİ:** `GÜÇLÜ_ŞİFRE_BURAYA` yerine güçlü bir şifre yazın.

### 3.5 Proje Klasörü ve Git Clone

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/CanAhmet12/terence.git
cd terence
```

### 3.6 Laravel Backend Kurulumu

```bash
cd /var/www/terence/nazliyavuz-platform/backend
cp .env.example .env
nano .env
```

**.env** içinde şu değişiklikleri yapın:
- `APP_URL=https://terenceegitim.com`
- `DB_DATABASE=terence_db`
- `DB_USERNAME=terence_user`
- `DB_PASSWORD=GÜÇLÜ_ŞİFRE_BURAYA` (yukarıda belirlediğiniz şifre)

Sonra:

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan jwt:secret
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

### 3.7 Next.js Web Kurulumu

```bash
cd /var/www/terence/web
npm ci
```

**.env.local** oluşturun:

```bash
echo "NEXT_PUBLIC_API_URL=https://terenceegitim.com/api/v1" > .env.local
```

Build:

```bash
npm run build
```

### 3.8 PM2 ile Next.js Başlatma

```bash
npm install -g pm2
cd /var/www/terence/web
pm2 start npm --name "terence-web" -- start
pm2 save
pm2 startup
```

### 3.9 Nginx Yapılandırması

```bash
nano /etc/nginx/sites-available/terence
```

Aşağıdaki içeriği yapıştırın:

```nginx
server {
    listen 80;
    server_name terenceegitim.com www.terenceegitim.com;

    # Laravel API - /api/v1/* istekleri
    location ^~ /api {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME /var/www/terence/nazliyavuz-platform/backend/public/index.php;
        fastcgi_param SCRIPT_NAME /index.php;
        fastcgi_param REQUEST_URI $request_uri;
        include fastcgi_params;
    }

    # Next.js - diğer tüm istekler
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Not:** Laravel route'ları `prefix('v1')` kullanıyor, yani API adresi `https://terenceegitim.com/api/v1/...` olacak.

```bash
ln -sf /etc/nginx/sites-available/terence /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 3.10 SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d terenceegitim.com -d www.terenceegitim.com
```

### 3.11 Laravel Scheduler (Cron)

```bash
crontab -e
```

Şu satırı ekleyin:

```
* * * * * cd /var/www/terence/nazliyavuz-platform/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## 4. Özet Kontrol Listesi

- [ ] GitHub'a push edildi
- [ ] SSH ile sunucuya bağlanıldı
- [ ] PHP, Composer, Node, MySQL kuruldu
- [ ] Git clone yapıldı
- [ ] Laravel .env ve migrations tamamlandı
- [ ] Next.js build alındı
- [ ] Nginx yapılandırıldı
- [ ] SSL sertifikası alındı
- [ ] Cron eklendi

---

## 5. Önemli Notlar

- **API adresi:** `https://terenceegitim.com/api/v1`
- **Next.js port:** 3000 (PM2 ile çalışır)
- **CORS:** Laravel `.env` içinde `FRONTEND_URL=https://terenceegitim.com` olarak ayarlayın

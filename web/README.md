# TERENCE EĞİTİM - Web Platformu

Akıllı öğrenme platformu web sitesi. LGS, TYT, AYT, KPSS hazırlık için hedef motoru, kişiye özel çalışma planı ve 1M+ soru bankası.

## Teknoloji

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Lucide React** (ikonlar)

## Kurulum

```bash
cd web
npm install
npm run dev
```

Tarayıcıda: **http://localhost:3000**

## Hızlı Başlangıç (Demo)

1. Ana sayfada **Giriş Yap** tıklayın
2. **Demo Öğrenci**, **Demo Öğretmen** veya **Demo Admin** ile giriş yapın (API gerekmez)
3. Panelleri keşfedin

## API Bağlantısı (Laravel Backend)

`.env.local` oluşturup ekleyin:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Laravel backend çalışıyorsa gerçek giriş/kayıt çalışır.

## Sayfa Yapısı

### Genel
- `/` - Ana sayfa (landing)
- `/giris` - Giriş (Demo butonları ile API'siz test)
- `/kayit` - Kayıt (Öğrenci/Öğretmen)
- `/sifre-sifirlama` - Şifre sıfırlama
- `/iletisim`, `/gizlilik`, `/kullanim-kosullari`

### Öğrenci Paneli (`/ogrenci`) - Giriş gerekli
- Ana Panel, Hedef & Net, Günlük Plan
- Derslerim, Denemeler, Soru Bankası
- Video & PDF, Performans, Rozetler

### Öğretmen Paneli (`/ogretmen`) - Giriş gerekli
- Ana Panel, Derslerim, Sınıflarım
- Ödev & Test, Analiz Merkezi, Mesaj & Duyuru

### Veli Paneli (`/veli`) - Giriş gerekli
- Çocuklarım, Raporlar, Bildirimler

### Admin Paneli (`/admin`) - Admin rolü gerekli
- Dashboard, Kullanıcılar, İçerik, Soru Havuzu, Raporlar, Ayarlar

## Özellikler

- ✅ Auth (login, register, forgot password) - Laravel API ile
- ✅ Demo mod (API olmadan tüm paneller test edilebilir)
- ✅ Rol bazlı korumalı rotalar (student, teacher, admin)
- ✅ Profesyonel eğitim sitesi tasarımı
- ✅ Responsive

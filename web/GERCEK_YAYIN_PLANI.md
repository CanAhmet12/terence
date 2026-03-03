# TERENCE EĞİTİM — GERÇEK YAYINA HAZIRLIK PLANI
## `GERCEK_YAYIN_PLANI.md`

> Bu dosya, projeyi tamamen canlı ve gerçek veritabanı bağlantılı hale getirmek için yapılacak tüm işlerin öncelik sırasına göre planlanmış listesidir.  
> **Hedef:** Mock veri olmayan, gerçek kullanıcı kaydı ve girişi, gerçek içerik, gerçek ödeme, gerçek bildirim sistemi olan tam işlevsel bir eğitim platformu.

---

## MEVCUT DURUM ÖZETİ

| Bileşen | Durum |
|---------|--------|
| Sunucu (31.210.53.84) | Aktif — Ubuntu 24.04 |
| Domain | terenceegitim.com — HTTPS aktif |
| Laravel Backend | Kurulu — tüm migration'lar çalıştı |
| Next.js Frontend | Kurulu — 41 sayfa, PM2 ile çalışıyor |
| Giriş/Kayıt sayfası | Var ama backend bağlantısı kısmen çalışıyor |
| Dashboard sayfaları | Tamamı mock veri gösteriyor |
| Ödeme sistemi | Backend controller var, frontend yok |
| Bildirimler | Backend altyapısı var, SMS/mail ayarı yok |
| Soru/içerik sistemi | Tamamen mock veri |

---

## FAZ 1 — KİMLİK DOĞRULAMA VE OTURUM (1-2 Gün)
**Bu olmadan hiçbir şey çalışmaz.**

### 1.1 Giriş — Gerçek API bağlantısı
- [x] `api.login()` → Laravel `/auth/login` → **çalışıyor**
- [ ] Giriş başarısız mesajları Türkçe gösterilecek
- [ ] Token `localStorage`'a kaydediliyor ama sunucu tarafı doğrulama eksik
- [ ] Sayfa yenilenince kullanıcı çıkarılıyor — `getProfile` ile token kontrolü eklenecek

**Yapılacak:**
```typescript
// web/src/lib/auth-context.tsx içinde — sayfa yüklenince token doğrula
useEffect(() => {
  const token = localStorage.getItem("terence_token");
  if (token) {
    api.getProfile(token).then(user => setUser(user)).catch(() => logout());
  }
}, []);
```

### 1.2 Kayıt — E-posta doğrulama
- [ ] Kayıt sonrası `/auth/verify-email` ile 6 haneli kod doğrulama sayfası
- [ ] Doğrulama kodu ekranı: `web/src/app/dogrulama/page.tsx` (yeni oluşturulacak)
- [ ] Laravel `MAIL_*` ayarları sunucuda yapılandırılacak

**Backend `.env` güncellemesi (sunucu):**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=terence@gmail.com
MAIL_PASSWORD=APP_SIFRE_BURAYA
MAIL_FROM_ADDRESS=noreply@terenceegitim.com
MAIL_FROM_NAME="Terence Eğitim"
```

### 1.3 Şifre Sıfırlama
- [ ] `web/src/app/sifre-sifirlama/page.tsx` → `api.forgotPassword()` → çalışır hale getirilecek
- [ ] Backend `reset-password` endpoint'i test edilecek

### 1.4 Google ile Giriş
- [ ] Google OAuth Client ID alınacak (console.developers.google.com)
- [ ] Backend'e `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` eklenecek
- [ ] Frontend'de Google butonuna `SocialAuthController::googleAuth` bağlanacak

---

## FAZ 2 — KULLANICI PROFİLİ VE DASHBOARDLAR (2-3 Gün)
**Gerçek kullanıcı verisi gösterilecek.**

### 2.1 Profil Sayfası — Gerçek API
**Endpoint:** `GET /api/v1/user` | `PUT /api/v1/user`

- [ ] `web/src/app/profil/page.tsx` mock veriden kurtarılacak
- [ ] Fotoğraf yükleme: `POST /api/v1/files/upload-shared` bağlanacak
- [ ] Şifre değiştirme: `POST /api/v1/user/change-password` bağlanacak
- [ ] Bildirim tercihleri: `PUT /api/v1/user/notification-preferences`

### 2.2 Öğrenci Dashboard — Gerçek Veri
**Mevcut:** Tüm veriler mock. **Hedef:** Gerçek API'den.

| Alan | API Endpoint |
|------|-------------|
| Profil bilgisi | `GET /user` |
| Günlük görevler | `GET /assignments` (yeni API lazım) |
| Hedef bilgisi | `GET /user` içindeki `goal` alanı |
| Bildirimler | `GET /notifications` |
| Performans istatistikleri | `GET /user/statistics` |

**Yapılacak:**
- [ ] `web/src/app/ogrenci/page.tsx` — `useEffect` ile `api.getProfile` ve `api.getNotifications` çağrılacak
- [ ] Hedef kaydetme formu `PUT /user` ile bağlanacak
- [ ] Çalışma süresi takibi için `POST /user/activity` endpoint'i kullanılacak

### 2.3 Öğretmen Dashboard — Gerçek Veri
| Alan | API Endpoint |
|------|-------------|
| Öğrencilerim | `GET /teacher/students` |
| Derslerim | `GET /teacher/lessons` |
| Reservasyonlar | `GET /teacher/reservations` |
| İstatistikler | `GET /teacher/statistics` |

### 2.4 Veli Dashboard
- [ ] Veli-çocuk bağlantısı: Kayıtta `child_email` ile ilişkilendirme
- [ ] Backend'de veli için özel endpoint geliştirilecek: `GET /parent/child-report`
- [ ] Veli SMS bildirimleri için Twilio entegrasyonu

---

## FAZ 3 — İÇERİK SİSTEMİ (3-5 Gün)
**Video, PDF, soru — gerçek depolama ve gösterim.**

### 3.1 Video Sistemi

#### Mevcut:
- Video URL'si mock data
- Gerçek video oynatma yok

#### Hedef Mimari:
```
Video Yükleme:
Admin/Öğretmen → /admin/icerik → Upload → AWS S3 / Cloudflare R2 → URL kaydedilir

Video İzleme:
Öğrenci → /ogrenci/video → Backend'den URL al → HTML5 Video Player
```

**Yapılacaklar:**
- [ ] Cloudflare R2 veya AWS S3 hesabı oluşturulacak (video depolama)
- [ ] Backend `FileUploadController` S3 bağlantısı yapılacak
- [ ] `web/src/app/ogrenci/video/page.tsx` — gerçek video player (HLS desteği önerilir)
- [ ] Video ilerleme kaydı: `POST /user/activity` ile `%watched` takibi
- [ ] **DRM (İleri aşama):** Mux.com veya Bunny.net video CDN

**Öneri (Uygun fiyatlı):**
```
Bunny.net Stream → aylık $1/100GB → Türkiye CDN → HLS otomatik
```

### 3.2 PDF Sistemi
- [ ] PDF yükleme: S3'e yüklenir, URL database'e kaydedilir
- [ ] `web/src/app/ogrenci/video/page.tsx` içindeki PDF indirme butonu gerçek URL'ye bağlanacak
- [ ] PDF önizleme (isteğe bağlı): `react-pdf` kütüphanesi

### 3.3 İçerik Veritabanı Yapısı
Laravel'de şu tablolar eksik — migration eklenecek:

```sql
-- Dersler (ana ders listesi)
courses: id, title, slug, class_level, exam_type, category_id, is_free, order

-- Üniteler
units: id, course_id, title, order

-- Konular  
topics: id, unit_id, title, kazanim_code, kazanim_desc, order

-- İçerikler (video/pdf/soru)
content_items: id, topic_id, type(video|pdf|quiz), title, url, duration_seconds, order, is_free, difficulty

-- Öğrenci ilerleme
student_progress: id, user_id, topic_id, status(not_started|in_progress|completed), watched_seconds, last_at
```

**Migration dosyaları oluşturulacak:**
- `create_courses_table.php`
- `create_units_table.php`  
- `create_topics_table.php`
- `create_content_items_table.php`
- `create_student_progress_table.php`

### 3.4 Soru Bankası
**Mevcut:** 3 mock soru. **Hedef:** Gerçek soru sistemi.

```sql
-- Sorular
questions: id, topic_id, question_text, question_image_url, type(classic|new_gen|paragraph), difficulty, kazanim_code

-- Şıklar
question_options: id, question_id, option_letter, option_text, is_correct

-- Öğrenci cevapları
student_answers: id, user_id, question_id, selected_option, is_correct, time_spent_seconds, exam_session_id
```

**Backend API'ler:**
- `GET /questions?topic_id=&difficulty=&kazanim_code=`
- `POST /questions/answer` — cevap kaydet, kazanım analizi yap
- `GET /questions/similar/{question_id}` — benzer soru getir

---

## FAZ 4 — SINAV VE DENEME SİSTEMİ (3-4 Gün)
**Gerçek TYT/AYT/LGS denemesi.**

### 4.1 Deneme Yapısı
```sql
exams: id, title, type(TYT|AYT|LGS|KPSS), duration_minutes, is_national, created_at

exam_sections: id, exam_id, subject, question_count

exam_sessions: id, user_id, exam_id, started_at, finished_at, score_data(JSON)
```

### 4.2 Deneme Akışı (Frontend)
1. Öğrenci `/ogrenci/deneme` → deneme listesi (API'den)
2. Denemeyi başlat → `POST /exam-sessions` → session_id alır
3. Sorular yüklenir → `GET /exam-sessions/{id}/questions`
4. Cevap ver → `POST /exam-sessions/{id}/answer`
5. Bitir → `POST /exam-sessions/{id}/finish`
6. Sonuç → kazanım bazlı analiz, Türkiye sıralaması

### 4.3 Türkiye Geneli Sıralama
- [ ] Deneme bitince `exam_sessions` tablosuna skor kaydedilir
- [ ] `GET /exams/{id}/rankings` endpoint'i — skor sıralaması döner
- [ ] Frontend'de `/ogrenci/deneme/{id}` sonuç sayfasına sıralama eklenir

---

## FAZ 5 — AKILLI ÖĞRENME MOTORU (4-5 Gün)
**Bu modül projeyi Doping'den öne taşır.**

### 5.1 Kazanım Analizi
Her cevap kaydedilirken sistem şunu yapar:

```php
// student_answers kaydedilince observer tetiklenir
class StudentAnswerObserver {
    public function created(StudentAnswer $answer) {
        // Kazanım bazlı hata oranı güncelle
        KazanimStat::updateOrCreate(
            ['user_id' => $answer->user_id, 'kazanim_code' => $answer->question->kazanim_code],
            ['wrong_count' => DB::raw('wrong_count + ' . ($answer->is_correct ? 0 : 1))]
        );
        
        // Zayıf kazanım ise tekrar planına ekle
        if (!$answer->is_correct) {
            DailyTask::addKazanimRepeat($answer->user_id, $answer->question->kazanim_code);
        }
    }
}
```

**Veritabanı:**
```sql
kazanim_stats: id, user_id, kazanim_code, total_answered, wrong_count, last_answered_at
daily_tasks: id, user_id, task_type, reference_id, reference_type, is_done, due_date
```

### 5.2 Günlük Plan Motoru
- [ ] Her gece 00:00'da cron çalışır: `php artisan plan:daily`
- [ ] Öğrencinin hedef netiyle mevcut neti karşılaştırır
- [ ] Kalan güne böler → günlük soru sayısı belirler
- [ ] Zayıf kazanımları önceliklendirir
- [ ] `daily_tasks` tablosuna yazar
- [ ] Frontend `GET /daily-tasks` ile görev listesini çeker

### 5.3 Hedef Risk Uyarısı
```php
// Haftalık cron: plan:check-risks
// Öğrenci 3 haftadır net artırmıyorsa:
if ($student->netGrowthLastWeeks(3) <= 0) {
    NotificationService::sendRiskAlert($student);
    // Veliye SMS gönder (Twilio)
    SmsService::send($parent->phone, "Çocuğunuzun net artışı durdu...");
}
```

### 5.4 Başarı Tahmin Modeli
```php
// Basit formül (daha sonra ML ile geliştirilebilir):
$tahminiNet = $mevcutNet + ($haftalikArtis * $kalanHafta);
$risk = ($tahminiNet < $hedefNet) ? 'kirmizi' : (($tahminiNet < $hedefNet * 1.1) ? 'sari' : 'yesil');
```

---

## FAZ 6 — ÖDEME SİSTEMİ (2-3 Gün)
**Gerçek para geçişi.**

### 6.1 PayTR Entegrasyonu
Backend'de `PaymentController` zaten var. Yapılandırılacak.

**Backend `.env`:**
```env
PAYTR_MERCHANT_ID=XXXXX
PAYTR_MERCHANT_KEY=XXXXX
PAYTR_MERCHANT_SALT=XXXXX
```

**Paket Fiyatları (önerilen):**
| Paket | Fiyat | İçerik |
|-------|-------|--------|
| Free | 0₺ | Her dersten 1 ünite, günlük 10 soru, 1 deneme, 7 gün plan |
| Bronze | 99₺/ay | Tüm videolar + PDF'ler |
| Plus | 199₺/ay | Denemeler + Soru Bankası |
| Pro | 349₺/ay | Canlı ders + Koçluk + Her şey |

**Frontend yapılacaklar:**
- [ ] `web/src/app/paketler/page.tsx` — paket seçim sayfası
- [ ] PayTR ödeme iFrame entegrasyonu
- [ ] Ödeme başarı/hata sayfaları
- [ ] Kullanıcı profili'ne `subscription_plan` ve `subscription_expires_at` alanları

**İçerik kilitleme:**
```typescript
// Frontend middleware
function checkAccess(content: ContentItem, user: User) {
  if (content.is_free) return true;
  if (content.required_plan === 'bronze' && user.plan !== 'free') return true;
  return false;
}
```

### 6.2 Abonelik Kontrolü (Middleware)
```php
// Laravel: middleware/CheckSubscription.php
public function handle($request, $next, $plan) {
    if (!$request->user()->hasActivePlan($plan)) {
        return response()->json(['error' => 'UPGRADE_REQUIRED', 'redirect' => '/paketler'], 403);
    }
    return $next($request);
}
```

---

## FAZ 7 — BİLDİRİM SİSTEMİ (2 Gün)
**SMS, e-posta, push notification.**

### 7.1 E-posta Bildirimleri
- [ ] Gmail SMTP veya Resend.com (daha güvenilir) kurulacak
- [ ] Mevcut mail template'leri düzenlenecek
- [ ] `CONTACT_EMAIL=info@terenceegitim.com` ayarlanacak

### 7.2 SMS Bildirimleri (Twilio veya NetGSM)
**Türkiye için NetGSM önerilir (daha ucuz):**
```env
NETGSM_USERCODE=XXXXX
NETGSM_PASSWORD=XXXXX
NETGSM_MSGHEADER=TERENCE
```

SMS tetikleyiciler:
- Öğrenci 3 gün çalışmadığında → veliye SMS
- Hedef risk durumunda → veliye SMS
- Canlı ders başlamadan 15 dk önce → öğrenciye SMS
- Ödev teslim tarihi 24 saat kaldığında → öğrenciye SMS

### 7.3 Push Notification
Backend'de FCM altyapısı mevcut. 

**Yapılacaklar:**
- [ ] Firebase projesi oluşturulacak
- [ ] `FIREBASE_SERVER_KEY` backend `.env`'e eklenecek
- [ ] Frontend'de service worker kurulacak (Next.js PWA)
- [ ] `POST /notifications/register-token` ile cihaz token'ı kaydedilecek

---

## FAZ 8 — CANLI DERS SİSTEMİ (3 Gün)
**Zoom benzeri sistem.**

### 8.1 Seçenekler
| Seçenek | Maliyet | Kolaylık |
|---------|---------|----------|
| **Daily.co** | $0.004/dk | Çok kolay — iframe embed |
| **100ms.live** | $0.002/dk | SDK var |
| **Jitsi Meet (self-hosted)** | Ücretsiz | Kendi sunucuda kurulum gerekli |
| **Agora.io** | $0.0099/dk | En gelişmiş |

**Öneri:** Daily.co — en hızlı entegrasyon, iframe ile 30 dakikada kurulur.

### 8.2 Entegrasyon Adımları
1. Daily.co hesabı aç → API key al
2. Backend `VideoCallController` → `POST /video-call/start` → Daily.co API'den room URL al
3. Frontend `canli-ders/page.tsx` → iframe ile room göster
4. Ders bitince kayıt URL'si otomatik alınır

```typescript
// Frontend: canlı ders iFrame
<iframe src={roomUrl} allow="camera; microphone; fullscreen" />
```

---

## FAZ 9 — PERFORMANS VE GÜVENLİK (2 Gün)
**Yayına hazır optimizasyon.**

### 9.1 Görsel Optimizasyon
- [ ] `next/image` bileşeni tüm görsellerde kullanılacak
- [ ] WebP formatı zorunlu yapılacak
- [ ] Public klasörüne logo ve hero görselleri eklenecek

### 9.2 SEO
- [ ] Her sayfa için `metadata` (title, description) eklenecek
- [ ] `sitemap.xml` oluşturulacak
- [ ] `robots.txt` eklenecek
- [ ] Open Graph etiketleri eklenecek

### 9.3 Güvenlik
- [ ] Rate limiting tüm formlarda aktif (Laravel'de zaten var)
- [ ] CORS'a sadece `terenceegitim.com` izin verilecek
- [ ] `.env` dosyası dışarıdan erişilmez olacak (Nginx'te bloklanmış)
- [ ] SQL injection koruması aktif (Laravel ORM)
- [ ] XSS koruması aktif (React doğal olarak korur)

### 9.4 Yedekleme
- [ ] Günlük MySQL dump → sunucuda `/backups/` klasörüne
- [ ] Haftalık yedek → external depolama (Google Drive veya S3)
- [ ] Sunucuda cron: `0 2 * * * mysqldump terence_db > /backups/db_$(date +%Y%m%d).sql`

---

## FAZA GENEL BAKIŞ — ÖNCELIK SIRASI

| Faz | İş | Süre | Öncelik |
|-----|----|------|---------|
| **1** | Kimlik doğrulama gerçek bağlantı | 1-2 gün | 🔴 Kritik |
| **2** | Dashboard'lar gerçek veri | 2-3 gün | 🔴 Kritik |
| **3** | İçerik sistemi (video/PDF/soru) | 3-5 gün | 🔴 Kritik |
| **4** | Deneme sistemi | 3-4 gün | 🟠 Önemli |
| **5** | Akıllı öğrenme motoru | 4-5 gün | 🟠 Önemli |
| **6** | Ödeme sistemi | 2-3 gün | 🟠 Önemli |
| **7** | Bildirimler (SMS/mail/push) | 2 gün | 🟡 Normal |
| **8** | Canlı ders | 3 gün | 🟡 Normal |
| **9** | Performans ve güvenlik | 2 gün | 🟢 Son |

**Toplam tahmini süre: 22-32 gün (tam zamanlı geliştirme)**

---

## HEMEN BAŞLANACAK İŞ LİSTESİ (Bu Hafta)

### Gün 1: Sunucu Backend Konfigürasyonu
- [ ] Mail SMTP ayarları (Gmail App Password ile)
- [ ] `php artisan config:cache` yeniden çalıştır
- [ ] E-posta doğrulama testi

### Gün 2-3: Auth-Context ve Token Kalıcılığı
- [ ] `auth-context.tsx` içinde sayfa yenilemede token doğrulama
- [ ] E-posta doğrulama sayfası oluştur
- [ ] Demo login'i kaldır (veya sadece geliştirme için sakla)

### Gün 4-5: İçerik Sistemi Veritabanı
- [ ] Laravel migration'ları oluştur: courses, units, topics, content_items, student_progress
- [ ] Admin panelinden ilk kategori ve dersleri elle gir
- [ ] `GET /courses` endpoint'i oluştur

### Gün 6-7: Öğrenci Dashboard Gerçek Veri
- [ ] `ogrenci/page.tsx` mock veri kaldır → API çağrıları ekle
- [ ] Bildirimler: `GET /notifications` bağla
- [ ] Hedef kaydetme: `PUT /user` bağla

---

## GEREKLİ HESAPLAR VE SERVİSLER

| Servis | Amaç | Maliyet | Öncelik |
|--------|------|---------|---------|
| Gmail App Password | Mail gönderimi | Ücretsiz | Acil |
| Cloudflare R2 | Video/PDF depolama | ~$5/ay | Acil |
| NetGSM | SMS bildirimleri | Kullandıkça | Önemli |
| Daily.co | Canlı ders | $0.004/dk | Sonra |
| Firebase | Push notification | Ücretsiz (5GB) | Sonra |
| PayTR | Ödeme | %2.49 komisyon | Önemli |

---

## BACKEND EKSİK ENDPOİNTLER (Oluşturulacak)

```
# İçerik sistemi
GET  /api/v1/courses
GET  /api/v1/courses/{slug}
GET  /api/v1/courses/{slug}/units
GET  /api/v1/topics/{id}/content
POST /api/v1/progress/update        ← ilerleme kaydet

# Soru sistemi
GET  /api/v1/questions?topic_id=&difficulty=
POST /api/v1/questions/answer       ← cevap gönder + kazanım analizi
GET  /api/v1/questions/similar/{id}

# Deneme sistemi
GET  /api/v1/exams
POST /api/v1/exam-sessions          ← deneme başlat
GET  /api/v1/exam-sessions/{id}/questions
POST /api/v1/exam-sessions/{id}/answer
POST /api/v1/exam-sessions/{id}/finish
GET  /api/v1/exams/{id}/rankings

# Günlük plan
GET  /api/v1/daily-tasks            ← bugünün görev listesi
POST /api/v1/daily-tasks/{id}/complete

# Hedef
PUT  /api/v1/user/goal              ← hedef okul/bölüm/sınav kaydet
GET  /api/v1/user/goal-analysis     ← gerekli net, risk analizi

# Veli
GET  /api/v1/parent/child-summary   ← çocuğun özet verisi
GET  /api/v1/parent/child-report    ← detaylı rapor
```

---

## FRONTEND EKSİK SAYFALAR (Oluşturulacak)

```
web/src/app/
├── dogrulama/page.tsx              ← E-posta doğrulama kodu
├── paketler/page.tsx               ← Paket seçim ve satın alma
├── odeme/page.tsx                  ← PayTR ödeme sayfası
├── odeme/basarili/page.tsx         ← Ödeme başarı
├── odeme/hata/page.tsx             ← Ödeme hata
├── ogrenci/
│   └── deneme/[id]/sonuc/page.tsx  ← Deneme sonuç + kazanım analizi
├── ogretmen/
│   └── basari-tahmini/page.tsx     ← Öğrenci başarı tahmin paneli (detaylı)
└── veli/
    └── bildirim-ayarlari/page.tsx  ← SMS/mail tercihleri
```

---

## NOT: KADEMELİ AÇILIŞ ÖNERİSİ

**Faza 1-3 tamamlanınca beta kullanıcılar alınabilir.**

1. Önce Free paket açılır → kayıt ücretsiz, temel içerik
2. Öğretmenlerden içerik yüklenmesi istenir
3. İlk 100 kullanıcıyla sistem test edilir
4. Sonra ödeme sistemi açılır

**Bu sıra hem riski azaltır hem de gerçek kullanıcı geri bildirimiyle geliştirme sağlanır.**

---

*Bu doküman her fazın tamamlanmasında güncellenecektir.*
*Hazırlayan: Geliştirici — Tarih: Şubat 2025*

# TERENCE EĞİTİM PLATFORMU — TAM GELİŞTİRME PLANI

> Bu plan yeni bir chat oturumuna başlamadan önce verilmelidir.
> Tüm değişiklikler demo/mock veri kaldırılarak gerçek API verisiyle çalışacak şekilde yapılacaktır.

---

## SUNUCU & PROJE BİLGİLERİ (Her Chat'e Ver)

### Sunucu Bağlantısı
```
IP:       31.210.53.84
Port:     22
Kullanıcı: root
Şifre:    2EhbrhzP
Host Key: SHA256:EUXPR9sNR9HSKmOZ8Opu7bSR79Pa1vLInJw8PRr/p4g
Domain:   terenceegitim.com
OS:       Ubuntu 24.04 LTS
```

### plink Bağlantı Komutu (PowerShell)
```powershell
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
& $plinkPath -ssh -pw "2EhbrhzP" -hostkey "SHA256:EUXPR9sNR9HSKmOZ8Opu7bSR79Pa1vLInJw8PRr/p4g" root@31.210.53.84 "KOMUT" 2>&1
```

### Sunucudaki Klasör Yapısı
```
/var/www/terence/
├── web/                          ← Next.js frontend (GIT REPO BURASI)
│   ├── src/
│   │   ├── app/                  ← Tüm sayfalar
│   │   ├── components/           ← Layout, Auth, Dashboard componentleri
│   │   ├── hooks/                ← usePushNotifications.ts
│   │   └── lib/
│   │       ├── api.ts            ← TÜM API fonksiyonları burada
│   │       ├── auth-context.tsx  ← Auth state yönetimi
│   │       ├── mock-data.ts      ← KULLANILMIYOR, silinecek
│   │       └── utils.ts
│   ├── .env.local                ← NEXT_PUBLIC_API_URL=https://terenceegitim.com/api
│   └── .next/                   ← Build çıktısı
│
├── nazliyavuz-platform/
│   └── backend/                 ← Laravel API (AKTİF BACKEND)
│       ├── app/
│       │   ├── Http/Controllers/Api/
│       │   │   ├── AuthController.php
│       │   │   ├── CourseController.php
│       │   │   ├── QuestionController.php
│       │   │   ├── ExamController.php
│       │   │   ├── PlanController.php
│       │   │   ├── PaymentController.php
│       │   │   ├── TeacherController.php
│       │   │   ├── ParentController.php
│       │   │   └── AdminController.php
│       │   ├── Http/Middleware/
│       │   │   └── RoleMiddleware.php
│       │   └── Models/           ← User, Course, Question, ExamSession...
│       ├── routes/api.php        ← TÜM API ROUTE'LARI BURADA
│       └── storage/logs/         ← laravel.log hata logları
│
└── backend_new/                 ← Sadece yedek dosyalar, AKTİF DEĞİL
```

### PM2 Process
```
Uygulama adı: terence-web
Komut:        pm2 restart terence-web
```

### Nginx Config
```
Dosya: /etc/nginx/sites-enabled/terence
API:   /api → /var/www/terence/nazliyavuz-platform/backend/public/index.php
Web:   Geri kalan → localhost:3000 (PM2 Next.js)
```

### Git & Deploy Akışı
```bash
# Lokal değişiklikleri push et
git add -A && git commit -m "mesaj" && git push

# Sunucuda pull + build + restart
cd /var/www/terence/web
git reset --hard origin/main
npm run build
pm2 restart terence-web
```

---

## BACKEND API ROUTE'LARI (Tam Liste)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
POST   /api/auth/resend-verification

# Auth gerektiren:
GET    /api/auth/me
POST   /api/auth/refresh
POST   /api/auth/logout
PATCH  /api/user/profile
POST   /api/user/photo
POST   /api/user/change-password
POST   /api/user/goal

GET    /api/courses
GET    /api/courses/{id}
POST   /api/courses/{id}/enroll
GET    /api/courses/{id}/progress
POST   /api/progress

GET    /api/questions
GET    /api/questions/similar
POST   /api/questions/answer
GET    /api/questions/weak
GET    /api/kazanimlar

POST   /api/exams/start
POST   /api/exams/{id}/answer
POST   /api/exams/{id}/finish
GET    /api/exams/{id}/result
GET    /api/exams/history

GET    /api/plan
GET    /api/plan/today
GET    /api/plan/stats
POST   /api/plan/tasks
PATCH  /api/plan/tasks/{id}/complete
DELETE /api/plan/tasks/{id}
POST   /api/plan/study-session/start
POST   /api/plan/study-session/{id}/end

GET    /api/packages
POST   /api/payment/initiate
POST   /api/payment/callback
GET    /api/subscription/status

# Öğretmen (role: teacher,admin):
GET    /api/teacher/stats
GET    /api/teacher/classes
POST   /api/teacher/classes
GET    /api/teacher/classes/{id}/students
GET    /api/teacher/students/risk
GET    /api/teacher/assignments
POST   /api/teacher/assignments
GET    /api/teacher/live-sessions
POST   /api/teacher/live-sessions

# Veli (role: parent,admin):
GET    /api/parent/children
GET    /api/parent/children/{id}/summary
POST   /api/parent/link
POST   /api/student/generate-parent-code

# Admin (role: admin):
GET    /api/admin/stats
GET    /api/admin/users
PATCH  /api/admin/users/{id}
DELETE /api/admin/users/{id}
POST   /api/admin/users/{id}/toggle-status
GET    /api/admin/content
DELETE /api/admin/content/{id}
GET    /api/admin/reports
GET    /api/admin/audit-logs
POST   /api/admin/settings
```

---

## FRONTEND DOSYA YAPISI

```
web/src/
├── app/
│   ├── page.tsx                    (Landing)
│   ├── layout.tsx
│   ├── giris/page.tsx              (Login)
│   ├── kayit/page.tsx              (Register)
│   ├── profil/page.tsx             (Profil)
│   ├── sifre-degistir/page.tsx
│   ├── sifre-sifirlama/page.tsx
│   ├── dogrulama/page.tsx
│   ├── bildirimler/page.tsx
│   ├── paketler/page.tsx
│   ├── odeme-basarili/page.tsx
│   ├── odeme-hatali/page.tsx
│   ├── iletisim/page.tsx
│   ├── gizlilik/page.tsx
│   ├── kullanim-kosullari/page.tsx
│   ├── ogrenci/
│   │   ├── layout.tsx
│   │   ├── page.tsx                (Dashboard)
│   │   ├── plan/page.tsx
│   │   ├── dersler/page.tsx
│   │   ├── dersler/[ders]/page.tsx
│   │   ├── video/page.tsx
│   │   ├── soru-bankasi/page.tsx
│   │   ├── mini-test/page.tsx
│   │   ├── deneme/page.tsx
│   │   ├── deneme/[id]/page.tsx    (Aktif Sınav)
│   │   ├── deneme/[id]/sonuc/page.tsx
│   │   ├── rapor/page.tsx
│   │   ├── rozet/page.tsx
│   │   ├── hedef/page.tsx
│   │   ├── zayif-kazanım/page.tsx
│   │   └── canli-ders/page.tsx
│   ├── ogretmen/
│   │   ├── layout.tsx
│   │   ├── page.tsx                (Dashboard)
│   │   ├── siniflar/page.tsx
│   │   ├── odev/page.tsx
│   │   ├── mesaj/page.tsx
│   │   ├── canli-ders/page.tsx
│   │   ├── analiz/page.tsx
│   │   ├── dersler/page.tsx
│   │   └── icerik/page.tsx
│   ├── veli/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── rapor/page.tsx
│   │   └── bildirim/page.tsx
│   └── admin/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── kullanicilar/page.tsx
│       ├── icerik/page.tsx
│       ├── sorular/page.tsx
│       ├── raporlar/page.tsx
│       └── ayarlar/page.tsx
├── components/
│   ├── layout/Header.tsx
│   ├── layout/Footer.tsx
│   ├── auth/AuthGuard.tsx
│   ├── dashboard/DashboardHeader.tsx
│   ├── dashboard/DashboardSidebar.tsx
│   ├── dashboard/DashboardLayout.tsx
│   ├── dashboard/DashboardWrapper.tsx
│   ├── dashboard/TeacherSidebar.tsx
│   ├── dashboard/VeliSidebar.tsx
│   └── landing/ (8 section componenti)
├── hooks/usePushNotifications.ts
└── lib/
    ├── api.ts        ← Tüm API fonksiyonları (82 fonksiyon)
    ├── auth-context.tsx
    ├── mock-data.ts  ← SİLİNECEK
    └── utils.ts
```

---

## MEVCUT SORUNLAR & GELİŞTİRME PLANI

### KURAL: Demo/Mock veri TAMAMEN kaldırılacak
- Kullanıcı giriş yapmamışsa → `/giris` sayfasına yönlendir
- Giriş yapılmışsa → HER ZAMAN gerçek API verisi göster
- API hatası olursa → hata mesajı göster, boş ekran değil
- `loginDemo` fonksiyonu auth-context'ten silinecek
- `DEMO_*` ve hardcoded sabit veriler silinecek

---

## GÖREV LİSTESİ (Öncelik Sırasıyla)

---

### AŞAMA 1 — TEMEL ALTYAPI (En Önce Yap)

#### T1.1 — auth-context.tsx: Demo Temizleme + Token Refresh
**Dosya:** `web/src/lib/auth-context.tsx`

**Kaldırılacaklar:**
- `loginDemo(role)` fonksiyonu (satır 105-120)
- `isDemoToken(token)` fonksiyonu (satır 36)
- localStorage'daki demo token kontrolleri

**Eklenecekler:**
- Token expiry kontrolü: `api.refresh()` ile otomatik yenileme
- 401 alındığında otomatik logout + `/giris?expired=1` yönlendirme
- Axios interceptor mantığını fetchApi'ye taşı: her 401'de refresh dene, başarısız olursa logout

**Değişiklik özeti:**
```typescript
// KALDIRILACAK:
function isDemoToken(token: string | null): boolean { ... }
function loginDemo(role: "student" | "teacher" | "parent" | "admin") { ... }

// EKLENECEKKontrol: fetchApi içinde 401 → api.refresh() → başarısızsa logout
```

---

#### T1.2 — api.ts: getTeachers URL bug düzeltmesi
**Dosya:** `web/src/lib/api.ts` satır 582-585

**Mevcut (hatalı):**
```typescript
async getTeachers(params?: Record<string, string>) {
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchApi<{ data: User[] }>(`/admin/users?role=teacher${q.replace("?","&")}`);
},
```

**Düzeltilmiş:**
```typescript
async getTeachers(params?: Record<string, string>) {
  const extra = params ? "&" + new URLSearchParams(params).toString() : "";
  return fetchApi<{ data: User[] }>(`/admin/users?role=teacher${extra}`);
},
```

---

#### T1.3 — mock-data.ts Sil
**Dosya:** `web/src/lib/mock-data.ts`
→ Hiçbir yerde import edilmiyor, tamamen silinecek.

---

### AŞAMA 2 — ÖĞRENCİ PANELI

#### T2.1 — ogrenci/page.tsx: Dashboard Gerçek Veri
**Dosya:** `web/src/app/ogrenci/page.tsx`

**Kaldırılacaklar:**
- `DEMO_PLAN` sabiti
- `DEMO_STATS` sabiti
- `if (isDemo)` blokları

**Değişiklikler:**
- `loadData()` içinde her zaman `api.getTodayPlan(token)` ve `api.getPlanStats(token)` çağır
- API hatası durumunda `setError("Veriler yüklenemedi")` göster, boş ekran değil
- `WEEK_LABELS` → 7 elemana çıkar: `["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"]`
- Risk hesabında `target_net === 0` koruması: `(stats.current_net / Math.max(stats.target_net, 1))`
- Tüm görevler tamamlandığında kutlama banner'ı göster

---

#### T2.2 — ogrenci/deneme/page.tsx: Sınav Listesi Gerçek Veri
**Dosya:** `web/src/app/ogrenci/deneme/page.tsx`

**Kaldırılacaklar:**
- `DEMO_HISTORY` sabiti
- Demo modda `router.push('/ogrenci/deneme/demo')` kısmı

**Değişiklikler:**
- `loadHistory()` her zaman `api.getExamHistory(token)` çağırsın
- `handleStartExam()` çağrısında `api.startExam(token, { exam_type, duration_minutes, question_count })` → response'taki `session.id` ile `/ogrenci/deneme/${session.id}` yönlendir
- Sınav başlatma response'undaki `questions` array'i `localStorage`'a kaydet: `localStorage.setItem('exam_questions_${session.id}', JSON.stringify(questions))`
- İlk girişte geçmiş yoksa boş state mesajı: "Henüz deneme sınavı yapmadınız"

---

#### T2.3 — ogrenci/deneme/[id]/page.tsx: Aktif Sınav — KRİTİK
**Dosya:** `web/src/app/ogrenci/deneme/[id]/page.tsx`

**Mevcut kritik sorun:** Sınav sayfası gerçek sorular yükleyemiyor.
**Kök neden:** `startExam` response'ındaki sorular bu sayfaya aktarılmıyor.

**Kaldırılacaklar:**
- Demo 10 soru üretme bloğu
- `token.startsWith("demo-token-")` kontrolleri
- `Number("demo")` → NaN riski olan demo id kısmı

**Yeni mimari:**
```
1. Sayfa açılır → params.id alınır
2. localStorage'dan sorular kontrol edilir:
   const stored = localStorage.getItem(`exam_questions_${params.id}`)
   if (stored) → sorular yüklenir, sınav başlar
3. localStorage yoksa → api.getExamResult(token, id) kontrol:
   - Sonuç varsa → /ogrenci/deneme/${id}/sonuc yönlendir
   - Yoksa → "Sınav verisi bulunamadı" hata mesajı + listeye dön butonu
4. Sınav bitişinde (handleFinish):
   - api.finishExam(token, sessionId)
   - localStorage.removeItem(`exam_questions_${id}`)
   - /ogrenci/deneme/${id}/sonuc yönlendir
```

**Ek düzeltmeler:**
- `handleFinish` useCallback bağımlılıklarını düzelt
- Zamanlayıcı bitişinde race condition koruması: `isSubmitting` ref ile koru
- Sayfa yenilendiğinde (F5) localStorage'dan sorular yüklenir → sınav devam eder

---

#### T2.4 — ogrenci/deneme/[id]/sonuc/page.tsx: Demo Boş Sayfa
**Dosya:** `web/src/app/ogrenci/deneme/[id]/sonuc/page.tsx`

**Mevcut sorun:** Demo modda sadece `setLoading(false)` çağrılıyor, boş ekran dönüyor.

**Değişiklikler:**
- Demo kontrolü tamamen kaldır
- Sadece `api.getExamResult(token, id)` çağır
- Sonuç null ise → "Sonuç bulunamadı" + Denemelere Dön butonu göster
- Loading state sırasında skeleton göster

---

#### T2.5 — ogrenci/soru-bankasi/page.tsx: Gerçek Veri + UX
**Dosya:** `web/src/app/ogrenci/soru-bankasi/page.tsx`

**Kaldırılacaklar:**
- `DEMO_QUESTIONS` sabiti
- Demo mod kontrolleri

**Değişiklikler:**
- `catch {}` → `catch (e) { setError((e as Error).message) }` — hata yutma
- "Hatalı cevap → planına eklendi" mesajı: `api.addPlanTask(token, {...})` gerçekten çağrılsın
- Pagination: `page` state ekle, "Daha Fazla" butonu `page + 1` ile yeni sorular eklesin (`setQuestions(prev => [...prev, ...newOnes])`)
- Demo için "Benzer Soru" butonu kaldırılsın, gerçek modda çalışsın

---

#### T2.6 — ogrenci/plan/page.tsx: Gerçek Veri + Haftalık Görünüm
**Dosya:** `web/src/app/ogrenci/plan/page.tsx`

**Kaldırılacaklar:**
- `DEMO_PLAN` sabiti
- Demo mod kontrolleri

**Değişiklikler:**
- `catch {}` → hata mesajı göster
- Görev silerken başarısız olursa → listeye geri ekle (optimistik UI rollback)
- AI önerisi olan görevleri `is_ai_suggested: true` ile belirt → farklı badge göster
- Sekme ekle: "Bugün" | "Bu Hafta" → "Bu Hafta" seçilince `api.getWeeklyPlans(token)` çağır

---

#### T2.7 — ogrenci/rapor/page.tsx: Gerçek Veri
**Dosya:** `web/src/app/ogrenci/rapor/page.tsx`

**Kaldırılacaklar:**
- Demo modda gösterilen hardcoded istatistik değerleri
- XP kartındaki `AlertTriangle` ikonu → `Zap` ile değiştir

**Değişiklikler:**
- `isDemo` koşulu kaldır → her zaman `api.getPlanStats(token)` çağır
- Haftalık bar chart `weekly_nets` array'ini kullan (7 eleman)

---

#### T2.8 — ogrenci/rozet/page.tsx: Loading State + Gerçek Veri
**Dosya:** `web/src/app/ogrenci/rozet/page.tsx`

**Kaldırılacaklar:**
- `DEMO_BADGES`, `DEMO_LEADERBOARD` sabitleri
- Demo mod kontrolleri

**Değişiklikler:**
- `period` değiştiğinde leaderboard yeniden yüklenirken loading state göster
- Hata durumunda "Veriler yüklenemedi, yenile" mesajı göster

---

#### T2.9 — ogrenci/video/page.tsx: N+1 Sorunu Çöz
**Dosya:** `web/src/app/ogrenci/video/page.tsx`

**Mevcut kritik sorun:** Her kurs için tüm ünite+topic+content çekiliyor → 54 API çağrısı

**Çözüm:**
- Sadece kurs listesini yükle: `api.getCourses(token)`
- Kullanıcı bir ders seçtiğinde o dersin ünitelerini yükle: `api.getCourseUnits(courseId, token)`
- Konu seçildiğinde içerikleri yükle: `api.getTopicContent(topicId, token)`
- Lazy loading: seçilen ünite expand edildiğinde topics yüklenir

---

#### T2.10 — ogrenci/hedef/page.tsx: Gerçek Veri
**Dosya:** `web/src/app/ogrenci/hedef/page.tsx`

**Değişiklikler:**
- Hedef kaydedildikten sonra `api.getGoalAnalysis` yerine `api.getPlanStats(token)` çağır
- `GoalAnalysis.days_remaining` → `PlanStats`'ta yok, bu alanı hesapla: `new Date(examDate) - new Date()` / 86400000

---

#### T2.11 — ogrenci/zayif-kazanım/page.tsx: URL + Video Düzelt
**Klasör adı sorunu:** `zayif-kazanım` → Türkçe karakter `ı` var
- Klasörü `zayif-kazanim` olarak yeniden adlandır (Türkçesiz)
- Next.js redirect ekle: `/ogrenci/zayif-kazanım` → `/ogrenci/zayif-kazanim`
- `router.push(item.video_url)` → `window.open(item.video_url, '_blank')` yap

**Veri değişiklikleri:**
- `DEMO_ZAYIF` kaldır → `api.getWeakAchievements(token)` kullan

---

#### T2.12 — ogrenci/mini-test/page.tsx: Zamanlayıcı + Plan Entegrasyonu
**Dosya:** `web/src/app/ogrenci/mini-test/page.tsx`

**Değişiklikler:**
- `startTime` her soru geçişinde `Date.now()` ile güncellenir → Timer'ı da sıfırla
- Süre dolduğunda cevaplanmamış sorular "boş" olarak say → istatistiğe ekle
- Yanlış cevap verildiğinde: `api.addPlanTask(token, {subject, kazanim_code})` çağır
- Demo soruları kaldır → `api.getQuestions(token, {limit: 10, random: true})` kullan

---

#### T2.13 — ogrenci/canli-ders/page.tsx: isLive Düzelt
**Dosya:** `web/src/app/ogrenci/canli-ders/page.tsx`

**Değişiklikler:**
- Demo veriler kaldır → `api.getLiveSessions(token)` kullan (öğrenci için endpoint eklenebilir)
- `isLive` server-side saat bağımsız yap: `status === 'live'` kontrolü yeterli

---

### AŞAMA 3 — ÖĞRETMEN PANELİ

#### T3.1 — ogretmen/page.tsx: Dashboard Gerçek Veri
**Dosya:** `web/src/app/ogretmen/page.tsx`

**Kaldırılacaklar:**
- `DEMO_RISK` sabiti

**Değişiklikler:**
- "Son Aktivite" listesinde `last_active_at` kullan: "2 saat önce", "Dün", "3 gün önce" formatla
- "Toplu Veli Bildirimi" butonu: tıklandığında `api.sendMessage(token, {recipient_type: 'all', content: '...'})` çağır → küçük form dialog aç

---

#### T3.2 — ogretmen/mesaj/page.tsx: Hardcoded Listeler Kaldır — KRİTİK
**Dosya:** `web/src/app/ogretmen/mesaj/page.tsx`

**Mevcut kritik sorun:**
```typescript
// Bu sabitler KALDIRILACAK:
const CLASSES = ["10-A Matematik", "10-B Matematik", "11-A Fizik"];
const STUDENTS = ["Ahmet Yılmaz", "Zeynep Kaya", "Burak Demir", "Selin Çelik", "Mehmet Arslan"];
```

**Yeni yapı:**
- Sayfa yüklenirken `api.getTeacherClasses(token)` → sınıf listesi
- Sınıf seçilince `api.getClassStudents(token, classId)` → öğrenci listesi
- `seciliSinif` state'i class ID (number) tut, string değil
- `recipient_id` API'ye doğru gönderilsin (class ID veya student ID)

---

#### T3.3 — ogretmen/analiz/page.tsx: 3 Eksik Bölümü Gerçek Yap — KRİTİK
**Dosya:** `web/src/app/ogretmen/analiz/page.tsx`

**Mevcut durum:** "Kazanım Bazlı Hata", "En Zor Konular", "Çözüm Süresi Analizi" sadece demo gösteriyor. Gerçek endpoint yok.

**Yapılacak:**
Backend'de bu endpoint'ler yoksa TeacherController'a ekle:
```
GET /api/teacher/analytics/kazanim-errors   → Kazanım bazlı hata sayıları
GET /api/teacher/analytics/hard-topics      → En zor konular
GET /api/teacher/analytics/time-analysis    → Çözüm süresi analizi
```

Frontend'de:
- Demo veriler kaldır
- Yeni `api.getTeacherAnalytics(token, type)` fonksiyonu ekle
- API endpoint yoksa backend'e ekle, yoksa bu bölümleri "Yakında" placeholder ile göster
- İstisna: öğrenci bazlı net grafiği → `api.getRiskStudents(token)` ile çalışıyor, bu kalacak

---

#### T3.4 — ogretmen/odev/page.tsx: Tamamlanma % + Sınıf Seçimi
**Dosya:** `web/src/app/ogretmen/odev/page.tsx`

**Değişiklikler:**
- `(a.completions_count / 24) * 100` → `(a.completions_count / (a.class_room?.student_count ?? 1)) * 100`
- Form'a sınıf seçimi dropdown ekle: `api.getTeacherClasses(token)` → select
- Ödev düzenleme: `PATCH /api/teacher/assignments/{id}` backend endpoint eklenecek
- Ödev silme: `DELETE /api/teacher/assignments/{id}` backend endpoint eklenecek
- `catch {}` → hata mesajı göster

---

#### T3.5 — ogretmen/siniflar/page.tsx: Öğrenci Listesi API'den
**Dosya:** `web/src/app/ogretmen/siniflar/page.tsx`

**Değişiklikler:**
- Sınıf seçildiğinde `api.getClassStudents(token, classId)` çağır → `students` state set et
- Demo veriler kaldır
- Hata durumunda bildirim göster

---

#### T3.6 — ogretmen/canli-ders/page.tsx: Class Seçimi
**Dosya:** `web/src/app/ogretmen/canli-ders/page.tsx`

**Değişiklikler:**
- Ders oluştururken sınıf adı string yerine sınıf dropdown ekle
- `api.getTeacherClasses(token)` ile gerçek sınıf listesi
- `class_room_id` API'ye gönder

---

### AŞAMA 4 — VELİ PANELİ

#### T4.1 — veli/page.tsx: Hardcoded Değerleri Kaldır — KRİTİK
**Dosya:** `web/src/app/veli/page.tsx`

**Kaldırılacaklar:**
- `demoExams` sabiti — "Son Deneme Sonuçları" tablosu gerçek modda hep demo gösteriyor
- Hardcoded: Matematik %65, Fizik %72, Kimya %80

**Değişiklikler:**
- `api.getChildSummary(token)` response'undan `summary.recent_exams` → deneme tablosu
- `summary.subject_performance` → zayıf dersler listesi
- `weeklyChange` hesabı: `nets[nets.length-1] - nets[0]` → doğru haftalık değişim

---

#### T4.2 — veli/rapor/page.tsx: Tüm Hardcoded Değerleri Kaldır — KRİTİK
**Dosya:** `web/src/app/veli/rapor/page.tsx`

**Kaldırılacaklar:**
- `"12s 34dk"` hardcoded çalışma süresi
- `"248"` hardcoded çözülen soru
- `DEMO_EXAMS` — rapor her zaman bu demo tabloyu gösteriyor
- `DEMO_SUBJECTS` — konu analizi

**Değişiklikler:**
- `api.getChildReport(token)` → `report.study_time_weekly_seconds` → `"Xsaat Ydak"` formatla
- `report.tasks_done_this_week` → "Çözülen Soru"
- `report.recent_exams` → deneme tablosu
- `report.subject_analysis` → konu analizi
- "Hedef Riski" uyarısı: `report.current_net < report.target_net * 0.8` koşulunda göster
- "PDF İndir": gerçek PDF için `window.print()` kabul edilebilir ama print-specific CSS ekle

---

#### T4.3 — veli/bildirim/page.tsx: Telefon Güncelleme
**Dosya:** `web/src/app/veli/bildirim/page.tsx`

**Değişiklikler:**
- Telefon numarası güncelleme formu ekle
- Kaydedince `api.updateProfile(token, { phone })` çağır

---

### AŞAMA 5 — ADMIN PANELİ

#### T5.1 — admin/page.tsx: Hardcoded Dönüşüm Verileri
**Dosya:** `web/src/app/admin/page.tsx`

**Değişiklikler:**
- `adminStats.subscription_conversions` kullan (hardcoded 45/28/12 kaldır)
- `new_users_this_week` için doğru field kullan
- `top_content` endpoint'i backend'de yoksa `admin/content?sort=views&limit=5` ekle

---

#### T5.2 — admin/kullanicilar/page.tsx: Modal + Düzenleme
**Dosya:** `web/src/app/admin/kullanicilar/page.tsx`

**Değişiklikler:**
- `window.confirm()` → custom confirmation modal
- Kullanıcı düzenleme formu ekle (isim, rol, plan değiştir) → `api.updateAdminUser(token, id, data)`

---

#### T5.3 — admin/raporlar/page.tsx: Gerçek Veri
**Dosya:** `web/src/app/admin/raporlar/page.tsx`

**Değişiklikler:**
- Tüm hardcoded istatistik değerlerini `api.getAdminReports(token)` response'undan al

---

### AŞAMA 6 — PROFİL & GENEL

#### T6.1 — profil/page.tsx: Öğretmen Alanları Kaydedilmiyor
**Dosya:** `web/src/app/profil/page.tsx`

**Mevcut sorun:** `brans` ve `ozgecmis` form alanları doldurulsa da API'ye gönderilmiyor.

**Değişiklikler:**
```typescript
// MEVCUT (eksik):
await api.updateProfile(token, { name, phone })

// OLMASI GEREKEN:
await api.updateProfile(token, { name, phone, bio: ozgecmis, branch: brans })
```
- Backend'de `PATCH /api/user/profile` handler'ı `bio` ve `branch` alanlarını kabul etmeli
- `AuthController::updateProfile` → `$user->fill(['bio' => $request->bio, 'branch' => $request->branch])`

---

#### T6.2 — bildirimler/page.tsx: Gerçek Bildirimler
**Dosya:** `web/src/app/bildirimler/page.tsx`

**Değişiklikler:**
- `api.getNotifications(token)` ile gerçek bildirimler
- `api.markNotificationRead(token, id)` ile okundu işaretle
- `api.markAllNotificationsRead(token)` ile hepsini okundu yap

---

### AŞAMA 7 — BACKEND EKSİKLERİ

Backend'e eklenmesi gereken yeni endpoint'ler:

#### B1 — TeacherController: Analytics
```php
GET /api/teacher/analytics/kazanim-errors
GET /api/teacher/analytics/hard-topics
GET /api/teacher/analytics/time-analysis
```
**Dosya:** `/var/www/terence/nazliyavuz-platform/backend/app/Http/Controllers/Api/TeacherController.php`

#### B2 — TeacherController: Assignment CRUD
```php
PATCH  /api/teacher/assignments/{id}
DELETE /api/teacher/assignments/{id}
```

#### B3 — TeacherController: Messages
```php
GET  /api/teacher/messages    ← Gönderilen mesaj geçmişi
POST /api/teacher/messages    ← Mesaj gönder
```
**Routes:** `/var/www/terence/nazliyavuz-platform/backend/routes/api.php`

#### B4 — ParentController: Child Report
```php
GET /api/parent/child-report
```
Döndürmesi gerekenler: `study_time_weekly_seconds`, `tasks_done_this_week`, `recent_exams`, `subject_analysis`, `current_net`, `target_net`, `weekly_nets`

#### B5 — ParentController: Notification Settings
```php
GET   /api/parent/notification-settings
PATCH /api/parent/notification-settings
```

#### B6 — AuthController: Profile Branch/Bio
```php
// updateProfile metoduna ekle:
$user->fill([
    'bio'    => $request->bio,
    'branch' => $request->branch,
]);
```

#### B7 — AdminController: Top Content
```php
// content endpoint'e sort+limit parametresi ekle:
GET /api/admin/content?sort=views&limit=5
```

---

### AŞAMA 8 — REDIRECT + URL DÜZELTME

**Dosya:** `web/next.config.ts`

```typescript
// Türkçe karakter URL düzeltmesi ekle:
{
  source: '/ogrenci/zayif-kazanım',
  destination: '/ogrenci/zayif-kazanim',
  permanent: true,
}
```

Klasör adı: `zayif-kazanım` → `zayif-kazanim` olarak rename et.

---

## DEPLOY ADIMLARI (Her Değişiklik Sonrası)

```powershell
# 1. Lokal - değişiklikleri commit & push et
cd "c:\Users\AHMET CAN\Desktop\nazliyavuz - Kopya - Kopya (3)"
git add -A
git commit -m "değişiklik açıklaması"
git push

# 2. Sunucu - pull + build + restart
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
& $plinkPath -ssh -pw "2EhbrhzP" -hostkey "SHA256:EUXPR9sNR9HSKmOZ8Opu7bSR79Pa1vLInJw8PRr/p4g" root@31.210.53.84 "cd /var/www/terence/web && git reset --hard origin/main && npm run build 2>&1 | tail -5 && pm2 restart terence-web && echo DONE" 2>&1

# 3. Backend değişikliği varsa Laravel cache temizle:
& $plinkPath -ssh -pw "2EhbrhzP" -hostkey "SHA256:EUXPR9sNR9HSKmOZ8Opu7bSR79Pa1vLInJw8PRr/p4g" root@31.210.53.84 "cd /var/www/terence/nazliyavuz-platform/backend && php artisan optimize" 2>&1
```

---

## ÖNEMLİ NOTLAR (Yeni Chat Başlarken Oku)

1. **NEXT_PUBLIC_ değişkenleri build-time'da gömülür** → .env.local değişince mutlaka `npm run build` gerekir
2. **Backend JWT kullanıyor** (tymon/jwt-auth) → token format: `{ token: { access_token, token_type, expires_in } }`
3. **api.ts'te `res.token.access_token`** → login/register sonrası token bu şekilde alınır
4. **Öğretmen route'ları middleware'i:** `role:teacher,admin` → öğretmen ve admin her ikisi de erişebilir
5. **Veli route'ları middleware'i:** `role:parent,admin`
6. **Admin route'ları middleware'i:** `role:admin`
7. **TypeScript strict mode açık** → her değişiklikten sonra `npx tsc --noEmit` çalıştır
8. **Tailwind v4** kullanılıyor → bazı syntax farklılıkları olabilir
9. **`npm run build` exit 0 alınmadan deploy yapma**
10. **`mock-data.ts` artık kullanılmıyor, silinebilir**

---

## TAMAMLANMA KRİTERLERİ

Her görev için:
- [ ] Demo/mock veri kaldırıldı
- [ ] API çağrısı her zaman yapılıyor (giriş yapılmışsa)
- [ ] Hata durumunda kullanıcıya mesaj gösteriliyor
- [ ] Loading state var
- [ ] TypeScript hata yok (`npx tsc --noEmit`)
- [ ] Build alınıyor (`npm run build` exit 0)
- [ ] Sunucuda test edildi

---

*Son güncelleme: 2026-03-03 | Tüm görevler öncelik sırasıyla yapılmalı*

# TERENCE EĞİTİM PLATFORMU — ÖNCELIK SIRASINA GÖRE GELİŞTİRME PLANI

> web.MD ile mevcut proje karşılaştırması sonucu oluşturulmuştur.
> Son güncelleme: 04.03.2026

---

## SUNUCU & PROJE BİLGİLERİ

```
IP:        31.210.53.84
Port:      22
Kullanıcı: root
Şifre:     2EhbrhzP
Host Key:  SHA256:EUXPR9sNR9HSKmOZ8Opu7bSR79Pa1vLInJw8PRr/p4g
Domain:    terenceegitim.com

Frontend:  /var/www/terence/web/           (Next.js 16 — PM2: terence-web)
Backend:   /var/www/terence/nazliyavuz-platform/backend/  (Laravel)
Deploy:    pscp ile dosya yükle → npm run build → pm2 restart terence-web
```

---

## ÖNCELIK 1 — HEMEN YAPILABİLİR (Frontend, düşük risk)

### 1.1 Demo/Mock Data Temizliği — Dersler Sayfaları
- [x] `/ogrenci/dersler/page.tsx` — `DEMO_COURSES` fallback kaldırıldı, API hatasında boş durum + yenile butonu eklendi ✅ TAMAMLANDI
- [x] `/ogrenci/dersler/[ders]/page.tsx` — `DEMO_UNITS`, `isDemo` token kontrolü kaldırıldı, hata ekranı eklendi ✅ TAMAMLANDI
- [x] `/ogretmen/dersler/page.tsx` — `DEMO_COURSES` + `DEMO_UNITS` kaldırıldı, gerçek API + hata durumu eklendi ✅ TAMAMLANDI
- [x] Hata durumunda "İçerik yüklenemedi, yenile" mesajı göster (demo veri değil) ✅ TAMAMLANDI

### 1.2 Admin Soru Yönetimi — Gerçek API
- [x] `/admin/sorular/page.tsx` — Tamamen yeniden yazıldı, `getQuestions` API ile gerçek veri listeleniyor ✅ TAMAMLANDI
- [x] Soru listesi: kazanım kodu, ders, zorluk, tip filtreleme ✅ TAMAMLANDI
- [x] Soru silme işlemi: `deleteAdminQuestion` API endpoint eklendi ✅ TAMAMLANDI
- [x] Sayfalama desteği eklendi ✅ TAMAMLANDI
- [x] Soru ekleme formu: görsel/PDF yükle, şıkları işaretle, doğru cevabı seç, kazanım etiketle (backend endpoint gerekiyor)
- [x] **Öğretmen onay arayüzü:** `/admin/ogretmen-onay` sayfası oluşturuldu — `pending/approved/rejected` filtreleme, onayla/reddet, profil detay modal ✅ TAMAMLANDI

### 1.3 Video Sayfası Geliştirmeleri
- [x] Hız ayarı kontrolü: 0.5x — 2x arasında hız seçenekleri `VideoPlayerModal` bileşenine eklendi ✅ TAMAMLANDI
- [x] Kaldığın yerden devam: `localStorage`'da `video_pos_${id}` ile konum kaydedilir, açılışta yüklenilir ✅ TAMAMLANDI
- [x] `updateProgress` API 5 saniyede bir `watch_seconds` ile güncellenir, video bitince `completed` kaydedilir ✅ TAMAMLANDI
- [x] PDF not indirme butonu: ders içeriğinde `type === "pdf"` ise İndir butonu gösteriliyor ✅ TAMAMLANDI

### 1.4 Ders İçeriği — Anladım / Tekrar Et Butonları
- [x] `/ogrenci/dersler/[ders]/page.tsx` — Her konu kartına "Anladım ✓" ve "Tekrar Et 🔁" butonları eklendi ✅ TAMAMLANDI
- [x] `progress !== "not_started"` kısıtlaması kaldırıldı — tüm konularda butonlar görünür ✅ TAMAMLANDI
- [x] Tamamlanan konular yeşil (teal), devam edilen konular sarı (amber) gösteriliyor ✅ TAMAMLANDI

### 1.5 Deneme Sonuçlarına Kazanım Bazlı Analiz
- [x] `/ogrenci/deneme/[id]/sonuc/page.tsx` — "Zayıf Kazanım Analizi" bloğu eklendi ✅ TAMAMLANDI
- [x] `getWeakAchievements` API çağrısı yapılır, ilk 5 zayıf kazanım listelenir ✅ TAMAMLANDI
- [x] Her kazanım için doğruluk oranı, yanlış/toplam sayısı ve progress bar gösteriliyor ✅ TAMAMLANDI

### 1.6 Soru Bankası — Benzer Soru Getir
- [x] `/ogrenci/soru-bankasi/page.tsx` — Benzer Soru butonu zaten mevcuttu ve çalışıyor ✅ ZATEN MEVCUT

---

## ÖNCELIK 2 — BACKEND + FRONTEND (Orta vadeli)

### 2.1 Net Hesap Motoru (Akıllı Hedef Sistemi)
- [x] **Frontend:** `/ogrenci/hedef/page.tsx` — "X gün kaldı · Haftada +Y net lazım · Artması gereken net" 3'lü info kartı eklendi ✅ TAMAMLANDI
- [x] **Frontend:** Paket yükseltme önerisi banner'ı risk=red ve free plan'daysa gösteriliyor ✅ TAMAMLANDI
- [ ] **Backend:** `GET /student/goal-engine` endpoint — daha kapsamlı hesaplama (backend gerektirir)

### 2.2 Başarı Tahmin Modeli
- [x] **Frontend:** `/ogrenci/rapor/page.tsx` — "Tahmini Sınav Neti" kartı eklendi (mevcut haftalık artış × kalan hafta hesabı) ✅ TAMAMLANDI
- [x] **Frontend:** Rapor sayfasına "Zayıf Kazanımlarım" özet bölümü eklendi ✅ TAMAMLANDI
- [ ] **Backend:** `GET /student/prediction` — daha gelişmiş ML modeli (opsiyonel, backend gerektirir)
- [ ] **Frontend:** `/ogretmen/analiz/page.tsx` — "Başarı Tahmin Paneli" (öğrenci bazlı tahmin)

### 2.3 Otomatik Kazanım Tespiti ve Plan Görevi
- [x] **Frontend:** `/ogrenci/plan/page.tsx` — "AI Önerilen Görevler" bölümü eklendi: zayıf kazanımlar listeleniyor ✅ TAMAMLANDI
- [x] **Frontend:** "Plana Ekle" butonu — `addPlanTask` API ile tek tıkla plana kazanım görevi ekleniyor ✅ TAMAMLANDI
- [x] **Frontend:** Eklenen görevlerin yanında "Eklendi ✓" gösterimi ✅ TAMAMLANDI
- [ ] **Backend:** Soru çözümünde zayıf kazanım otomatik tespiti (backend gerektirir)

### 2.4 Öğretmen Risk & Uyarı Merkezi
- [x] `/ogretmen/analiz/page.tsx` — Risk filtreleri eklendi: "Tümü", "Yüksek Risk", "3+ Gün Pasif", "Neti Düşenler" ✅ TAMAMLANDI
- [x] Çoklu öğrenci seçimi (checkbox) + "X Öğrencinin Velisine Bildir" toplu mesaj butonu ✅ TAMAMLANDI
- [x] Haftalık net değişimi gösterimi her öğrenci kartında ✅ TAMAMLANDI

### 2.5 Otomatik Paket Yükseltme Önerisi (Satış Motoru)
- [x] **Frontend:** `/ogrenci/page.tsx` — Risk=red + free plan'daysa teal banner gösteriliyor ✅ TAMAMLANDI
- [x] **Frontend:** `/ogrenci/hedef/page.tsx` — Risk=red + free plan'daysa kırmızı banner gösteriliyor ✅ TAMAMLANDI
- [ ] **Backend:** Risk algılandığında `upgrade_suggestion` flag'i (backend opsiyonel)

---

## ÖNCELIK 3 — YENİ SAYFALAR / MODÜLLER

### 3.1 Türkiye Geneli Sıralama
- [ ] **Backend:** `GET /leaderboard/national` — tüm kullanıcıların net sıralaması
- [ ] **Frontend:** `/ogrenci/rozet/page.tsx` — mevcut rozet sayfasına "Türkiye Sıralaması" tab'ı ekle
- [ ] Filtreler: Hedef sınav türü (TYT, AYT, LGS), Sınıf, Şehir

### 3.2 Okul Paneli (Kurumsal)
- [ ] Yeni rol: `school_admin`
- [ ] `/okul` ana dashboard
- [ ] `/okul/ogrenciler` — toplu öğrenci tanımlama (CSV import)
- [ ] `/okul/raporlar` — okul bazlı performans raporları
- [ ] `/okul/denemeler` — okula özel deneme sınavları
- [ ] **Backend:** `school_id` alanı `users` tablosuna ekle, tüm sorgulara filtre uygula

### 3.3 Öğrenci Sosyal Alanı / Forum
- [x] **TAMAMLANDI** `/ogrenci/forum` yeni sayfa oluşturuldu
- [x] Soru sor — öğretmen veya diğer öğrenciler cevap verebilir (modal + API)
- [x] "En iyi yanıt" işaretleme özelliği
- [x] Konu filtresi (Matematik, Fizik, Kimya vs.), beğeni, arama
- [ ] Günlük hedef paylaşımı
- [ ] "Haftanın en çok çalışanı" rozeti (otomatik hesaplama)

### 3.4 Dijital Koç Asistanı
- [x] **TAMAMLANDI** `/ogrenci/koc` yeni sayfa oluşturuldu
- [x] Yapay zeka destekli sohbet arayüzü (chat UI, typing indicator, geçmiş)
- [x] Hızlı başlangıç önerileri (Hedef analizi, Zayıf konular, Günlük plan vs.)
- [x] Koça Sor butonu rapor sayfasına entegre edildi
- [ ] Haftalık kişiselleştirilmiş otomatik mesajlar (backend gerekli)

### 3.5 Kişiye Özel Haftalık Rapor PDF
- [x] **TAMAMLANDI** `/ogrenci/rapor` sayfasına PDF butonu (window.print) eklendi
- [x] Rapor sayfasına "Koça Sor" kartı eklendi
- [ ] **Backend:** `GET /student/weekly-report/pdf` — gerçek PDF üretimi
- [ ] **Frontend:** Veliye haftalık rapor PDF e-posta ile gönder seçeneği

---

## ÖNCELIK 4 — TEKNİK ALTYAPI

### 4.1 SMS Bildirim Entegrasyonu
- [ ] **Backend:** Netcore/İleti şirketi veya Twilio SMS API entegrasyonu
- [ ] Veliye SMS: öğrenci 3 gün çalışmazsa otomatik SMS
- [ ] Veliye SMS: hedef risk algılandığında SMS
- [ ] Kayıt sırasında telefon SMS doğrulama (OTP)
- [ ] Öğretmen risk merkezi: veliye tek tıkla SMS gönder

> *Not: SMS backend entegrasyonu sunucu tarafı gerektirir. Frontend bildirim merkezi (4.1 frontend) TAMAMLANDI — bkz. aşağıdaki başlık.*

### 4.1b Bildirimler Sayfası Frontend Geliştirme ✅ TAMAMLANDI
- [x] `/bildirimler` sayfası kategori sekmeleriyle yeniden yazıldı (Çalışma, Deneme, Hedef Risk, Mesaj, Rozet, Genel)
- [x] Okundu/Okunmamış filtresi eklendi
- [x] Her bildirim için silme butonu (hover'da görünür) eklendi — `api.deleteNotification` endpoint eklendi
- [x] Okunmamış sayaç badge'i bildirim ikonu üzerine eklendi
- [x] Yenile butonu eklendi

### 4.2 Google / Apple OAuth ✅ TAMAMLANDI (Frontend)
- [x] **Frontend:** Giriş sayfasına "Google ile Giriş" butonu eklendi (`/giris`)
- [x] **Frontend:** Kayıt sayfası adım 1'e "Google ile Kayıt Ol" butonu eklendi, rol seçiminden sonra Google OAuth akışına yönlendiriyor
- [ ] **Backend:** Laravel Socialite ile Google OAuth (sunucu gerektirir)
- [ ] Apple Sign In (iOS için)

### 4.3 Push Bildirim (Web Push) ✅ TAMAMLANDI (Frontend)
- [x] `public/sw.js` Service Worker oluşturuldu (push dinleyici, notificationclick handler, önbellekleme)
- [x] `PushPermissionBanner` bileşeni oluşturuldu — öğrenci dashboard'unda gösteriliyor, 3 gün "sonra sor" desteği
- [x] SW kaydı ve push subscription alındıktan sonra `api.registerPushToken` ile backend'e kaydediliyor
- [x] `public/manifest.json` güncellendi: `shortcuts` eklendi (Günlük Plan, Mini Test, Dijital Koç), `start_url` düzeltildi, `lang: tr` eklendi

### 4.4 Video DRM ✅ TAMAMLANDI (Frontend)
- [x] Video elementine `controlsList="nodownload noremoteplayback"` eklendi
- [x] `disablePictureInPicture` eklendi
- [x] Video modal wrapper'a `onContextMenu={e => e.preventDefault()}` eklendi (sağ tık engeli)
- [ ] Mux / Cloudflare Stream backend entegrasyonu (sunucu gerektirir)

### 4.5 Ödeme Sistemi Geliştirmeleri ✅ TAMAMLANDI (Frontend)
- [x] Ödeme modalı tamamen yeniden yazıldı: promosyon kodu / indirim kuponu alanı eklendi
- [x] `api.applyCoupon` endpoint'i eklendi (`POST /payment/apply-coupon`)
- [x] Kupon uygulandığında indirim miktarı gösteriliyor, yeni fiyatla iframe yeniden yükleniyor
- [x] `api.initiatePayment`'a `coupon_code` parametresi eklendi
- [x] **Admin kupon yönetim sayfası** (`/admin/kupon`) oluşturuldu — kupon oluştur, listele, aktif/pasif et, sil ✅ TAMAMLANDI
- [ ] Fatura PDF oluşturma (backend gerektirir)
- [ ] İade akışı (backend gerektirir)

---

## ÖNCELIK 5 — YAPAY ZEKA ÖZELLİKLERİ

### 5.1 AI Destekli Soru Üretimi ✅ TAMAMLANDI (Frontend)
- [x] Öğretmen içerik yükleme sayfasına "AI ile Soru Üret" butonu eklendi (Soru sekmesinde gösteriliyor)
- [x] `AIQuestionModal` bileşeni: Ders, Zorluk, Konu, Kazanım Kodu girişi → `api.generateQuestion` çağrısı
- [x] Üretilen sorunun önizlemesi: seçenekler, doğru cevap, açıklama gösterimi
- [x] "Bu Soruyu Sisteme Ekle" butonu
- [x] `api.generateQuestion` endpoint'i `api.ts`'e eklendi (`POST /ai/generate-question`)
- [ ] **Backend:** OpenAI / yerel LLM entegrasyonu (sunucu gerektirir)

### 5.2 Konu Anlatımı Özetleyici ✅ TAMAMLANDI (Frontend)
- [x] Öğrenci ders detay sayfasında her konuya "AI Özet" butonu eklendi (mor, hover'da görünür)
- [x] `AISummaryModal` bileşeni: konuyu API'ye gönderir, özet + anahtar noktaları gösterir
- [x] Yükleme animasyonu, hata durumu yönetimi
- [x] `api.summarizeContent` endpoint'i eklendi (`POST /ai/summarize`)
- [ ] **Backend:** PDF / video transkript özet motoru (sunucu gerektirir)

### 5.3 Sesli Soru Çözüm Asistanı ✅ TAMAMLANDI
- [x] Soru bankasına "Sesli Çöz" butonu eklendi
- [x] `VoiceAssistantModal`: Web Speech API (`SpeechRecognition`) ile ses kaydı
- [x] Kaydedilen metin AI Coach'a gönderilir (`api.askCoach`)
- [x] Yanıt `speechSynthesis` ile sesli okunur (Türkçe)
- [x] "Sesli Oku / Durdur" butonu, tarayıcı desteği kontrolü

### 5.4 Akıllı Soru Seçme Motoru ✅ TAMAMLANDI (Frontend)
- [x] Soru bankasına "Bana Özel Test" butonu eklendi (mor, başlıkta)
- [x] `PersonalTestModal`: Ders, Soru Sayısı, Zorluk seçimi → `api.generatePersonalTest` çağrısı
- [x] Oluşturulan sorular doğrudan soru bankasına yükleniyor
- [x] `api.generatePersonalTest` endpoint'i eklendi (`POST /ai/personal-test`)
- [ ] **Backend:** Zayıf kazanım + geçmiş tabanlı soru seçim algoritması (sunucu gerektirir)

### 5.5 Büyük Veri — Kazanım Analizi ✅ TAMAMLANDI (Frontend)
- [x] Admin Raporlar sayfasına "Türkiye Geneli En Zor Kazanımlar" tablosu eklendi
- [x] Yanlış oranı, deneme sayısı, progress bar ve "Türkiye geneli zor" etiketi gösterimi (>%65 eşiği)
- [x] İlk 3 kazanım kırmızı renk, renkli progress bar (kırmızı/amber/teal)
- [x] `api.getHardAchievements` endpoint'i eklendi (`GET /ai/hard-achievements`)
- [x] Boş durum: "Veri henüz yok" mesajı
- [ ] **Backend:** Tüm yanlış cevapları kazanım bazlı gruplayan istatistik motoru (sunucu gerektirir)

---

## MEVCUT SAYFALARIN DURUM TABLOSU

| Sayfa | Durum | Not |
|-------|-------|-----|
| `/ogrenci` | ✅ Gerçek API | |
| `/ogrenci/hedef` | ⚠️ Kısmi | Net hesap motoru eksik |
| `/ogrenci/plan` | ✅ Gerçek API | |
| `/ogrenci/dersler` | ✅ Gerçek API | Demo data temizlendi, hata ekranı eklendi |
| `/ogrenci/dersler/[ders]` | ✅ Gerçek API | Demo data temizlendi, Anladım/Tekrar butonları düzeltildi |
| `/ogrenci/deneme` | ✅ Gerçek API | |
| `/ogrenci/deneme/[id]` | ✅ Gerçek API | |
| `/ogrenci/deneme/[id]/sonuc` | ✅ Gerçek API | Kazanım analizi bloğu eklendi |
| `/ogrenci/soru-bankasi` | ✅ Gerçek API | Benzer Soru butonu mevcut |
| `/ogrenci/mini-test` | ✅ Gerçek API | |
| `/ogrenci/video` | ✅ Gerçek API | Hız kontrolü + kaldığın yerden devam eklendi |
| `/ogrenci/rapor` | ✅ Gerçek API | Tahmini net, Zayıf kazanımlar, Koça Sor butonu, PDF çıktı eklendi |
| `/ogrenci/rozet` | ✅ Gerçek API | Türkiye Sıralaması tab'ı eklendi (filtreli) |
| `/ogrenci/profil` | ✅ Gerçek API | |
| `/ogrenci/zayif-kazanim` | ✅ Gerçek API | |
| `/ogrenci/koc` | ✅ Yeni Sayfa | Dijital Koç AI Chat arayüzü |
| `/ogrenci/forum` | ✅ Yeni Sayfa | Forum/Soru-Cevap, yanıt, beğeni, filtre |
| `/ogrenci/canli-ders` | ✅ Gerçek API | |
| `/ogretmen` | ✅ Gerçek API | |
| `/ogretmen/dersler` | ✅ Gerçek API | Demo data temizlendi, hata ekranı eklendi |
| `/ogretmen/icerik` | ✅ Gerçek API | |
| `/ogretmen/canli-ders` | ✅ Gerçek API | |
| `/ogretmen/siniflar` | ✅ Gerçek API | |
| `/ogretmen/odev` | ✅ Gerçek API | |
| `/ogretmen/analiz` | ⚠️ Kısmi | Başarı tahmin, toplu bildirim yok |
| `/ogretmen/mesaj` | ✅ Gerçek API | |
| `/ogretmen/profil` | ✅ Gerçek API | |
| `/veli` | ✅ Gerçek API | |
| `/veli/rapor` | ✅ Gerçek API | |
| `/veli/bildirim` | ✅ Gerçek API | |
| `/veli/profil` | ✅ Gerçek API | |
| `/admin` | ✅ Gerçek API | |
| `/admin/kullanicilar` | ✅ Gerçek API | |
| `/admin/ogretmen-onay` | ✅ Yeni Sayfa | pending/approved/rejected filtre, onayla/reddet, profil modal |
| `/admin/icerik` | ✅ Gerçek API | |
| `/admin/sorular` | ✅ Gerçek API | Yeniden yazıldı, gerçek soru API kullanıyor |
| `/admin/kupon` | ✅ Yeni Sayfa | Kupon oluştur, listele, aktif/pasif, sil |
| `/admin/raporlar` | ✅ Gerçek API | En Zor Kazanımlar bloğu eklendi |
| `/admin/ayarlar` | ✅ Gerçek API | |
| `/paketler` | ✅ Gerçek API | Promosyon kodu desteği eklendi |
| `/sifre-degistir` | ✅ Gerçek API | |
| `/sifre-sifirlama` | ✅ Gerçek API | |
| `/dogrulama` | ✅ Gerçek API | |

---

## EKSİK SAYFALAR (Hiç Yok)

| Sayfa | Öncelik | Açıklama |
|-------|---------|----------|
| `/okul` + alt sayfalar | 3 | Kurumsal okul paneli |
| `/ogrenci/forum` | 3 | Sosyal alan / soru-cevap |
| `/ogrenci/koc` | 3 | Dijital koç asistanı |
| `/admin/kupon` | 4 | Promosyon kodu yönetimi |
| `/admin/ogretmen-onay` | 2 | Öğretmen onay paneli |

---

## BACKEND API EKSİKLERİ

| Endpoint | Öncelik | Açıklama |
|----------|---------|----------|
| `GET /student/goal-engine` | 2 | Net hesap motoru |
| `GET /student/prediction` | 2 | Başarı tahmin modeli |
| `POST /plan/auto-tasks` | 2 | Zayıf kazanımdan otomatik görev |
| `GET /leaderboard/national` | 3 | Türkiye geneli sıralama |
| `GET /student/weekly-report/pdf` | 3 | Haftalık rapor PDF |
| `POST /payment/apply-coupon` | 4 | Kupon kodu |
| `POST /ai/generate-question` | 5 | AI soru üretimi |
| SMS entegrasyonu | 4 | Twilio/İleti şirketi |
| Google OAuth | 4 | Laravel Socialite |

---

*Bu dosya geliştirme sürecinde güncel tutulacaktır.*

# TERENCE EĞİTİM PLATFORMU — TASARIM GELİŞTİRME PLANI

> Kapsamlı tasarım analizi sonucu oluşturulmuştur.  
> Son güncelleme: 04.03.2026  
> Platform puanı: **7.9/10** → Hedef: **9.5/10**

---

## UYGULAMA SIRASI

```
ÖNCELİK 1 → Global Altyapı (Kırık Deneyimler)
ÖNCELİK 2 → Landing Page (Satış Güçlendirme)
ÖNCELİK 3 → Öğrenci Paneli (En Kritik Kullanıcı Grubu)
ÖNCELİK 4 → Paketler Sayfası
ÖNCELİK 5 → Öğretmen Paneli
ÖNCELİK 6 → Veli Paneli
ÖNCELİK 7 → Admin Paneli
ÖNCELİK 8 → Mikro-Animasyon ve Polish
```

---

## ÖNCELİK 1 — GLOBAL ALTYAPI (KIRIK DENEYİMLER)

### 1.1 Mobile Hamburger Menü — TAMAMEN KIRIK
- [ ] `DashboardHeader.tsx` → `Menu` / `X` ikonu ile hamburger butonu ekle
- [ ] `useState(false)` ile global `sidebarOpen` state'i yönet
- [ ] Sidebar'a `translate-x-[-100%] md:translate-x-0` geçiş animasyonu
- [ ] Açık sidebar arkasına backdrop overlay (`bg-black/40 backdrop-blur-sm`)
- [ ] Overlay'a tıklanınca sidebar kapansın
- [ ] `useEffect` ile route değişiminde sidebar otomatik kapansın
- **Etkilenen dosyalar:** `src/components/dashboard/DashboardHeader.tsx`, `src/components/dashboard/DashboardSidebar.tsx` (ve role-specific sidebar'lar)

### 1.2 Header Breadcrumb — SOL TARAF BOŞ
- [ ] `usePathname()` ile aktif sayfa başlığını ve ikonunu belirle
- [ ] `pathMap` objesi: `/ogrenci` → `{title: "Dashboard", icon: Home}` şeklinde
- [ ] Mobilde sidebar hamburger, masaüstünde breadcrumb göster
- **Etkilenen dosyalar:** `src/components/dashboard/DashboardHeader.tsx`

### 1.3 Sidebar Navigasyon Gruplandırması
- [ ] Öğrenci sidebar'ını 4 gruba ayır:
  - `📚 ÇALIŞMA` → Dashboard, Günlük Plan, Dersler, Video, Soru Bankası
  - `🎯 GELİŞİM` → Mini Test, Rozetler, Raporlar, Koç
  - `💬 İLETİŞİM` → Mesajlar, Bildirimler
  - `⚙️ HESAP` → Profil
- [ ] Section başlıkları: `text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-1`
- [ ] Grup aralarına `border-t border-slate-100 my-2` separator
- **Etkilenen dosyalar:** `src/components/dashboard/DashboardSidebar.tsx`

### 1.4 Sidebar Upgrade Widget (Free Plan)
- [ ] Sidebar alt kısmına paket upgrade widget ekle
- [ ] Koşul: `user.subscription_type === "free"` ise göster
- [ ] İçerik: `🆓 Ücretsiz Plan` badge + `"Pro özelliklerine bak →"` linki
- [ ] Tasarım: `bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-xl p-3`
- **Etkilenen dosyalar:** `src/components/dashboard/DashboardSidebar.tsx`

---

## ÖNCELİK 2 — LANDING PAGE (SATIŞ GÜÇLENDİRME)

### 2.1 Hero Section — Dashboard Mockup + Floating Cards
- [ ] Hero sağ tarafına browser mockup frame (CSS rounded top bar + 3 renkli daire)
- [ ] İçinde dashboard ekran görüntüsü veya styled mockup kartları
- [ ] 3 adet floating achievement card (`absolute` konumlu, `animate-float` animasyonu):
  - `"🎉 Ahmet doğru cevapladı!"` — sağ üst
  - `"🔥 15 günlük seri!"` — sol alt  
  - `"📈 Net: +8 bu hafta"` — sağ alt
- [ ] `@keyframes float` tanımı: `translateY(0) → translateY(-8px) → translateY(0)` 3s ease-in-out infinite
- **Etkilenen dosyalar:** `src/app/page.tsx` (HeroSection bileşeni)

### 2.2 Stats Bar — Count-Up Animasyonu
- [ ] `useIntersectionObserver` hook'u yaz
- [ ] Viewport'a girince `0 → hedef sayı` animasyonlu count-up
- [ ] `requestAnimationFrame` ile 1.5 saniyelik smooth animasyon
- [ ] `"50.000+"`, `"2.3M+"` gibi kısaltılmış formatlar için suffix desteği
- **Etkilenen dosyalar:** `src/app/page.tsx` (StatsBar bileşeni veya section)

### 2.3 Testimonial Section — Carousel + Yıldız Rating
- [ ] Her testimonial kartına ⭐⭐⭐⭐⭐ yıldız rating ekle (sarı dolu yıldızlar)
- [ ] Testimonial tipi achievement badge: `"LGS 2024 — 493 Net"` veya `"AYT — Tıp Kazandı"`
- [ ] Auto-play carousel: 4 saniyede bir sonraki karta geç
- [ ] Dot indicator (alt kısımda aktif nokta)
- [ ] Swipe/drag desteği (mouse ve touch)
- [ ] `"Pause on hover"` davranışı
- **Etkilenen dosyalar:** `src/app/page.tsx` (Testimonials bileşeni)

### 2.4 Sosyal Kanıt Marquee Bandı
- [ ] Stats bar altına CSS `marquee` animasyonlu başarı bandı
- [ ] İçerik: `"Ayşe T. LGS'de 487 net 🏆"` tipi mini rozetler (10-15 adet)
- [ ] `@keyframes marquee` ile sonsuz scroll (soldan sağa, yavaş)
- [ ] Hover'da duraksama
- [ ] İki kopya `[...items, ...items]` ile sonsuz döngü
- **Etkilenen dosyalar:** `src/app/page.tsx`

### 2.5 Feature Showcase — Tab'lı Ekran Görüntüsü
- [ ] Sol taraf: tıklanabilir özellik listesi (5-6 madde)
- [ ] Sağ taraf: seçili özelliğin mockup ekranı (fade-in geçiş)
- [ ] Her özellik için ikon + başlık + kısa açıklama
- [ ] Aktif özellik: `border-l-2 border-teal-500 bg-teal-50` highlight
- [ ] 5 saniyede bir otomatik geçiş
- **Etkilenen dosyalar:** `src/app/page.tsx` (Features bileşeni)

---

## ÖNCELİK 3 — ÖĞRENCİ PANELİ

### 3.1 Kişisel Karşılama + Streak Sayacı
- [ ] Dashboard'a kişisel karşılama bandı ekle (header'ın hemen altına)
- [ ] İçerik: `"Günaydın/İyi günler/İyi akşamlar, {isim}! 👋"` (saate göre)
- [ ] Streak widget: `🔥 {n} günlük seri` (renkler: 1-6: blue, 7-29: orange, 30+: purple)
- [ ] XP widget: `⚡ {xp} XP`
- [ ] Hedef widget: `🎯 %{oran} ilerlemede`
- [ ] Tasarım: `bg-gradient-to-r from-teal-600 to-teal-500` band, beyaz metin
- [ ] Bileşen: `src/components/dashboard/WelcomeBanner.tsx` (yeni)
- **Etkilenen dosyalar:** `src/app/ogrenci/page.tsx`, yeni `WelcomeBanner.tsx`

### 3.2 Dashboard Grafik — Recharts ile Gerçek Chart
- [ ] `recharts` paketi kur: `npm install recharts`
- [ ] Haftalık net bar chart: `BarChart` + `Bar` (pozitif: teal-500, negatif: red-400)
- [ ] Gerçek Y ekseni (`YAxis`), X ekseni gün isimleri (`XAxis`)
- [ ] Hover tooltip: `"Pazartesi: +6 net"` formatında
- [ ] Grid lines: `CartesianGrid strokeDasharray="3 3"` hafif gri
- [ ] Responsive: `ResponsiveContainer width="100%" height={200}`
- **Etkilenen dosyalar:** `src/app/ogrenci/page.tsx`

### 3.3 Rozet Sayfası — Progress Ring + Podium
- [ ] SVG circular progress ring her rozet kartına ekle:
  - Dış halka: `stroke-slate-200`
  - İç dolu halka: `stroke-teal-500 stroke-dasharray` ile dinamik
  - Ortada yüzde veya `"x/y"` metin
- [ ] Rozet kategorileri: `🏆 Başarı`, `⚡ Seri`, `📚 Ders`, `🎯 Hedef` tab'ları
- [ ] Top 3 liderboard podium: altın/gümüş/bronz yükseklikleri ile görsel podium
- [ ] Yeni kazanılan rozet için `canvas-confetti` veya CSS confetti animasyonu
- **Etkilenen dosyalar:** `src/app/ogrenci/rozet/page.tsx`

### 3.4 Mini Test — Error State + Exit Modal
- [ ] API hatasında error card ekle: ikon + "Test yüklenemedi" + "Tekrar dene" butonu
- [ ] Çıkış butonu için confirmation modal: `"Testi bırakmak istediğine emin misin?"`
- [ ] Soru geçiş animasyonu: `opacity-0 → opacity-100` + `translate-x-4 → translate-x-0`
- [ ] Süre dolmadan 30 sn kala: progress bar sarıya dönsün (`bg-amber-400`)
- [ ] Süre dolmadan 10 sn kala: kırmızıya dönsün + `animate-pulse`
- **Etkilenen dosyalar:** `src/app/ogrenci/mini-test/page.tsx`

### 3.5 Rapor Sayfası — Print CSS + Error State
- [ ] `@media print` CSS ekle: `print:hidden` class sidebar, header, export butonlarına
- [ ] Print'te sadece rapor içeriği görünsün
- [ ] `Promise.allSettled` yerine `try/catch` ile error state ekle
- [ ] Error banner tasarımı: kırmızı arka plan, `AlertCircle` ikon, "Yeniden Yükle" butonu
- **Etkilenen dosyalar:** `src/app/ogrenci/rapor/page.tsx`

### 3.6 Koç Sayfası — Yükseklik Fix + Textarea
- [ ] `h-[calc(100vh-0px)]` → `h-[calc(100vh-4rem)]` (64px header)
- [ ] Tek satır input → `<textarea>` auto-resize:
  - `min-h-[44px] max-h-[160px]`
  - `onInput` event ile `scrollHeight` hesapla
  - `Shift+Enter` ile satır atla, `Enter` ile gönder
- [ ] Mesajlara timestamp ekle: `"14:32"` formatı (küçük, `text-slate-400 text-xs`)
- [ ] "Konuşmayı temizle" butonu için confirmation alert
- **Etkilenen dosyalar:** `src/app/ogrenci/koc/page.tsx`

---

## ÖNCELİK 4 — PAKETLER SAYFASI

### 4.1 Özellik Karşılaştırma Tablosu
- [ ] Pricing card'larının altına karşılaştırma tablosu ekle
- [ ] Satırlar (özellikler): `Video Ders`, `Soru Bankası`, `AI Koç`, `Canlı Ders`, `PDF İndir`, `Öncelikli Destek`, `Öğretmen Desteği`
- [ ] Sütunlar: Free / Bronze / Plus / Pro
- [ ] Hücreler: `✓` (teal, bold) / `✗` (slate-300) / limit rakamı
- [ ] Tablo başlık satırı: koyu arka plan (`bg-slate-900 text-white`)
- [ ] "En Popüler" sütununu `bg-teal-50` ile vurgula
- **Etkilenen dosyalar:** `src/app/paketler/page.tsx`

### 4.2 FAQ Bölümü
- [ ] 6 adet soru-cevap accordion:
  1. "Yıllık plan peşin mi ödeniyor?" 
  2. "İptal edersem ne olur?"
  3. "Ücretsiz plan ne kadar sürer?"
  4. "İade politikası nedir?"
  5. "Birden fazla cihazda kullanabilir miyim?"
  6. "Öğretmene nasıl ulaşabilirim?"
- [ ] `useState` ile aktif soru index'i
- [ ] `ChevronDown` animasyonlu (`rotate-180` açıkken)
- [ ] Açılan içerik: `max-h-0 → max-h-96 overflow-hidden transition-all`
- **Etkilenen dosyalar:** `src/app/paketler/page.tsx`

---

## ÖNCELİK 5 — ÖĞRETMEN PANELİ

### 5.1 Dashboard Chart + Hızlı Ödev Widget
- [ ] Öğrenci net dağılımı `BarChart` (sınıf bazlı): recharts
- [ ] "Hızlı Ödev Ver" mini widget: sınıf seç dropdown → konu input → tarih seç → Gönder
- [ ] Widget tasarımı: `bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100`
- **Etkilenen dosyalar:** `src/app/ogretmen/page.tsx`

### 5.2 Sinıflar Sayfası — API Mapping Düzeltmesi
- [ ] `getClassStudents` yanıtını `TeacherStudent` interface'ine map et
- [ ] `net_score`, `risk_level`, `tasks_completed_today` alanlarını doğru eşleştir
- [ ] Tablo satırlarına hover highlight + tıklanabilir satır (side panel veya modal)
- **Etkilenen dosyalar:** `src/app/ogretmen/siniflar/page.tsx`

---

## ÖNCELİK 6 — VELİ PANELİ

### 6.1 Rapor Renk Tutarlılığı
- [ ] `blue-100 / text-blue-600` → `teal-100 / text-teal-600` ile değiştir
- [ ] Risk uyarısındaki `/paketler` satış linkini `"Öğretmeninizle iletişime geçin"` ile değiştir
- **Etkilenen dosyalar:** `src/app/veli/rapor/page.tsx`

### 6.2 Çoklu Çocuk UI (Eğer API Destekliyorsa)
- [ ] `useAuth` ile `user.children[]` kontrolü
- [ ] Birden fazla çocuk varsa: üstte segmented control / tab switcher
- [ ] Her çocuk için initials avatar + renk
- **Etkilenen dosyalar:** `src/app/veli/page.tsx`

---

## ÖNCELİK 7 — ADMİN PANELİ

### 7.1 Zaman Serisi Grafikleri
- [ ] Aylık gelir trendi: `AreaChart` (recharts)
- [ ] Günlük kayıt sayısı: `LineChart` (recharts)
- [ ] Renk: teal-500 fill, %20 opacity area fill
- **Etkilenen dosyalar:** `src/app/admin/page.tsx`

### 7.2 Empty State Tasarımları
- [ ] Tüm "veri yok" mesajlarını güçlendir:
  - SVG ikon (büyük, slate-200 renginde)
  - Başlık metni (slate-600, medium)
  - Açıklama (slate-400, small)
  - İsteğe bağlı CTA buton
- **Etkilenen dosyalar:** `src/app/admin/page.tsx`, diğer admin sayfaları

---

## ÖNCELİK 8 — MİKRO-ANİMASYON VE POLİSH

### 8.1 Global Toast Notification Sistemi
- [ ] `react-hot-toast` paketi kur: `npm install react-hot-toast`
- [ ] `src/app/layout.tsx` içine `<Toaster>` ekle (sağ üst, `position: "top-right"`)
- [ ] Toast config: `duration: 3000`, `style: { borderRadius: 12, fontFamily: "Inter" }`
- [ ] Tüm `alert()` çağrılarını ve inline hata mesajlarını toast ile değiştir
- **Etkilenen dosyalar:** `src/app/layout.tsx`, tüm API çağrısı yapan sayfalar

### 8.2 Shimmer Skeleton Efekti
- [ ] `globals.css`'e `@keyframes shimmer` tanımı ekle
- [ ] Tüm skeleton bileşenlerde `animate-shimmer` class kullan
- [ ] `background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%); background-size: 200px 100%; animation: shimmer 1.5s infinite`
- **Etkilenen dosyalar:** `src/app/globals.css`

### 8.3 Buton Press Efekti
- [ ] `globals.css`'e `.btn-press { active:scale-95 transition-transform }` ekle
- [ ] Tüm primary butonlara `active:scale-95` tailwind class'ı ekle

### 8.4 Sayfa Geçiş Animasyonu
- [ ] `src/app/layout.tsx` veya `src/components/PageTransition.tsx` (yeni)
- [ ] `opacity-0 animate-fadeIn` class ile ilk render animasyonu
- [ ] `globals.css`'e `@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }`

---

## DURUM TABLOSU

| # | Görev | Dosya | Durum | Etki |
|---|---|---|---|---|
| 1.1 | Mobile hamburger menü | DashboardHeader.tsx + Sidebar | ✅ TAMAMLANDI | 🔴 Kritik |
| 1.2 | Header breadcrumb | DashboardHeader.tsx | ✅ TAMAMLANDI | 🟠 Yüksek |
| 1.3 | Sidebar nav gruplandırması | DashboardSidebar.tsx | ✅ TAMAMLANDI | 🟠 Yüksek |
| 1.4 | Sidebar upgrade widget | DashboardSidebar.tsx | ✅ TAMAMLANDI | 🟡 Orta |
| 2.1 | Hero mockup + floating cards | HeroSection.tsx | ✅ TAMAMLANDI | 🟠 Yüksek |
| 2.2 | Stats count-up animasyonu | StatsBar.tsx | ✅ TAMAMLANDI | 🟡 Orta |
| 2.3 | Testimonial carousel + yıldız | TestimonialsSection.tsx | ✅ TAMAMLANDI | 🟠 Yüksek |
| 2.4 | Marquee sosyal kanıt bandı | StatsBar.tsx | ✅ TAMAMLANDI | 🟡 Orta |
| 2.5 | Feature showcase tab'lı | FeaturesSection.tsx | ✅ TAMAMLANDI | 🟡 Orta |
| 3.1 | Karşılama bandı + streak | ogrenci/page.tsx | ✅ TAMAMLANDI | 🟠 Yüksek |
| 3.2 | Recharts dashboard grafik (kurulum tamamlandı) | ogrenci/page.tsx | ✅ TAMAMLANDI | 🟠 Yüksek |
| 3.3 | Rozet progress ring + podium | ogrenci/rozet/page.tsx | ⬜ BEKLIYOR | 🟡 Orta |
| 3.4 | Mini test error + exit modal | ogrenci/mini-test/page.tsx | ✅ TAMAMLANDI | 🟠 Yüksek |
| 3.5 | Rapor print CSS + error state | ogrenci/rapor/page.tsx | ✅ TAMAMLANDI | 🟡 Orta |
| 3.6 | Koç yükseklik fix + textarea | ogrenci/koc/page.tsx | ✅ TAMAMLANDI | 🟠 Yüksek |
| 4.1 | Paket karşılaştırma tablosu | paketler/page.tsx | ✅ TAMAMLANDI | 🟠 Yüksek |
| 4.2 | Paket sayfası FAQ | paketler/page.tsx | ✅ TAMAMLANDI | 🟡 Orta |
| 5.1 | Öğretmen hızlı ödev widget | ogretmen/page.tsx | ✅ TAMAMLANDI | 🟡 Orta |
| 5.2 | Sinıflar API mapping | ogretmen/siniflar/page.tsx | ⬜ BEKLIYOR | 🟡 Orta |
| 6.1 | Veli rapor renk fix | veli/rapor/page.tsx | ✅ TAMAMLANDI | 🟡 Orta |
| 6.2 | Veli çoklu çocuk UI | veli/page.tsx | ⬜ BEKLIYOR | 🟡 Orta |
| 7.1 | Admin zaman serisi chart | admin/page.tsx | ⬜ BEKLIYOR | 🟡 Orta |
| 7.2 | Admin empty state tasarımı | admin/page.tsx | ⬜ BEKLIYOR | 🟡 Orta |
| 8.1 | Toast notification sistemi | layout.tsx | ✅ TAMAMLANDI | 🟠 Yüksek |
| 8.2 | Shimmer skeleton efekti | globals.css | ✅ TAMAMLANDI | 🟡 Orta |
| 8.3 | Buton press efekti | globals.css | ✅ TAMAMLANDI | 🟢 Düşük |
| 8.4 | Sayfa geçiş animasyonu | globals.css | ✅ TAMAMLANDI | 🟢 Düşük |

---

## BAĞIMLILIKLAR

```
recharts paketi gerekiyor  → 3.2, 5.1, 7.1 görevleri
react-hot-toast gerekiyor  → 8.1 görevi
canvas-confetti (isteğe bağlı) → 3.3 rozet animasyonu
```

---

## NOTLAR

- Tüm yeni bileşenler Tailwind CSS ile yazılacak (harici UI kütüphanesi eklenmeyecek)
- Recharts ve react-hot-toast dışında yeni paket eklenmeyecek
- Her görev tamamlandığında durum tablosunda `⬜ BEKLIYOR` → `✅ TAMAMLANDI` olarak güncellenir
- TypeScript hataları her görev sonrası `npx tsc --noEmit` ile kontrol edilir
- `npm run build` her 3-4 görevden sonra çalıştırılır

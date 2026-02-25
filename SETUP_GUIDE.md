# 🔧 PAKET 1 - KURULUM VE YAPILANDIRMA REHBERİ

**Platform:** TERENCE EĞİTİM (Nazliyavuz)  
**Tarih:** 19 Ekim 2025  
**Sürüm:** v1.1.0

---

## 📋 İÇİNDEKİLER

1. [Gereksinimler](#1-gereksinimler)
2. [Paket Kurulumu](#2-paket-kurulumu)
3. [Google Sign-In Yapılandırması](#3-google-sign-in-yapılandırması)
4. [Apple Sign-In Yapılandırması](#4-apple-sign-in-yapılandırması)
5. [Permissions Yapılandırması](#5-permissions-yapılandırması)
6. [Test](#6-test)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. GEREKSINIMLER

### Geliştirme Ortamı:
- ✅ Flutter SDK 3.8.1+
- ✅ Dart 3.0+
- ✅ Android Studio / VS Code
- ✅ Xcode 14+ (macOS - iOS development için)

### Hesaplar:
- ✅ Google Cloud Console Account (Google Sign-In için)
- ✅ Apple Developer Account (Apple Sign-In için - $99/yıl)
- ✅ Firebase Project (Push notifications + Google Sign-In)

### Cihazlar:
- ✅ Android cihaz/emulator (Test için)
- ✅ iOS gerçek cihaz (Apple Sign-In test için - emulator çalışmaz)

---

## 2. PAKET KURULUMU

### Adım 1: Paketleri İndir

```bash
cd nazliyavuz-platform/frontend/nazliyavuz_app
flutter pub get
```

**Yüklenen Paketler:**
- sign_in_with_apple: ^6.1.2
- flutter_webrtc: ^0.9.48+hotfix.1
- flutter_sound: ^9.2.13
- audio_waveforms: ^1.0.5
- path_provider: ^2.1.1

### Adım 2: iOS Pods (sadece macOS)

```bash
cd ios
pod install
cd ..
```

### Adım 3: Clean Build

```bash
flutter clean
flutter pub get
```

---

## 3. GOOGLE SIGN-IN YAPILANDIRMASI

### 📱 Android Yapılandırması

#### Adım 1: SHA-1 Fingerprint Al

```bash
cd android
./gradlew signingReport
```

**Output'ta şunu arayın:**
```
Variant: debug
Config: debug
Store: ~/.android/debug.keystore
Alias: AndroidDebugKey
SHA1: A1:B2:C3:D4:E5:F6:... ← BUNU KOPYALA
```

#### Adım 2: Firebase Console

1. https://console.firebase.google.com/ giriş yap
2. Projeyi seç (veya yeni oluştur)
3. Project Settings (⚙️) > General
4. Android app seç
5. "Add fingerprint" tıkla
6. SHA-1'i yapıştır
7. **Save**

#### Adım 3: google-services.json Güncelle

1. Firebase Console'da "Download google-services.json" tıkla
2. İndir
3. Dosyayı `android/app/` klasörüne kopyala (üzerine yaz)

#### Adım 4: OAuth Client ID

Firebase Console:
1. Authentication > Sign-in method
2. Google > Enable
3. Support email gir
4. Save

### 🍎 iOS Yapılandırması

#### Adım 1: Bundle ID Kontrol

Xcode'da:
1. `ios/Runner.xcworkspace` dosyasını aç
2. Runner seç (sol panel)
3. General tab
4. Bundle Identifier'ı kopyala  
   Örn: `com.nazliyavuz.app`

#### Adım 2: Firebase Console

1. Project Settings > iOS app
2. Bundle ID'yi kontrol et
3. **Download GoogleService-Info.plist**
4. `ios/Runner/` klasörüne kopyala (üzerine yaz)

#### Adım 3: URL Schemes

Xcode'da:
1. Runner > Info tab
2. URL Types > "+" tıkla
3. URL Schemes ekle:
   - `GoogleService-Info.plist`'i aç
   - `REVERSED_CLIENT_ID` değerini kopyala
   - Örn: `com.googleusercontent.apps.123456789-xxx`
   - URL Schemes'e yapıştır

---

## 4. APPLE SIGN-IN YAPILANDIRMASI

### ⚠️ Gereksinimler:
- Apple Developer Account ($99/yıl)
- macOS (Xcode gerekli)
- iOS gerçek cihaz (emulator çalışmaz)

### Adım 1: Xcode Capability

1. `ios/Runner.xcworkspace` dosyasını aç
2. Runner seç
3. "Signing & Capabilities" tab
4. "+ Capability" tıkla
5. "Sign in with Apple" seç

### Adım 2: Apple Developer Console

1. https://developer.apple.com/ giriş yap
2. Certificates, Identifiers & Profiles
3. Identifiers > App IDs
4. App ID'ni seç (Bundle ID ile eşleşen)
5. "Sign in with Apple" checkbox
6. **Save**

### Adım 3: Test

**Not:** Apple Sign-In **sadece iOS gerçek cihazda** çalışır!

```bash
# iOS cihazı bağla
flutter run -d <ios-device-id>

# Device ID bulmak için:
flutter devices
```

---

## 5. PERMISSIONS YAPILANDIRMASI

### 🍎 iOS Permissions (Info.plist)

Dosya: `ios/Runner/Info.plist`

```xml
<dict>
  <!-- Mevcut key'ler... -->
  
  <!-- Microphone Permission -->
  <key>NSMicrophoneUsageDescription</key>
  <string>Sesli mesaj göndermek ve video görüşme yapmak için mikrofon erişimi gerekli</string>
  
  <!-- Camera Permission -->
  <key>NSCameraUsageDescription</key>
  <string>Video görüşme yapmak için kamera erişimi gerekli</string>
  
  <!-- Photo Library Permission -->
  <key>NSPhotoLibraryUsageDescription</key>
  <string>Fotoğraf paylaşmak için galeri erişimi gerekli</string>
  
  <!-- File Access Permission -->
  <key>NSDocumentsFolderUsageDescription</key>
  <string>Dosya paylaşmak için erişim gerekli</string>
</dict>
```

### 🤖 Android Permissions (AndroidManifest.xml)

Dosya: `android/app/src/main/AndroidManifest.xml`

```xml
<manifest>
  <!-- Internet Permission (zaten var) -->
  <uses-permission android:name="android.permission.INTERNET" />
  
  <!-- Camera Permission -->
  <uses-permission android:name="android.permission.CAMERA" />
  
  <!-- Microphone Permission -->
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  
  <!-- Audio Settings -->
  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
  
  <!-- Storage Permission (Android 12 ve altı için) -->
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                   android:maxSdkVersion="32" />
  
  <!-- File Access (Android 13+) -->
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
  <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
  <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
  
  <application>
    <!-- ... -->
  </application>
</manifest>
```

---

## 6. TEST

### Test Adımları:

#### 1. Build ve Run

```bash
# Clean build
flutter clean
flutter pub get

# Android
flutter run -d android

# iOS
flutter run -d ios
```

#### 2. Google Sign-In Test

**Android:**
1. Login ekranını aç
2. "Google" butonuna tıkla
3. Google hesabını seç
4. İzinleri onayla
5. ✅ Ana sayfaya yönlendirilmeli

**iOS:**
1. Aynı adımlar
2. iOS'ta biraz daha hızlı çalışır

**Test Cases:**
- [ ] Yeni kullanıcı (ilk kez giriş)
- [ ] Mevcut kullanıcı (daha önce kaydolmuş)
- [ ] Email conflict (email zaten kayıtlı)
- [ ] Permission red (izin verilmezse)
- [ ] Network error (internet kesilirse)

#### 3. Apple Sign-In Test

**Sadece iOS Gerçek Cihaz:**
1. Login ekranını aç
2. "Apple" butonuna tıkla
3. Face ID / Touch ID ile onayla
4. Email paylaşımını seç
5. ✅ Ana sayfaya yönlendirilmeli

**Test Cases:**
- [ ] Yeni kullanıcı
- [ ] Mevcut kullanıcı
- [ ] Email gizle/paylaş seçenekleri
- [ ] İptal senaryosu

#### 4. Sesli Mesaj Test

**Kayıt:**
1. Chat ekranını aç
2. Mikrofon izni ver (ilk seferde sorar)
3. Mikrofon butonuna **basılı tut**
4. Konuş (birkaç saniye)
5. **Bırak**
6. ✅ Sesli mesaj gönderilmeli

**İptal:**
1. Basılı tut
2. **Sola kaydır**
3. ✅ "Ses kaydı iptal edildi" mesajı

**Oynatma:**
1. Sesli mesaj baloncuğuna tıkla
2. Play butonu - oynat/duraklat
3. Progress bar'ı kaydır - seek
4. Speed butonu - 1x → 1.5x → 2x
5. ✅ Tüm kontroller çalışmalı

**Test Cases:**
- [ ] Kısa mesaj (5 saniye)
- [ ] Uzun mesaj (1 dakika)
- [ ] Max duration (2 dakika - auto-stop)
- [ ] İptal (slide to cancel)
- [ ] Multiple sesler (1 tane çalmalı)
- [ ] Seek functionality
- [ ] Speed değişimi

#### 5. Video Görüşme Test

**Gereksinimler:**
- 2 cihaz (veya 1 emulator + 1 gerçek cihaz)
- İyi internet bağlantısı
- Her iki cihazda da farklı kullanıcılar

**Test Senaryosu:**
1. **Cihaz 1:** Öğretmen olarak giriş yap
2. **Cihaz 2:** Öğrenci olarak giriş yap
3. **Cihaz 1:** Chat aç, video call başlat
4. **Cihaz 2:** Incoming call notification (bekle)
5. **Cihaz 2:** Accept call
6. **Her İki Cihaz:** Video görüntüsü gelir mi?
7. **Test Controls:**
   - Mute/Unmute (ses gidiyor/geliyor mu?)
   - Video On/Off (video kapalı/açık)
   - Camera Switch (ön/arka)
   - End Call (düzgün kapanıyor mu?)

**Test Cases:**
- [ ] Video call başlatma
- [ ] Audio call başlatma
- [ ] Call yanıtlama
- [ ] Call reddetme
- [ ] Mute/unmute
- [ ] Video on/off
- [ ] Camera switch
- [ ] End call
- [ ] Connection quality (farklı network)
- [ ] Background handling
- [ ] Reconnection (network değişirse)

---

## 7. TROUBLESHOOTING

### Google Sign-In Issues

#### "PlatformException: sign_in_failed"
```
Sebep: SHA-1 fingerprint eksik veya yanlış
Çözüm:
1. SHA-1'i yeniden al: ./gradlew signingReport
2. Firebase'e ekle
3. google-services.json güncelle
4. Clean build: flutter clean && flutter pub get
```

#### "API not enabled"
```
Sebep: Google Sign-In API kapalı
Çözüm:
1. Google Cloud Console
2. APIs & Services > Enabled APIs
3. "Google Sign-In API" ara ve enable et
```

### Apple Sign-In Issues

#### "Not supported"
```
Sebep: Android veya iOS emulator'da çalıştırılıyor
Çözüm: iOS gerçek cihazda test et
```

#### "Capability missing"
```
Sebep: Xcode'da "Sign in with Apple" capability eklenmemiş
Çözüm: Xcode > Signing & Capabilities > + Capability
```

### Voice Message Issues

#### "Permission denied"
```
Sebep: Mikrofon izni verilmemiş
Çözüm:
Android: Ayarlar > Uygulamalar > Nazliyavuz > İzinler > Mikrofon
iOS: Ayarlar > Nazliyavuz > Mikrofon
```

#### "Recording failed"
```
Sebep: flutter_sound initialization hatası
Çözüm:
1. Uygulamayı tamamen kapat
2. Yeniden başlat
3. Hala hata: flutter clean && flutter run
```

### Video Call Issues

#### "Camera not available"
```
Sebep: Kamera izni yok veya başka uygulama kullanıyor
Çözüm:
1. İzinleri kontrol et
2. Diğer kamera kullanan uygulamaları kapat
3. Cihazı yeniden başlat
```

#### "Connection failed"
```
Sebep: Network problemi veya STUN server erişilemiyor
Çözüm:
1. İnternet bağlantısını kontrol et
2. WiFi yerine mobil data dene (veya tersi)
3. VPN kapalı olmalı
4. Firewall/Router ayarları kontrol et
```

#### "Black screen (no video)"
```
Sebep: WebRTC renderer initialization hatası
Çözüm:
1. Uygulamayı yeniden başlat
2. İzinleri kontrol et
3. flutter clean && flutter run
```

---

## 📱 HIZLI BAŞLANGIÇ

### 5 Dakikada Test:

```bash
# 1. Paketleri kur
flutter pub get

# 2. Run
flutter run

# 3. Login ekranında "Google" butonuna tıkla

# 4. Chat aç, mikrofon butonuna basılı tut → ses kaydet

# 5. Video call butonuna tıkla → test et
```

---

## ✅ TEST CHECKLIST

Tüm özellikleri test etmek için:

### Sosyal Medya:
- [ ] Google ile giriş (Android)
- [ ] Google ile giriş (iOS)
- [ ] Apple ile giriş (iOS - gerçek cihaz)
- [ ] Yeni kullanıcı otomatik kaydı
- [ ] Profil fotoğrafı sync

### Sesli Mesaj:
- [ ] Kayıt başlatma (basılı tut)
- [ ] İptal (sola kaydır)
- [ ] Gönderme (bırak)
- [ ] Oynatma (play/pause)
- [ ] Seek (progress bar)
- [ ] Speed (1x, 1.5x, 2x)

### Video Call:
- [ ] Call başlatma
- [ ] Call yanıtlama
- [ ] Video görünüyor
- [ ] Ses duyuluyor
- [ ] Mute/unmute
- [ ] Video on/off
- [ ] Camera switch
- [ ] End call

---

## 📞 DESTEK

Sorun yaşarsanız:

1. **Logları kontrol et:** `flutter logs`
2. **Clean build:** `flutter clean && flutter pub get`
3. **Cihazı yeniden başlat**
4. **İzinleri kontrol et**
5. **Internet bağlantısı**

---

**Hazırla yan:** AI Assistant  
**Platform:** Nazliyavuz (TERENCE EĞİTİM)  
**Sürüm:** v1.1.0


<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('curriculum_topics')->delete();
        DB::table('curriculum_units')->delete();
        DB::table('curriculum_subjects')->delete();

        $curriculum = $this->getCurriculum();

        foreach ($curriculum as $subjectData) {
            $subjectId = DB::table('curriculum_subjects')->insertGetId([
                'name'       => $subjectData['name'],
                'slug'       => $subjectData['slug'],
                'icon'       => $subjectData['icon'],
                'color'      => $subjectData['color'],
                'grade'      => $subjectData['grade'],
                'exam_type'  => $subjectData['exam_type'],
                'sort_order' => $subjectData['sort_order'],
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($subjectData['units'] as $uOrder => $unitData) {
                $unitId = DB::table('curriculum_units')->insertGetId([
                    'subject_id'  => $subjectId,
                    'title'       => $unitData['title'],
                    'description' => $unitData['description'] ?? null,
                    'meb_code'    => $unitData['meb_code'] ?? null,
                    'sort_order'  => $uOrder + 1,
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);

                foreach ($unitData['topics'] as $tOrder => $topicTitle) {
                    DB::table('curriculum_topics')->insert([
                        'unit_id'    => $unitId,
                        'title'      => is_array($topicTitle) ? $topicTitle['title'] : $topicTitle,
                        'meb_code'   => is_array($topicTitle) ? ($topicTitle['code'] ?? null) : null,
                        'sort_order' => $tOrder + 1,
                        'is_active'  => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('CurriculumSeeder: ' . count($curriculum) . ' ders eklendi.');
    }

    private function getCurriculum(): array
    {
        return [
            // ═══════════════════════════════════════════════════════
            // 9. SINIF
            // ═══════════════════════════════════════════════════════
            [
                'name' => 'Matematik', 'slug' => 'matematik-9',
                'icon' => '📐', 'color' => '#1565c0',
                'grade' => '9', 'exam_type' => 'all', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Sayılar', 'meb_code' => 'MAT.9.1', 'topics' => [
                        'Doğal Sayılar ve Bölünebilme', 'Tam Sayılar', 'Rasyonel Sayılar',
                        'İrrasyonel Sayılar', 'Gerçek Sayılar', 'Üslü İfadeler', 'Köklü İfadeler',
                    ]],
                    ['title' => 'Nicelikler ve Değişimler (Cebir)', 'meb_code' => 'MAT.9.2', 'topics' => [
                        'Cebirsel İfadeler', 'Denklemler', 'Eşitsizlikler',
                        'Oran ve Orantı', 'Yüzde ve Faiz', 'Mutlak Değer',
                    ]],
                    ['title' => 'Algoritma ve Bilişim', 'meb_code' => 'MAT.9.3', 'topics' => [
                        'Kümeler', 'Mantık', 'Venn Şemaları',
                    ]],
                    ['title' => 'Geometrik Şekiller', 'meb_code' => 'MAT.9.4', 'topics' => [
                        'Açılar ve Doğrular', 'Üçgenler', 'Dörtgenler',
                        'Çokgenler', 'Çevre ve Alan Hesabı',
                    ]],
                    ['title' => 'Eşlik ve Benzerlik', 'meb_code' => 'MAT.9.5', 'topics' => [
                        'Eşlik Kavramı', 'Benzerlik Kavramı', 'Özel Üçgenler',
                    ]],
                    ['title' => 'İstatistiksel Araştırma', 'meb_code' => 'MAT.9.6', 'topics' => [
                        'Veri Toplama ve Düzenleme', 'Merkezi Eğilim Ölçüleri',
                        'Yaygınlık Ölçüleri', 'Grafikler',
                    ]],
                    ['title' => 'Veri Bilimi ve Olasılık', 'meb_code' => 'MAT.9.7', 'topics' => [
                        'Olasılık Temelleri', 'Basit Olayların Olasılığı',
                        'Bileşik Olaylar',
                    ]],
                ],
            ],
            [
                'name' => 'Fizik', 'slug' => 'fizik-9',
                'icon' => '⚡', 'color' => '#6a1b9a',
                'grade' => '9', 'exam_type' => 'all', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Fizik Bilimine Giriş', 'meb_code' => 'FİZ.9.1', 'topics' => [
                        'Fiziğin Gelişimi', 'Fizik ve Teknoloji', 'Ölçme ve Birimler',
                        'Birimlerin Dönüşümü', 'Fiziksel Büyüklükler',
                    ]],
                    ['title' => 'Kuvvet ve Hareket', 'meb_code' => 'FİZ.9.2', 'topics' => [
                        'Kuvvet ve Etkileri', 'Newton\'un Hareket Yasaları', 'Sürtünme Kuvveti',
                        'Düzgün Doğrusal Hareket', 'Düzgün İvmeli Hareket',
                        'Serbest Düşme', 'Yatay Atış',
                    ]],
                    ['title' => 'Akışkanlar', 'meb_code' => 'FİZ.9.3', 'topics' => [
                        'Basınç Kavramı', 'Sıvı Basıncı', 'Atmosfer Basıncı',
                        'Pascal İlkesi', 'Kaldırma Kuvveti', 'Arşimet Prensibi',
                    ]],
                    ['title' => 'Enerji', 'meb_code' => 'FİZ.9.4', 'topics' => [
                        'İş ve Güç', 'Kinetik Enerji', 'Potansiyel Enerji',
                        'Enerjinin Korunumu', 'Enerji Dönüşümleri', 'Yenilenebilir Enerji',
                    ]],
                ],
            ],
            [
                'name' => 'Kimya', 'slug' => 'kimya-9',
                'icon' => '🧪', 'color' => '#e65100',
                'grade' => '9', 'exam_type' => 'all', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Kimya Bilimine Giriş', 'meb_code' => 'KİM.9.1', 'topics' => [
                        'Kimyanın Önemi', 'Madde ve Özellikleri', 'Saf Maddeler ve Karışımlar',
                        'Fiziksel ve Kimyasal Değişimler', 'Karışımların Ayrılması',
                    ]],
                    ['title' => 'Atom ve Periyodik Sistem', 'meb_code' => 'KİM.9.2', 'topics' => [
                        'Atom Modelleri', 'Proton-Nötron-Elektron', 'Atom Numarası ve Kütle Numarası',
                        'İzotoplar', 'Periyodik Tablo', 'Elektron Dizilimi',
                    ]],
                    ['title' => 'Kimyasal Bağlar ve Bileşikler', 'meb_code' => 'KİM.9.3', 'topics' => [
                        'İyonik Bağ', 'Kovalent Bağ', 'Metalik Bağ',
                        'İyonik Bileşikler', 'Moleküler Bileşikler', 'Adlandırma',
                    ]],
                ],
            ],
            [
                'name' => 'Biyoloji', 'slug' => 'biyoloji-9',
                'icon' => '🌿', 'color' => '#2e7d32',
                'grade' => '9', 'exam_type' => 'all', 'sort_order' => 4,
                'units' => [
                    ['title' => 'Yaşam Bilimine Giriş', 'meb_code' => 'BİYO.9.1', 'topics' => [
                        'Biyoloji Nedir?', 'Bilimsel Yöntem', 'Canlıların Özellikleri',
                        'Canlıların Sınıflandırılması', 'Biyoçeşitlilik',
                    ]],
                    ['title' => 'Hücre', 'meb_code' => 'BİYO.9.2', 'topics' => [
                        'Hücre Teorisi', 'Prokaryot ve Ökaryot Hücreler', 'Hücre Organelleri',
                        'Hücre Zarı ve Madde Geçişi', 'Hücre Döngüsü', 'Mitoz Bölünme',
                    ]],
                ],
            ],
            [
                'name' => 'Türk Dili ve Edebiyatı', 'slug' => 'turkce-edebiyat-9',
                'icon' => '📖', 'color' => '#c62828',
                'grade' => '9', 'exam_type' => 'all', 'sort_order' => 5,
                'units' => [
                    ['title' => 'Güzel Sanatlar ve Edebiyat', 'meb_code' => 'TDE.9.1', 'topics' => [
                        'Edebiyat ve Sanat', 'Dil ve Edebiyat', 'Edebiyatın İşlevi',
                    ]],
                    ['title' => 'Şiir', 'meb_code' => 'TDE.9.2', 'topics' => [
                        'Şiirde Yapı', 'Ses Bilgisi', 'Anlam ve Yorum',
                        'Nazım Şekilleri', 'Nazım Türleri',
                    ]],
                    ['title' => 'Hikâye', 'meb_code' => 'TDE.9.3', 'topics' => [
                        'Hikâyede Yapı', 'Anlatıcı ve Bakış Açısı', 'Kişiler ve Ortam',
                        'Olay Örgüsü', 'Türk Hikâyeciliği',
                    ]],
                    ['title' => 'Roman', 'meb_code' => 'TDE.9.4', 'topics' => [
                        'Romanda Yapı', 'Roman Türleri', 'Dünya Edebiyatında Roman',
                        'Türk Edebiyatında Roman',
                    ]],
                    ['title' => 'Destan ve Efsane', 'meb_code' => 'TDE.9.5', 'topics' => [
                        'Destan Türleri', 'Türk Destanları', 'Efsaneler',
                    ]],
                    ['title' => 'Dil Bilgisi', 'meb_code' => 'TDE.9.6', 'topics' => [
                        'Sözcük Türleri', 'Cümle Ögeleri', 'Cümle Türleri',
                        'Yazım Kuralları', 'Noktalama İşaretleri',
                    ]],
                ],
            ],
            [
                'name' => 'Tarih', 'slug' => 'tarih-9',
                'icon' => '🏛️', 'color' => '#4e342e',
                'grade' => '9', 'exam_type' => 'all', 'sort_order' => 6,
                'units' => [
                    ['title' => 'Tarih Bilimi', 'meb_code' => 'TAR.9.1', 'topics' => [
                        'Tarihin Tanımı ve Önemi', 'Tarih Metodolojisi', 'Takvim Sistemleri',
                    ]],
                    ['title' => 'Uygarlığın Doğuşu', 'meb_code' => 'TAR.9.2', 'topics' => [
                        'İlk Uygarlıklar', 'Mezopotamya', 'Mısır Uygarlığı',
                        'Anadolu Uygarlıkları', 'Antik Yunan',
                    ]],
                    ['title' => 'İslam Medeniyeti', 'meb_code' => 'TAR.9.3', 'topics' => [
                        'İslamiyet\'in Doğuşu', 'Dört Halife Dönemi', 'Emeviler ve Abbasiler',
                    ]],
                    ['title' => 'Türklerin İslamiyet\'i Kabulü', 'meb_code' => 'TAR.9.4', 'topics' => [
                        'İlk Müslüman Türk Devletleri', 'Karahanlılar', 'Gazneliler',
                        'Büyük Selçuklu Devleti',
                    ]],
                    ['title' => 'Türkiye Tarihi', 'meb_code' => 'TAR.9.5', 'topics' => [
                        'Anadolu\'nun Türkleşmesi', 'Anadolu Beylikleri', 'Osmanlı Kuruluş',
                    ]],
                ],
            ],
            [
                'name' => 'Coğrafya', 'slug' => 'cografya-9',
                'icon' => '🌍', 'color' => '#01579b',
                'grade' => '9', 'exam_type' => 'all', 'sort_order' => 7,
                'units' => [
                    ['title' => 'Doğa ve İnsan', 'meb_code' => 'COĞ.9.1', 'topics' => [
                        'Coğrafyanın Önemi', 'Dünya\'nın Şekli ve Hareketleri', 'Harita Bilgisi',
                        'Koordinat Sistemi',
                    ]],
                    ['title' => 'Beşeri Sistemler', 'meb_code' => 'COĞ.9.2', 'topics' => [
                        'Nüfus Kavramı', 'Nüfus Artışı', 'Göç', 'Yerleşme Tipleri',
                    ]],
                    ['title' => 'Küresel Ortam', 'meb_code' => 'COĞ.9.3', 'topics' => [
                        'İklim Elemanları', 'İklim Tipleri', 'Bitki Örtüsü', 'Toprak',
                    ]],
                    ['title' => 'Türkiye Fiziki Coğrafyası', 'meb_code' => 'COĞ.9.4', 'topics' => [
                        'Türkiye\'nin Konumu', 'Yeryüzü Şekilleri', 'Akarsular ve Göller',
                        'Türkiye İklimi',
                    ]],
                    ['title' => 'Çevre ve Toplum', 'meb_code' => 'COĞ.9.5', 'topics' => [
                        'Doğal Afetler', 'Çevre Sorunları', 'Sürdürülebilir Kalkınma',
                    ]],
                ],
            ],

            // ═══════════════════════════════════════════════════════
            // 10. SINIF
            // ═══════════════════════════════════════════════════════
            [
                'name' => 'Matematik', 'slug' => 'matematik-10',
                'icon' => '📐', 'color' => '#1565c0',
                'grade' => '10', 'exam_type' => 'all', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Fonksiyonlar', 'meb_code' => 'MAT.10.1', 'topics' => [
                        'Fonksiyon Kavramı', 'Fonksiyon Türleri', 'Bileşke Fonksiyon',
                        'Ters Fonksiyon', 'Fonksiyon Grafikleri',
                    ]],
                    ['title' => 'Polinomlar', 'meb_code' => 'MAT.10.2', 'topics' => [
                        'Polinom Kavramı', 'Polinom İşlemleri', 'Özdeşlikler',
                        'Çarpanlara Ayırma', 'Polinom Denklemleri',
                    ]],
                    ['title' => 'İkinci Dereceden Denklemler', 'meb_code' => 'MAT.10.3', 'topics' => [
                        'İkinci Dereceden Denklemler', 'Köklerin Özellikleri',
                        'Parabol', 'İkinci Derece Eşitsizlikler',
                    ]],
                    ['title' => 'Analitik Geometri', 'meb_code' => 'MAT.10.4', 'topics' => [
                        'Koordinat Sistemi', 'Doğrunun Denklemi', 'İki Doğrunun Konumu',
                        'Çemberin Denklemi',
                    ]],
                    ['title' => 'Trigonometri', 'meb_code' => 'MAT.10.5', 'topics' => [
                        'Trigonometrik Oranlar', 'Trigonometrik Fonksiyonlar',
                        'Sinüs ve Kosinüs Teoremi', 'Alan Formülleri',
                    ]],
                    ['title' => 'Olasılık ve İstatistik', 'meb_code' => 'MAT.10.6', 'topics' => [
                        'Sayma Teknikleri', 'Permütasyon', 'Kombinasyon',
                        'Binom Açılımı', 'Olasılık Hesabı',
                    ]],
                ],
            ],
            [
                'name' => 'Fizik', 'slug' => 'fizik-10',
                'icon' => '⚡', 'color' => '#6a1b9a',
                'grade' => '10', 'exam_type' => 'all', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Elektrik ve Manyetizma', 'meb_code' => 'FİZ.10.1', 'topics' => [
                        'Elektrik Yükü', 'Coulomb Yasası', 'Elektrik Alan',
                        'Elektrik Potansiyel', 'Sığa ve Kondansatör',
                    ]],
                    ['title' => 'Elektrik Akımı', 'meb_code' => 'FİZ.10.2', 'topics' => [
                        'Ohm Yasası', 'Direnç Bağlantıları', 'Kirchhoff Yasaları',
                        'Devre Analizi', 'Elektrik Gücü',
                    ]],
                    ['title' => 'Manyetik Alan', 'meb_code' => 'FİZ.10.3', 'topics' => [
                        'Manyetik Alan', 'Manyetik Kuvvet', 'Ampere Yasası',
                        'Elektromanyetik İndüksiyon',
                    ]],
                    ['title' => 'Dalga Mekaniği', 'meb_code' => 'FİZ.10.4', 'topics' => [
                        'Mekanik Dalgalar', 'Ses Dalgaları', 'Rezonans',
                        'Doppler Etkisi',
                    ]],
                ],
            ],
            [
                'name' => 'Kimya', 'slug' => 'kimya-10',
                'icon' => '🧪', 'color' => '#e65100',
                'grade' => '10', 'exam_type' => 'all', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Kimyasal Hesaplamalar', 'meb_code' => 'KİM.10.1', 'topics' => [
                        'Mol Kavramı', 'Kimyasal Formüller', 'Kimyasal Denklemler',
                        'Stokiyometri', 'Verim Hesabı',
                    ]],
                    ['title' => 'Gazlar', 'meb_code' => 'KİM.10.2', 'topics' => [
                        'Gaz Yasaları', 'İdeal Gaz Denklemi', 'Dalton Kısmi Basınç',
                    ]],
                    ['title' => 'Sıvılar ve Çözeltiler', 'meb_code' => 'KİM.10.3', 'topics' => [
                        'Çözünme', 'Derişim Hesapları', 'Koligatif Özellikler',
                    ]],
                    ['title' => 'Tepkime Hızı', 'meb_code' => 'KİM.10.4', 'topics' => [
                        'Tepkime Hızı', 'Hız Sabitesi', 'Aktivasyon Enerjisi',
                        'Katalizörler',
                    ]],
                ],
            ],
            [
                'name' => 'Biyoloji', 'slug' => 'biyoloji-10',
                'icon' => '🌿', 'color' => '#2e7d32',
                'grade' => '10', 'exam_type' => 'all', 'sort_order' => 4,
                'units' => [
                    ['title' => 'Kalıtım', 'meb_code' => 'BİYO.10.1', 'topics' => [
                        'Mendel Genetiği', 'Kalıtım Çeşitleri', 'Kan Grupları',
                        'Cinsiyet Bağlantılı Kalıtım', 'Mutasyon',
                    ]],
                    ['title' => 'Ekosistem Ekolojisi', 'meb_code' => 'BİYO.10.2', 'topics' => [
                        'Ekosistem Bileşenleri', 'Madde Döngüleri', 'Enerji Akışı',
                        'Popülasyon Ekolojisi', 'Biyom Çeşitliliği',
                    ]],
                    ['title' => 'Bitki Biyolojisi', 'meb_code' => 'BİYO.10.3', 'topics' => [
                        'Bitki Dokuları', 'Fotosentez', 'Solunum',
                        'Bitki Büyümesi', 'Üreme',
                    ]],
                ],
            ],

            // ═══════════════════════════════════════════════════════
            // 11. SINIF
            // ═══════════════════════════════════════════════════════
            [
                'name' => 'Matematik', 'slug' => 'matematik-11',
                'icon' => '📐', 'color' => '#1565c0',
                'grade' => '11', 'exam_type' => 'all', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Logaritma', 'meb_code' => 'MAT.11.1', 'topics' => [
                        'Logaritma Tanımı', 'Logaritma Özellikleri', 'Logaritmik Denklemler',
                        'Logaritmik Eşitsizlikler',
                    ]],
                    ['title' => 'Trigonometri (İleri)', 'meb_code' => 'MAT.11.2', 'topics' => [
                        'Toplam-Fark Formülleri', 'Çarpım-Yarı Açı Formülleri',
                        'Trigonometrik Denklemler',
                    ]],
                    ['title' => 'Diziler', 'meb_code' => 'MAT.11.3', 'topics' => [
                        'Aritmetik Diziler', 'Geometrik Diziler', 'Sonsuz Geometric Seriler',
                    ]],
                    ['title' => 'Karmaşık Sayılar', 'meb_code' => 'MAT.11.4', 'topics' => [
                        'Karmaşık Sayı Tanımı', 'Karmaşık Sayılarda İşlemler',
                        'Karmaşık Sayının Modülü',
                    ]],
                    ['title' => 'Limit', 'meb_code' => 'MAT.11.5', 'topics' => [
                        'Limit Kavramı', 'Limit Teoremler', 'Süreklilik',
                        'Belirsiz Formlar',
                    ]],
                    ['title' => 'Türev', 'meb_code' => 'MAT.11.6', 'topics' => [
                        'Türev Tanımı', 'Türev Formülleri', 'Zincir Kuralı',
                        'Uygulamalar: Maksimum-Minimum', 'Grafiğin Yorumu',
                    ]],
                ],
            ],
            [
                'name' => 'Fizik', 'slug' => 'fizik-11',
                'icon' => '⚡', 'color' => '#6a1b9a',
                'grade' => '11', 'exam_type' => 'all', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Çembersel Hareket ve Açısal Kinematik', 'meb_code' => 'FİZ.11.1', 'topics' => [
                        'Çembersel Hareket', 'Merkezcil İvme', 'Açısal Hız',
                    ]],
                    ['title' => 'Kütle Çekimi', 'meb_code' => 'FİZ.11.2', 'topics' => [
                        'Newton\'un Kütle Çekim Yasası', 'Kepler\'in Yasaları',
                        'Uydu Hareketi',
                    ]],
                    ['title' => 'Basit Harmonik Hareket', 'meb_code' => 'FİZ.11.3', 'topics' => [
                        'BHH Tanımı', 'Yay-Kütle Sistemi', 'Sarkaç',
                    ]],
                    ['title' => 'Dalgalar ve Optik', 'meb_code' => 'FİZ.11.4', 'topics' => [
                        'Işığın Yapısı', 'Yansıma', 'Kırılma', 'Aynalar', 'Mercekler',
                    ]],
                ],
            ],
            [
                'name' => 'Kimya', 'slug' => 'kimya-11',
                'icon' => '🧪', 'color' => '#e65100',
                'grade' => '11', 'exam_type' => 'all', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Kimyasal Denge', 'meb_code' => 'KİM.11.1', 'topics' => [
                        'Denge Kavramı', 'Kc ve Kp', 'Le Chatelier İlkesi',
                        'Çözünürlük Dengesi',
                    ]],
                    ['title' => 'Asit-Baz Dengesi', 'meb_code' => 'KİM.11.2', 'topics' => [
                        'Arrhenius ve Brønsted-Lowry', 'pH Hesabı', 'Tampon Çözeltiler',
                        'Hidroliz', 'Nötralizasyon',
                    ]],
                    ['title' => 'Elektrokimya', 'meb_code' => 'KİM.11.3', 'topics' => [
                        'Redoks Tepkimeleri', 'Galvani Pili', 'Elektroliz',
                        'Korozyon',
                    ]],
                    ['title' => 'Organik Kimya (Temel)', 'meb_code' => 'KİM.11.4', 'topics' => [
                        'Hidrokarbonlar', 'Alkanlar-Alkenler-Alkinler', 'Aromatik Bileşikler',
                        'Fonksiyonel Gruplar', 'Alkoller ve Eterler',
                    ]],
                ],
            ],
            [
                'name' => 'Biyoloji', 'slug' => 'biyoloji-11',
                'icon' => '🌿', 'color' => '#2e7d32',
                'grade' => '11', 'exam_type' => 'all', 'sort_order' => 4,
                'units' => [
                    ['title' => 'İnsan Fizyolojisi I', 'meb_code' => 'BİYO.11.1', 'topics' => [
                        'Sinir Sistemi', 'Endokrin Sistem', 'Duyu Organları',
                    ]],
                    ['title' => 'İnsan Fizyolojisi II', 'meb_code' => 'BİYO.11.2', 'topics' => [
                        'Destek ve Hareket Sistemi', 'Dolaşım Sistemi', 'Solunum Sistemi',
                        'Sindirim Sistemi', 'Boşaltım Sistemi',
                    ]],
                    ['title' => 'Üreme ve Gelişim', 'meb_code' => 'BİYO.11.3', 'topics' => [
                        'Üreme Sistemi', 'Mayoz Bölünme', 'Embriyo Gelişimi',
                    ]],
                ],
            ],

            // ═══════════════════════════════════════════════════════
            // 12. SINIF
            // ═══════════════════════════════════════════════════════
            [
                'name' => 'Matematik', 'slug' => 'matematik-12',
                'icon' => '📐', 'color' => '#1565c0',
                'grade' => '12', 'exam_type' => 'all', 'sort_order' => 1,
                'units' => [
                    ['title' => 'İntegral', 'meb_code' => 'MAT.12.1', 'topics' => [
                        'Belirsiz İntegral', 'Belirli İntegral', 'Alan Hesabı',
                        'Hacim Hesabı',
                    ]],
                    ['title' => 'Diziler ve Seriler', 'meb_code' => 'MAT.12.2', 'topics' => [
                        'Aritmetik Seriler', 'Geometrik Seriler', 'Sonsuz Seriler',
                    ]],
                    ['title' => 'Olasılık (İleri)', 'meb_code' => 'MAT.12.3', 'topics' => [
                        'Koşullu Olasılık', 'Bayes Teoremi', 'Binom Dağılımı',
                    ]],
                    ['title' => 'Analitik Geometri (İleri)', 'meb_code' => 'MAT.12.4', 'topics' => [
                        'Konik Kesitler', 'Parabol Denklemi', 'Elips ve Hiperbol',
                    ]],
                ],
            ],

            // ═══════════════════════════════════════════════════════
            // TYT — Tüm Sınıflar
            // ═══════════════════════════════════════════════════════
            [
                'name' => 'TYT Matematik', 'slug' => 'tyt-matematik',
                'icon' => '📐', 'color' => '#1565c0',
                'grade' => 'all', 'exam_type' => 'TYT', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Temel Kavramlar', 'meb_code' => 'TYT.MAT.1', 'topics' => [
                        'Sayı Basamakları', 'Bölünebilme Kuralları', 'EBOB-EKOK',
                        'Rasyonel Sayılar', 'Üslü Sayılar', 'Köklü Sayılar',
                    ]],
                    ['title' => 'Cebir', 'meb_code' => 'TYT.MAT.2', 'topics' => [
                        'Birinci Dereceden Denklemler', 'Eşitsizlikler', 'Mutlak Değer',
                        'Oran-Orantı', 'Yüzde-Faiz-Kâr-Zarar', 'Karışım Problemleri',
                    ]],
                    ['title' => 'Mantık ve Kümeler', 'meb_code' => 'TYT.MAT.3', 'topics' => [
                        'Mantık Bağlaçları', 'Önerme Tabloları', 'Kümeler', 'Venn Şemaları',
                    ]],
                    ['title' => 'Fonksiyonlar', 'meb_code' => 'TYT.MAT.4', 'topics' => [
                        'Fonksiyon Tanımı', 'Fonksiyon Türleri', 'Bileşke ve Ters',
                    ]],
                    ['title' => 'Sayma ve Olasılık', 'meb_code' => 'TYT.MAT.5', 'topics' => [
                        'Temel Sayma', 'Permütasyon', 'Kombinasyon', 'Olasılık',
                    ]],
                    ['title' => 'Geometri', 'meb_code' => 'TYT.GEO.1', 'topics' => [
                        'Temel Geometri', 'Üçgenler', 'Özel Üçgenler', 'Dörtgenler',
                        'Çokgenler', 'Çevre-Alan', 'Çember ve Daire',
                    ]],
                    ['title' => 'Analitik Geometri', 'meb_code' => 'TYT.GEO.2', 'topics' => [
                        'Koordinat Sistemi', 'Doğrunun Denklemi', 'Analitik Alan',
                    ]],
                    ['title' => 'Veri ve İstatistik', 'meb_code' => 'TYT.MAT.6', 'topics' => [
                        'Merkezi Eğilim', 'Grafikler', 'Yorumlama',
                    ]],
                ],
            ],
            [
                'name' => 'TYT Türkçe', 'slug' => 'tyt-turkce',
                'icon' => '📖', 'color' => '#c62828',
                'grade' => 'all', 'exam_type' => 'TYT', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Sözcükte Anlam', 'meb_code' => 'TYT.TRK.1', 'topics' => [
                        'Gerçek-Mecaz Anlam', 'Çok Anlamlılık', 'Eş-Zıt Anlam',
                        'Deyimler', 'Atasözleri',
                    ]],
                    ['title' => 'Cümlede Anlam', 'meb_code' => 'TYT.TRK.2', 'topics' => [
                        'Cümlede Anlam İlişkileri', 'Neden-Sonuç', 'Amaç-Araç',
                        'Koşul', 'Karşılaştırma',
                    ]],
                    ['title' => 'Paragraf', 'meb_code' => 'TYT.TRK.3', 'topics' => [
                        'Ana Düşünce', 'Yardımcı Düşünce', 'Paragraf Yapısı',
                        'Anlatım Teknikleri', 'Paragraf Tamamlama',
                    ]],
                    ['title' => 'Ses ve Yazım Bilgisi', 'meb_code' => 'TYT.TRK.4', 'topics' => [
                        'Ses Olayları', 'Yazım Kuralları', 'Noktalama İşaretleri',
                    ]],
                    ['title' => 'Dil Bilgisi', 'meb_code' => 'TYT.TRK.5', 'topics' => [
                        'Sözcük Türleri', 'Fiiller', 'Cümle Ögeleri', 'Cümle Türleri',
                        'Anlatım Bozuklukları',
                    ]],
                ],
            ],
            [
                'name' => 'TYT Fen Bilimleri', 'slug' => 'tyt-fen',
                'icon' => '🔬', 'color' => '#2e7d32',
                'grade' => 'all', 'exam_type' => 'TYT', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Fizik (TYT)', 'meb_code' => 'TYT.FEN.FİZ', 'topics' => [
                        'Madde ve Özellikleri', 'Kuvvet-Hareket', 'Enerji', 'Isı-Sıcaklık',
                        'Elektrostatik', 'Basınç ve Kaldırma', 'Dalga-Optik',
                    ]],
                    ['title' => 'Kimya (TYT)', 'meb_code' => 'TYT.FEN.KİM', 'topics' => [
                        'Atom ve Periyodik', 'Bağlar', 'Mol-Hesaplama', 'Karışımlar',
                        'Asit-Baz-Tuz', 'Günlük Kimya',
                    ]],
                    ['title' => 'Biyoloji (TYT)', 'meb_code' => 'TYT.FEN.BİYO', 'topics' => [
                        'Hücre', 'Canlıların Sınıflandırılması', 'Kalıtım Temelleri',
                        'Ekosistem', 'Bölünme',
                    ]],
                ],
            ],
            [
                'name' => 'TYT Sosyal Bilimler', 'slug' => 'tyt-sosyal',
                'icon' => '🏛️', 'color' => '#4e342e',
                'grade' => 'all', 'exam_type' => 'TYT', 'sort_order' => 4,
                'units' => [
                    ['title' => 'Tarih (TYT)', 'meb_code' => 'TYT.SOS.TAR', 'topics' => [
                        'İlk Uygarlıklar', 'İslam Tarihi', 'Osmanlı', 'Kurtuluş Savaşı',
                        'Atatürk İlkeleri',
                    ]],
                    ['title' => 'Coğrafya (TYT)', 'meb_code' => 'TYT.SOS.COĞ', 'topics' => [
                        'Harita', 'İklim', 'Nüfus-Yerleşme', 'Türkiye Coğrafyası', 'Afetler',
                    ]],
                    ['title' => 'Felsefe (TYT)', 'meb_code' => 'TYT.SOS.FEL', 'topics' => [
                        'Bilgi Felsefesi', 'Varlık Felsefesi', 'Ahlak Felsefesi',
                        'Din Felsefesi',
                    ]],
                ],
            ],

            // ═══════════════════════════════════════════════════════
            // AYT
            // ═══════════════════════════════════════════════════════
            [
                'name' => 'AYT Matematik', 'slug' => 'ayt-matematik',
                'icon' => '📐', 'color' => '#0d47a1',
                'grade' => 'all', 'exam_type' => 'AYT', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Fonksiyonlar (AYT)', 'meb_code' => 'AYT.MAT.1', 'topics' => [
                        'Fonksiyon Türleri', 'Bileşke-Ters Fonksiyon', 'Fonksiyon Grafikleri',
                    ]],
                    ['title' => 'Polinomlar (AYT)', 'meb_code' => 'AYT.MAT.2', 'topics' => [
                        'Polinom İşlemleri', 'Özdeşlikler', 'Çarpanlara Ayırma',
                    ]],
                    ['title' => 'Logaritma (AYT)', 'meb_code' => 'AYT.MAT.3', 'topics' => [
                        'Logaritma Özellikleri', 'Logaritmik Denklemler', 'Üstel-Logaritmik',
                    ]],
                    ['title' => 'Trigonometri (AYT)', 'meb_code' => 'AYT.MAT.4', 'topics' => [
                        'Trigonometrik Fonksiyonlar', 'Ters Trigonometrik', 'Toplam-Fark Formülleri',
                        'Sinüs-Kosinüs Teoremi',
                    ]],
                    ['title' => 'Diziler (AYT)', 'meb_code' => 'AYT.MAT.5', 'topics' => [
                        'Aritmetik Diziler', 'Geometrik Diziler', 'Özel Diziler',
                    ]],
                    ['title' => 'Analitik Geometri (AYT)', 'meb_code' => 'AYT.MAT.6', 'topics' => [
                        'Doğru Denklemleri', 'Çember Denklemi', 'Parabolün Denklemi',
                    ]],
                    ['title' => 'Limit ve Türev (AYT)', 'meb_code' => 'AYT.MAT.7', 'topics' => [
                        'Limit', 'Süreklilik', 'Türev', 'Türev Uygulamaları',
                    ]],
                    ['title' => 'İntegral (AYT)', 'meb_code' => 'AYT.MAT.8', 'topics' => [
                        'Belirsiz İntegral', 'Belirli İntegral', 'Alan ve Hacim',
                    ]],
                    ['title' => 'Olasılık (AYT)', 'meb_code' => 'AYT.MAT.9', 'topics' => [
                        'Sayma Teknikleri', 'Permütasyon-Kombinasyon', 'Koşullu Olasılık',
                        'Binom Dağılımı',
                    ]],
                ],
            ],
            [
                'name' => 'AYT Fizik', 'slug' => 'ayt-fizik',
                'icon' => '⚡', 'color' => '#4a148c',
                'grade' => 'all', 'exam_type' => 'AYT', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Kuvvet ve Hareket (AYT)', 'meb_code' => 'AYT.FİZ.1', 'topics' => [
                        'Vektörler', 'Newton Yasaları', 'Sürtünme', 'Denge', 'İş-Güç-Enerji',
                        'İmpuls-Momentum', 'Çarpışmalar',
                    ]],
                    ['title' => 'Çembersel ve Dönel Hareket', 'meb_code' => 'AYT.FİZ.2', 'topics' => [
                        'Çembersel Hareket', 'Dönme Hareketi', 'Tork',
                    ]],
                    ['title' => 'Kütle Çekimi ve BHH', 'meb_code' => 'AYT.FİZ.3', 'topics' => [
                        'Evrensel Kütle Çekimi', 'Yörüngeler', 'BHH',
                    ]],
                    ['title' => 'Elektrik ve Manyetizma (AYT)', 'meb_code' => 'AYT.FİZ.4', 'topics' => [
                        'Elektrik Alan-Potansiyel', 'Kondansatör', 'Akım Devreleri',
                        'Manyetik Alan', 'Elektromanyetik İndüksiyon', 'AC Devreler',
                    ]],
                    ['title' => 'Dalgalar ve Optik (AYT)', 'meb_code' => 'AYT.FİZ.5', 'topics' => [
                        'Dalgalar', 'Ses', 'Işık ve Optik', 'Aynalar', 'Mercekler',
                    ]],
                    ['title' => 'Modern Fizik', 'meb_code' => 'AYT.FİZ.6', 'topics' => [
                        'Atom Fiziği', 'Radyoaktivite', 'Nükleer Tepkimeler',
                    ]],
                ],
            ],
            [
                'name' => 'AYT Kimya', 'slug' => 'ayt-kimya',
                'icon' => '🧪', 'color' => '#bf360c',
                'grade' => 'all', 'exam_type' => 'AYT', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Mol ve Hesaplama (AYT)', 'meb_code' => 'AYT.KİM.1', 'topics' => [
                        'Mol Kavramı', 'Stokiyometri', 'Verim', 'Gazlar',
                    ]],
                    ['title' => 'Çözeltiler (AYT)', 'meb_code' => 'AYT.KİM.2', 'topics' => [
                        'Derişim', 'Koligatif Özellikler', 'Çözünürlük',
                    ]],
                    ['title' => 'Kimyasal Denge (AYT)', 'meb_code' => 'AYT.KİM.3', 'topics' => [
                        'Denge Sabiti', 'Le Chatelier', 'Ksp', 'Asit-Baz Dengesi',
                    ]],
                    ['title' => 'Elektrokimya (AYT)', 'meb_code' => 'AYT.KİM.4', 'topics' => [
                        'Redoks', 'Galvani Pilleri', 'Elektroliz',
                    ]],
                    ['title' => 'Organik Kimya (AYT)', 'meb_code' => 'AYT.KİM.5', 'topics' => [
                        'Hidrokarbonlar', 'Fonksiyonel Gruplar', 'Organik Tepkimeler',
                        'Polimerler',
                    ]],
                ],
            ],
            [
                'name' => 'AYT Biyoloji', 'slug' => 'ayt-biyoloji',
                'icon' => '🌿', 'color' => '#1b5e20',
                'grade' => 'all', 'exam_type' => 'AYT', 'sort_order' => 4,
                'units' => [
                    ['title' => 'Hücre Biyolojisi (AYT)', 'meb_code' => 'AYT.BİYO.1', 'topics' => [
                        'Hücre Yapısı', 'Madde Geçişi', 'Mitoz-Mayoz', 'Fotosentez', 'Solunum',
                    ]],
                    ['title' => 'Genetik (AYT)', 'meb_code' => 'AYT.BİYO.2', 'topics' => [
                        'DNA ve RNA', 'Protein Sentezi', 'Mendel Genetiği',
                        'Mutasyon', 'Genetik Mühendisliği',
                    ]],
                    ['title' => 'Sistem Fizyolojisi (AYT)', 'meb_code' => 'AYT.BİYO.3', 'topics' => [
                        'Sinir Sistemi', 'Hormonal Sistem', 'Dolaşım-Solunum',
                        'Sindirim-Boşaltım', 'Üreme',
                    ]],
                    ['title' => 'Ekoloji ve Evrim', 'meb_code' => 'AYT.BİYO.4', 'topics' => [
                        'Popülasyon Ekolojisi', 'Ekosistem', 'Evrim Teorisi',
                        'Biyoçeşitlilik',
                    ]],
                ],
            ],

            // ═══════════════════════════════════════════════════════
            // LGS (8. Sınıf)
            // ═══════════════════════════════════════════════════════
            [
                'name' => 'LGS Matematik', 'slug' => 'lgs-matematik',
                'icon' => '📐', 'color' => '#00695c',
                'grade' => '8', 'exam_type' => 'LGS', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Çarpanlar ve Katlar', 'meb_code' => 'LGS.MAT.1', 'topics' => [
                        'EBOB ve EKOK', 'Üslü İfadeler', 'Kareköklü İfadeler',
                    ]],
                    ['title' => 'Cebir', 'meb_code' => 'LGS.MAT.2', 'topics' => [
                        'Cebirsel İfadeler', 'Denklemler', 'Eşitsizlikler',
                    ]],
                    ['title' => 'Doğrusal Denklemler', 'meb_code' => 'LGS.MAT.3', 'topics' => [
                        'İki Bilinmeyenli Denklem Sistemleri', 'Grafik Yöntemi',
                    ]],
                    ['title' => 'Geometri', 'meb_code' => 'LGS.MAT.4', 'topics' => [
                        'Dönüşüm Geometrisi', 'Üçgenler', 'Pisagor Teoremi',
                        'Çember ve Daire', 'Katı Cisimler',
                    ]],
                    ['title' => 'Veri ve Olasılık', 'meb_code' => 'LGS.MAT.5', 'topics' => [
                        'İstatistik', 'Olasılık Temelleri',
                    ]],
                ],
            ],
            [
                'name' => 'LGS Türkçe', 'slug' => 'lgs-turkce',
                'icon' => '📖', 'color' => '#b71c1c',
                'grade' => '8', 'exam_type' => 'LGS', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Okuma Becerileri', 'meb_code' => 'LGS.TRK.1', 'topics' => [
                        'Ana Fikir', 'Yardımcı Düşünce', 'Paragraf Yorumlama',
                    ]],
                    ['title' => 'Dil Bilgisi', 'meb_code' => 'LGS.TRK.2', 'topics' => [
                        'Sözcük Türleri', 'Cümle Ögeleri', 'Anlatım Bozukluğu',
                        'Yazım-Noktalama',
                    ]],
                ],
            ],
            [
                'name' => 'LGS Fen Bilimleri', 'slug' => 'lgs-fen',
                'icon' => '🔬', 'color' => '#558b2f',
                'grade' => '8', 'exam_type' => 'LGS', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Mevsimler ve İklim', 'meb_code' => 'LGS.FEN.1', 'topics' => [
                        'Dünya\'nın Hareketleri', 'Mevsimler', 'İklim ve Hava',
                    ]],
                    ['title' => 'DNA ve Genetik', 'meb_code' => 'LGS.FEN.2', 'topics' => [
                        'DNA Yapısı', 'Gen ve Kalıtım', 'Biyoteknoloji',
                    ]],
                    ['title' => 'Kuvvet ve Enerji', 'meb_code' => 'LGS.FEN.3', 'topics' => [
                        'Basit Makineler', 'Enerji Dönüşümleri', 'Çevre ve Enerji',
                    ]],
                    ['title' => 'Madde ve Kimya', 'meb_code' => 'LGS.FEN.4', 'topics' => [
                        'Kimyasal Tepkimeler', 'Asitler ve Bazlar', 'Kimya Her Yerde',
                    ]],
                ],
            ],

            // ═══════════════════════════════════════════════════════
            // KPSS
            // ═══════════════════════════════════════════════════════
            [
                'name' => 'KPSS Genel Yetenek', 'slug' => 'kpss-gy',
                'icon' => '🎓', 'color' => '#4527a0',
                'grade' => 'all', 'exam_type' => 'KPSS', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Türkçe (KPSS)', 'meb_code' => 'KPSS.GY.TRK', 'topics' => [
                        'Sözcük Türleri', 'Cümle Bilgisi', 'Anlam Bilgisi',
                        'Yazım-Noktalama', 'Paragraf', 'Anlatım Bozukluğu',
                    ]],
                    ['title' => 'Matematik (KPSS)', 'meb_code' => 'KPSS.GY.MAT', 'topics' => [
                        'Temel İşlemler', 'Sayı Sistemleri', 'Orantı-Yüzde',
                        'Kesirler', 'Temel Cebir', 'Geometri Temelleri',
                    ]],
                ],
            ],
            [
                'name' => 'KPSS Genel Kültür', 'slug' => 'kpss-gk',
                'icon' => '🏅', 'color' => '#6a1b9a',
                'grade' => 'all', 'exam_type' => 'KPSS', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Türkiye Tarihi (KPSS)', 'meb_code' => 'KPSS.GK.TAR', 'topics' => [
                        'Osmanlı Tarihi', 'Kurtuluş Savaşı', 'Cumhuriyet Tarihi',
                        'Atatürk İlke ve İnkılapları',
                    ]],
                    ['title' => 'Coğrafya (KPSS)', 'meb_code' => 'KPSS.GK.COĞ', 'topics' => [
                        'Türkiye Fiziki Coğrafyası', 'Beşeri-Ekonomik Coğrafya',
                        'Dünya Coğrafyası',
                    ]],
                    ['title' => 'Anayasa ve Vatandaşlık', 'meb_code' => 'KPSS.GK.HUK', 'topics' => [
                        'TC Anayasası', 'Temel Haklar', 'Devlet Yapısı', 'Vatandaşlık',
                    ]],
                    ['title' => 'Güncel Bilgiler', 'meb_code' => 'KPSS.GK.GNL', 'topics' => [
                        'Türkiye Ekonomisi', 'AB ve Uluslararası İlişkiler',
                        'Güncel Olaylar',
                    ]],
                ],
            ],
        ];
    }
}

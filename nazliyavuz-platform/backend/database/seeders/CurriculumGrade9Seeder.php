<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\InsertsCurriculumSubjects;

/**
 * 9. sınıf (lise) — TYMM lise branş programlarındaki ünite/konu yapısına uygun özet müfredat ağacı.
 *
 * @see https://tymm.meb.gov.tr/ogretim-programlari/
 */
class CurriculumGrade9Seeder extends Seeder
{
    use InsertsCurriculumSubjects;

    public function run(): void
    {
        $this->purgeByGradeAndExamType('9', 'all');
        $data = $this->getCurriculum();
        $this->insertCurriculumSubjects($data);
        $this->command->info('CurriculumGrade9Seeder: ' . count($data) . ' ders (9. sınıf) yazıldı.');
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
                    ['title' => 'Nicelikler ve Değişimler', 'meb_code' => 'MAT.9.2', 'topics' => [
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
                    ['title' => 'İstatistiksel Araştırma Süreci', 'meb_code' => 'MAT.9.6', 'topics' => [
                        'Veri Toplama ve Düzenleme', 'Merkezi Eğilim Ölçüleri',
                        'Yaygınlık Ölçüleri', 'Grafikler',
                    ]],
                    ['title' => 'Veriden Olasılığa', 'meb_code' => 'MAT.9.7', 'topics' => [
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
                    ['title' => 'Fizik Bilimi ve Kariyer Keşfi', 'meb_code' => 'FİZ.9.1', 'topics' => [
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
                    ['title' => 'Etkileşim', 'meb_code' => 'KİM.9.1', 'topics' => [
                        'Kimyanın Önemi', 'Madde ve Özellikleri', 'Saf Maddeler ve Karışımlar',
                        'Fiziksel ve Kimyasal Değişimler', 'Karışımların Ayrılması',
                    ]],
                    ['title' => 'Çeşitlilik', 'meb_code' => 'KİM.9.2', 'topics' => [
                        'Atom Modelleri', 'Proton-Nötron-Elektron', 'Atom Numarası ve Kütle Numarası',
                        'İzotoplar', 'Periyodik Tablo', 'Elektron Dizilimi',
                    ]],
                    ['title' => 'Sürdürülebilirlik', 'meb_code' => 'KİM.9.3', 'topics' => [
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
                    ['title' => 'Yaşam', 'meb_code' => 'BİYO.9.1', 'topics' => [
                        'Biyoloji Nedir?', 'Bilimsel Yöntem', 'Canlıların Özellikleri',
                        'Canlıların Sınıflandırılması', 'Biyoçeşitlilik',
                    ]],
                    ['title' => 'Organizasyon', 'meb_code' => 'BİYO.9.2', 'topics' => [
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
        ];
    }
}

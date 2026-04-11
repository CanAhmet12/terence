<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Mevcut curriculum_topics kayıtlarına ek konular ekler.
 * Mevcut kayıtları silmez, sadece eksik olanları ekler.
 */
class CurriculumTopicsExpandSeeder extends Seeder
{
    public function run(): void
    {
        // Ünite title → id haritası
        $unitMap = DB::table('curriculum_units')
            ->select('id', 'title', 'subject_id', 'meb_code')
            ->get()
            ->keyBy('id');

        // Subject slug → id
        $subjectMap = DB::table('curriculum_subjects')
            ->select('id', 'slug', 'name')
            ->get()
            ->keyBy('slug');

        $added = 0;

        foreach ($this->getExpandedTopics() as $subjectSlug => $units) {
            if (!isset($subjectMap[$subjectSlug])) {
                $this->command->warn("Subject not found: $subjectSlug");
                continue;
            }
            $subjectId = $subjectMap[$subjectSlug]->id;

            foreach ($units as $unitData) {
                // Üniteyi bul
                $unit = DB::table('curriculum_units')
                    ->where('subject_id', $subjectId)
                    ->where('meb_code', $unitData['meb_code'])
                    ->first();

                if (!$unit) {
                    // Ünite yoksa ekle
                    $unitId = DB::table('curriculum_units')->insertGetId([
                        'subject_id'  => $subjectId,
                        'title'       => $unitData['title'],
                        'meb_code'    => $unitData['meb_code'],
                        'sort_order'  => $unitData['sort_order'],
                        'is_active'   => true,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                } else {
                    $unitId = $unit->id;
                }

                // Mevcut konu başlıklarını al
                $existingTitles = DB::table('curriculum_topics')
                    ->where('unit_id', $unitId)
                    ->pluck('title')
                    ->map(fn($t) => strtolower(trim($t)))
                    ->toArray();

                foreach ($unitData['topics'] as $order => $topic) {
                    $title = is_array($topic) ? $topic['title'] : $topic;
                    $code  = is_array($topic) ? ($topic['code'] ?? null) : null;

                    if (!in_array(strtolower(trim($title)), $existingTitles)) {
                        DB::table('curriculum_topics')->insert([
                            'unit_id'    => $unitId,
                            'title'      => $title,
                            'meb_code'   => $code,
                            'sort_order' => count($existingTitles) + $order + 1,
                            'is_active'  => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $existingTitles[] = strtolower(trim($title));
                        $added++;
                    }
                }
            }
        }

        $this->command->info("CurriculumTopicsExpandSeeder: $added yeni konu eklendi.");
    }

    private function getExpandedTopics(): array
    {
        return [
            // ══════════════════════════════════════════════════════════
            // 9. SINIF — Matematik (Kapsamlı MEB Kazanımları)
            // ══════════════════════════════════════════════════════════
            'matematik-9' => [
                [
                    'meb_code' => 'MAT.9.1', 'title' => 'Sayılar', 'sort_order' => 1,
                    'topics' => [
                        ['title' => 'Doğal Sayılarda Bölünebilme Kuralları',    'code' => 'MAT.9.1.1'],
                        ['title' => 'EBOB ve EKOK',                             'code' => 'MAT.9.1.2'],
                        ['title' => 'Tam Sayılar ve İşlemleri',                 'code' => 'MAT.9.1.3'],
                        ['title' => 'Rasyonel Sayılar',                         'code' => 'MAT.9.1.4'],
                        ['title' => 'Ondalık Gösterim',                         'code' => 'MAT.9.1.5'],
                        ['title' => 'Üslü Sayılar ve Özellikleri',              'code' => 'MAT.9.1.6'],
                        ['title' => 'Köklü Sayılar ve Özellikleri',             'code' => 'MAT.9.1.7'],
                        ['title' => 'İrrasyonel Sayılar',                       'code' => 'MAT.9.1.8'],
                        ['title' => 'Sayı Doğrusu ve Gerçek Sayılar',          'code' => 'MAT.9.1.9'],
                        ['title' => 'Mutlak Değer',                             'code' => 'MAT.9.1.10'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.9.2', 'title' => 'Nicelikler ve Değişimler (Cebir)', 'sort_order' => 2,
                    'topics' => [
                        ['title' => 'Cebirsel İfadeler ve Çarpanlara Ayırma',  'code' => 'MAT.9.2.1'],
                        ['title' => 'Birinci Dereceden Denklemler',            'code' => 'MAT.9.2.2'],
                        ['title' => 'Birinci Dereceden Eşitsizlikler',         'code' => 'MAT.9.2.3'],
                        ['title' => 'Denklem Sistemleri',                      'code' => 'MAT.9.2.4'],
                        ['title' => 'Oran ve Orantı',                          'code' => 'MAT.9.2.5'],
                        ['title' => 'Yüzde Problemleri',                       'code' => 'MAT.9.2.6'],
                        ['title' => 'Kâr-Zarar ve Faiz Problemleri',          'code' => 'MAT.9.2.7'],
                        ['title' => 'Karışım Problemleri',                     'code' => 'MAT.9.2.8'],
                        ['title' => 'Yaş ve Hız Problemleri',                 'code' => 'MAT.9.2.9'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.9.3', 'title' => 'Algoritma ve Bilişim', 'sort_order' => 3,
                    'topics' => [
                        ['title' => 'Küme Kavramı ve Gösterimi',               'code' => 'MAT.9.3.1'],
                        ['title' => 'Küme İşlemleri (Birleşim, Kesişim, Fark)','code' => 'MAT.9.3.2'],
                        ['title' => 'Venn Şemaları ile Problem Çözme',         'code' => 'MAT.9.3.3'],
                        ['title' => 'Mantık Bağlaçları',                       'code' => 'MAT.9.3.4'],
                        ['title' => 'Önerme ve Doğruluk Tabloları',           'code' => 'MAT.9.3.5'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.9.4', 'title' => 'Geometrik Şekiller', 'sort_order' => 4,
                    'topics' => [
                        ['title' => 'Temel Geometri Kavramları',               'code' => 'MAT.9.4.1'],
                        ['title' => 'Açı Türleri ve Özellikleri',              'code' => 'MAT.9.4.2'],
                        ['title' => 'Paralel Doğrular ve Transversal',         'code' => 'MAT.9.4.3'],
                        ['title' => 'Üçgenlerde Açı İlişkileri',               'code' => 'MAT.9.4.4'],
                        ['title' => 'Özel Üçgenler (Dik, İkizkenar, Eşkenar)','code' => 'MAT.9.4.5'],
                        ['title' => 'Dörtgenler ve Özellikleri',               'code' => 'MAT.9.4.6'],
                        ['title' => 'Çokgenlerde Açı Toplamları',              'code' => 'MAT.9.4.7'],
                        ['title' => 'Çevre ve Alan Hesapları',                 'code' => 'MAT.9.4.8'],
                        ['title' => 'Çember ve Daire',                         'code' => 'MAT.9.4.9'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.9.5', 'title' => 'Eşlik ve Benzerlik', 'sort_order' => 5,
                    'topics' => [
                        ['title' => 'Eşlik Kavramı',                           'code' => 'MAT.9.5.1'],
                        ['title' => 'Benzerlik Kavramı ve Oranı',              'code' => 'MAT.9.5.2'],
                        ['title' => 'Özel Üçgen Benzerlik Durumları',          'code' => 'MAT.9.5.3'],
                        ['title' => 'Pisagor Teoremi Uygulamaları',            'code' => 'MAT.9.5.4'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.9.6', 'title' => 'İstatistiksel Araştırma', 'sort_order' => 6,
                    'topics' => [
                        ['title' => 'Veri Toplama ve Frekans Tabloları',       'code' => 'MAT.9.6.1'],
                        ['title' => 'Aritmetik Ortalama',                      'code' => 'MAT.9.6.2'],
                        ['title' => 'Ortanca ve Tepe Değeri',                  'code' => 'MAT.9.6.3'],
                        ['title' => 'Ranj ve Standart Sapma (Temel)',          'code' => 'MAT.9.6.4'],
                        ['title' => 'Sütun, Çizgi ve Pasta Grafikleri',        'code' => 'MAT.9.6.5'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.9.7', 'title' => 'Veri Bilimi ve Olasılık', 'sort_order' => 7,
                    'topics' => [
                        ['title' => 'Olasılık Kavramı ve Temel İlkeler',       'code' => 'MAT.9.7.1'],
                        ['title' => 'Örnek Uzayı ve Olay',                     'code' => 'MAT.9.7.2'],
                        ['title' => 'Basit Olayların Olasılığı',               'code' => 'MAT.9.7.3'],
                        ['title' => 'Bileşik Olaylar',                         'code' => 'MAT.9.7.4'],
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════════════
            // 10. SINIF — Matematik
            // ══════════════════════════════════════════════════════════
            'matematik-10' => [
                [
                    'meb_code' => 'MAT.10.1', 'title' => 'Fonksiyonlar', 'sort_order' => 1,
                    'topics' => [
                        ['title' => 'Fonksiyon Tanımı ve Gösterimi',           'code' => 'MAT.10.1.1'],
                        ['title' => 'Fonksiyon Çeşitleri (Birebir, Örten)',    'code' => 'MAT.10.1.2'],
                        ['title' => 'Bileşke Fonksiyon',                       'code' => 'MAT.10.1.3'],
                        ['title' => 'Ters Fonksiyon',                          'code' => 'MAT.10.1.4'],
                        ['title' => 'Fonksiyon Grafikleri',                    'code' => 'MAT.10.1.5'],
                        ['title' => 'Parçalı Fonksiyonlar',                    'code' => 'MAT.10.1.6'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.10.2', 'title' => 'Polinomlar', 'sort_order' => 2,
                    'topics' => [
                        ['title' => 'Polinom Kavramı ve Dereceleri',           'code' => 'MAT.10.2.1'],
                        ['title' => 'Polinom İşlemleri',                       'code' => 'MAT.10.2.2'],
                        ['title' => 'Özdeşlikler ve Çarpanlara Ayırma',        'code' => 'MAT.10.2.3'],
                        ['title' => 'Polinom Denklemleri',                     'code' => 'MAT.10.2.4'],
                        ['title' => 'Viete Formülleri',                        'code' => 'MAT.10.2.5'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.10.3', 'title' => 'İkinci Dereceden Denklemler', 'sort_order' => 3,
                    'topics' => [
                        ['title' => 'İkinci Dereceden Denklem ve Kökleri',     'code' => 'MAT.10.3.1'],
                        ['title' => 'Diskriminant ve Kök Türleri',             'code' => 'MAT.10.3.2'],
                        ['title' => 'Kök-Katsayı Bağıntıları',                'code' => 'MAT.10.3.3'],
                        ['title' => 'Parabolün Denklemi ve Grafiği',           'code' => 'MAT.10.3.4'],
                        ['title' => 'İkinci Derece Eşitsizlikler',             'code' => 'MAT.10.3.5'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.10.4', 'title' => 'Analitik Geometri', 'sort_order' => 4,
                    'topics' => [
                        ['title' => 'Koordinat Sistemi ve Nokta',              'code' => 'MAT.10.4.1'],
                        ['title' => 'İki Nokta Arası Uzaklık',                 'code' => 'MAT.10.4.2'],
                        ['title' => 'Doğrunun Denklemi',                       'code' => 'MAT.10.4.3'],
                        ['title' => 'İki Doğrunun Konumu',                     'code' => 'MAT.10.4.4'],
                        ['title' => 'Noktanın Doğruya Uzaklığı',              'code' => 'MAT.10.4.5'],
                        ['title' => 'Çemberin Denklemi',                       'code' => 'MAT.10.4.6'],
                        ['title' => 'Doğru-Çember İlişkisi',                  'code' => 'MAT.10.4.7'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.10.5', 'title' => 'Trigonometri', 'sort_order' => 5,
                    'topics' => [
                        ['title' => 'Trigonometrik Oranlar (sin, cos, tan)',   'code' => 'MAT.10.5.1'],
                        ['title' => 'Trigonometrik Özdeşlikler',               'code' => 'MAT.10.5.2'],
                        ['title' => 'Sinüs ve Kosinüs Teoremi',               'code' => 'MAT.10.5.3'],
                        ['title' => 'Üçgenlerde Alan Formülleri',              'code' => 'MAT.10.5.4'],
                        ['title' => 'Çemberde Trigonometri',                   'code' => 'MAT.10.5.5'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.10.6', 'title' => 'Olasılık ve İstatistik', 'sort_order' => 6,
                    'topics' => [
                        ['title' => 'Temel Sayma İlkeleri',                    'code' => 'MAT.10.6.1'],
                        ['title' => 'Permütasyon',                             'code' => 'MAT.10.6.2'],
                        ['title' => 'Kombinasyon',                             'code' => 'MAT.10.6.3'],
                        ['title' => 'Binom Açılımı',                           'code' => 'MAT.10.6.4'],
                        ['title' => 'Koşullu Olasılık',                        'code' => 'MAT.10.6.5'],
                        ['title' => 'Olasılık Problemleri',                    'code' => 'MAT.10.6.6'],
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════════════
            // 11. SINIF — Matematik
            // ══════════════════════════════════════════════════════════
            'matematik-11' => [
                [
                    'meb_code' => 'MAT.11.1', 'title' => 'Logaritma', 'sort_order' => 1,
                    'topics' => [
                        ['title' => 'Logaritma Tanımı ve Özellikleri',         'code' => 'MAT.11.1.1'],
                        ['title' => 'Logaritmada Taban Dönüşümü',              'code' => 'MAT.11.1.2'],
                        ['title' => 'Logaritmik Denklemler',                   'code' => 'MAT.11.1.3'],
                        ['title' => 'Logaritmik Eşitsizlikler',                'code' => 'MAT.11.1.4'],
                        ['title' => 'Üstel Fonksiyon ve Logaritmik Fonksiyon', 'code' => 'MAT.11.1.5'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.11.2', 'title' => 'Trigonometri (İleri)', 'sort_order' => 2,
                    'topics' => [
                        ['title' => 'Açı Ölçü Birimleri (Radyan)',             'code' => 'MAT.11.2.1'],
                        ['title' => 'Trigonometrik Fonksiyonlar ve Grafikleri','code' => 'MAT.11.2.2'],
                        ['title' => 'Toplam-Fark Formülleri',                  'code' => 'MAT.11.2.3'],
                        ['title' => 'Çift Açı ve Yarı Açı Formülleri',        'code' => 'MAT.11.2.4'],
                        ['title' => 'Trigonometrik Denklemler',                'code' => 'MAT.11.2.5'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.11.3', 'title' => 'Diziler', 'sort_order' => 3,
                    'topics' => [
                        ['title' => 'Dizi Kavramı ve Genel Terimi',            'code' => 'MAT.11.3.1'],
                        ['title' => 'Aritmetik Diziler',                       'code' => 'MAT.11.3.2'],
                        ['title' => 'Aritmetik Seriler',                       'code' => 'MAT.11.3.3'],
                        ['title' => 'Geometrik Diziler',                       'code' => 'MAT.11.3.4'],
                        ['title' => 'Geometrik Seriler',                       'code' => 'MAT.11.3.5'],
                        ['title' => 'Sonsuz Geometrik Seriler',                'code' => 'MAT.11.3.6'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.11.4', 'title' => 'Karmaşık Sayılar', 'sort_order' => 4,
                    'topics' => [
                        ['title' => 'Karmaşık Sayı Tanımı ve Gösterimi',       'code' => 'MAT.11.4.1'],
                        ['title' => 'Karmaşık Sayılarda İşlemler',             'code' => 'MAT.11.4.2'],
                        ['title' => 'Karmaşık Sayının Modülü ve Argümanı',     'code' => 'MAT.11.4.3'],
                        ['title' => 'Karmaşık Sayının Trigonometrik Formu',    'code' => 'MAT.11.4.4'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.11.5', 'title' => 'Limit', 'sort_order' => 5,
                    'topics' => [
                        ['title' => 'Limite Giriş ve Tanımı',                  'code' => 'MAT.11.5.1'],
                        ['title' => 'Limit Teoremleri',                        'code' => 'MAT.11.5.2'],
                        ['title' => 'Sonsuzda Limit',                          'code' => 'MAT.11.5.3'],
                        ['title' => 'Belirsiz Formlar',                        'code' => 'MAT.11.5.4'],
                        ['title' => 'Süreklilik',                              'code' => 'MAT.11.5.5'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.11.6', 'title' => 'Türev', 'sort_order' => 6,
                    'topics' => [
                        ['title' => 'Türev Tanımı ve Temel Kurallar',          'code' => 'MAT.11.6.1'],
                        ['title' => 'Çarpım ve Bölüm Türevi',                  'code' => 'MAT.11.6.2'],
                        ['title' => 'Zincir Kuralı',                           'code' => 'MAT.11.6.3'],
                        ['title' => 'Trigonometrik Fonksiyonların Türevi',     'code' => 'MAT.11.6.4'],
                        ['title' => 'Türevin Yorumu: Teğet Denklemi',         'code' => 'MAT.11.6.5'],
                        ['title' => 'Artan-Azalan Fonksiyon Analizi',          'code' => 'MAT.11.6.6'],
                        ['title' => 'Maksimum-Minimum Problemleri',            'code' => 'MAT.11.6.7'],
                        ['title' => 'Grafik Çizimi ve Büküm Noktası',         'code' => 'MAT.11.6.8'],
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════════════
            // 12. SINIF — Matematik
            // ══════════════════════════════════════════════════════════
            'matematik-12' => [
                [
                    'meb_code' => 'MAT.12.1', 'title' => 'İntegral', 'sort_order' => 1,
                    'topics' => [
                        ['title' => 'Belirsiz İntegral ve Temel Kurallar',     'code' => 'MAT.12.1.1'],
                        ['title' => 'Değişken Dönüşümü (Sübstitüsyon)',       'code' => 'MAT.12.1.2'],
                        ['title' => 'Kısmi İntegrasyon',                       'code' => 'MAT.12.1.3'],
                        ['title' => 'Trigonometrik İntegraller',               'code' => 'MAT.12.1.4'],
                        ['title' => 'Belirli İntegral ve Alan Hesabı',         'code' => 'MAT.12.1.5'],
                        ['title' => 'Dönel Cisim Hacmi',                       'code' => 'MAT.12.1.6'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.12.2', 'title' => 'Diziler ve Seriler', 'sort_order' => 2,
                    'topics' => [
                        ['title' => 'Dizilerde Limit',                         'code' => 'MAT.12.2.1'],
                        ['title' => 'Sonsuz Seriler',                          'code' => 'MAT.12.2.2'],
                        ['title' => 'Yakınsaklık Testleri',                    'code' => 'MAT.12.2.3'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.12.3', 'title' => 'Olasılık (İleri)', 'sort_order' => 3,
                    'topics' => [
                        ['title' => 'Koşullu Olasılık',                        'code' => 'MAT.12.3.1'],
                        ['title' => 'Bayes Teoremi',                           'code' => 'MAT.12.3.2'],
                        ['title' => 'Rastgele Değişken ve Dağılım',            'code' => 'MAT.12.3.3'],
                        ['title' => 'Binom Dağılımı',                          'code' => 'MAT.12.3.4'],
                        ['title' => 'Normal Dağılım (Temel)',                  'code' => 'MAT.12.3.5'],
                    ],
                ],
                [
                    'meb_code' => 'MAT.12.4', 'title' => 'Analitik Geometri (İleri)', 'sort_order' => 4,
                    'topics' => [
                        ['title' => 'Parabolün Odak ve Doğrultmanı',           'code' => 'MAT.12.4.1'],
                        ['title' => 'Elipsin Denklemi',                        'code' => 'MAT.12.4.2'],
                        ['title' => 'Hiperbolün Denklemi',                     'code' => 'MAT.12.4.3'],
                        ['title' => 'Konik Kesitler ve Uygulamaları',          'code' => 'MAT.12.4.4'],
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════════════
            // TYT Matematik (Kapsamlı)
            // ══════════════════════════════════════════════════════════
            'tyt-matematik' => [
                [
                    'meb_code' => 'TYT.MAT.1', 'title' => 'Temel Kavramlar', 'sort_order' => 1,
                    'topics' => [
                        ['title' => 'Doğal Sayılarda İşlemler',               'code' => 'TYT.MAT.1.1'],
                        ['title' => 'Sayı Basamakları',                        'code' => 'TYT.MAT.1.2'],
                        ['title' => 'Bölünebilme Kuralları',                   'code' => 'TYT.MAT.1.3'],
                        ['title' => 'EBOB ve EKOK Problemleri',                'code' => 'TYT.MAT.1.4'],
                        ['title' => 'Tam Sayı İşlemleri',                     'code' => 'TYT.MAT.1.5'],
                        ['title' => 'Kesirler ve İşlemleri',                  'code' => 'TYT.MAT.1.6'],
                        ['title' => 'Ondalık Sayılar',                        'code' => 'TYT.MAT.1.7'],
                        ['title' => 'Üslü Sayılar',                            'code' => 'TYT.MAT.1.8'],
                        ['title' => 'Köklü Sayılar',                           'code' => 'TYT.MAT.1.9'],
                        ['title' => 'Mutlak Değer',                            'code' => 'TYT.MAT.1.10'],
                    ],
                ],
                [
                    'meb_code' => 'TYT.MAT.2', 'title' => 'Cebir', 'sort_order' => 2,
                    'topics' => [
                        ['title' => 'Birinci Dereceden Denklemler',            'code' => 'TYT.MAT.2.1'],
                        ['title' => 'Eşitsizlikler ve Mutlak Değer',          'code' => 'TYT.MAT.2.2'],
                        ['title' => 'Çarpanlara Ayırma',                       'code' => 'TYT.MAT.2.3'],
                        ['title' => 'Oran-Orantı Problemleri',                 'code' => 'TYT.MAT.2.4'],
                        ['title' => 'Yüzde-Kâr-Zarar',                        'code' => 'TYT.MAT.2.5'],
                        ['title' => 'Faiz Problemleri',                        'code' => 'TYT.MAT.2.6'],
                        ['title' => 'Karışım Problemleri',                     'code' => 'TYT.MAT.2.7'],
                        ['title' => 'Hız-Zaman-Mesafe Problemleri',           'code' => 'TYT.MAT.2.8'],
                        ['title' => 'Yaş Problemleri',                         'code' => 'TYT.MAT.2.9'],
                        ['title' => 'İşçi Havuz Problemleri',                  'code' => 'TYT.MAT.2.10'],
                    ],
                ],
                [
                    'meb_code' => 'TYT.MAT.3', 'title' => 'Mantık ve Kümeler', 'sort_order' => 3,
                    'topics' => [
                        ['title' => 'Önermeler ve Bağlaçlar',                  'code' => 'TYT.MAT.3.1'],
                        ['title' => 'Doğruluk Tabloları',                      'code' => 'TYT.MAT.3.2'],
                        ['title' => 'Küme Kavramı ve Gösterimi',               'code' => 'TYT.MAT.3.3'],
                        ['title' => 'Küme İşlemleri',                         'code' => 'TYT.MAT.3.4'],
                        ['title' => 'Venn Şemaları Problemleri',               'code' => 'TYT.MAT.3.5'],
                    ],
                ],
                [
                    'meb_code' => 'TYT.MAT.4', 'title' => 'Fonksiyonlar', 'sort_order' => 4,
                    'topics' => [
                        ['title' => 'Fonksiyon Tanımı ve Özellikleri',         'code' => 'TYT.MAT.4.1'],
                        ['title' => 'Bileşke ve Ters Fonksiyon',               'code' => 'TYT.MAT.4.2'],
                        ['title' => 'Birinci Dereceden Fonksiyon Grafiği',     'code' => 'TYT.MAT.4.3'],
                    ],
                ],
                [
                    'meb_code' => 'TYT.MAT.5', 'title' => 'Sayma ve Olasılık', 'sort_order' => 5,
                    'topics' => [
                        ['title' => 'Temel Sayma İlkesi',                      'code' => 'TYT.MAT.5.1'],
                        ['title' => 'Permütasyon',                             'code' => 'TYT.MAT.5.2'],
                        ['title' => 'Kombinasyon',                             'code' => 'TYT.MAT.5.3'],
                        ['title' => 'Olasılık Hesabı',                         'code' => 'TYT.MAT.5.4'],
                        ['title' => 'Bağımlı-Bağımsız Olaylar',               'code' => 'TYT.MAT.5.5'],
                    ],
                ],
                [
                    'meb_code' => 'TYT.GEO.1', 'title' => 'Geometri', 'sort_order' => 6,
                    'topics' => [
                        ['title' => 'Temel Geometri (Açı, Doğru)',            'code' => 'TYT.GEO.1.1'],
                        ['title' => 'Üçgenlerde Açı Özellikleri',              'code' => 'TYT.GEO.1.2'],
                        ['title' => 'Özel Üçgenler ve Teoremler',              'code' => 'TYT.GEO.1.3'],
                        ['title' => 'Üçgenlerde Alan',                         'code' => 'TYT.GEO.1.4'],
                        ['title' => 'Benzerlik ve Oranlar',                    'code' => 'TYT.GEO.1.5'],
                        ['title' => 'Dörtgenler',                              'code' => 'TYT.GEO.1.6'],
                        ['title' => 'Çokgenler',                               'code' => 'TYT.GEO.1.7'],
                        ['title' => 'Çember ve Daire',                         'code' => 'TYT.GEO.1.8'],
                        ['title' => 'Katı Cisimler (Hacim-Alan)',              'code' => 'TYT.GEO.1.9'],
                    ],
                ],
                [
                    'meb_code' => 'TYT.GEO.2', 'title' => 'Analitik Geometri', 'sort_order' => 7,
                    'topics' => [
                        ['title' => 'Koordinat Sistemi',                       'code' => 'TYT.GEO.2.1'],
                        ['title' => 'Doğrunun Denklemi',                       'code' => 'TYT.GEO.2.2'],
                        ['title' => 'Analitik Alan ve Uzaklık',                'code' => 'TYT.GEO.2.3'],
                    ],
                ],
                [
                    'meb_code' => 'TYT.MAT.6', 'title' => 'Veri ve İstatistik', 'sort_order' => 8,
                    'topics' => [
                        ['title' => 'Merkezi Eğilim Ölçüleri',                 'code' => 'TYT.MAT.6.1'],
                        ['title' => 'Grafik Okuma ve Yorumlama',               'code' => 'TYT.MAT.6.2'],
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════════════
            // LGS Matematik (Kapsamlı)
            // ══════════════════════════════════════════════════════════
            'lgs-matematik' => [
                [
                    'meb_code' => 'LGS.MAT.1', 'title' => 'Çarpanlar ve Katlar', 'sort_order' => 1,
                    'topics' => [
                        ['title' => 'Doğal Sayılarda Bölünebilme',            'code' => 'LGS.MAT.1.1'],
                        ['title' => 'EBOB ve EKOK',                            'code' => 'LGS.MAT.1.2'],
                        ['title' => 'Üslü Sayılar',                            'code' => 'LGS.MAT.1.3'],
                        ['title' => 'Kareköklü İfadeler',                     'code' => 'LGS.MAT.1.4'],
                        ['title' => 'Kareköklü Denklemler',                    'code' => 'LGS.MAT.1.5'],
                    ],
                ],
                [
                    'meb_code' => 'LGS.MAT.2', 'title' => 'Cebir', 'sort_order' => 2,
                    'topics' => [
                        ['title' => 'Cebirsel İfadeler',                       'code' => 'LGS.MAT.2.1'],
                        ['title' => 'Faktörizasyon (Çarpanlara Ayırma)',        'code' => 'LGS.MAT.2.2'],
                        ['title' => 'Denklemler (1. Derece)',                  'code' => 'LGS.MAT.2.3'],
                        ['title' => 'Eşitsizlikler',                           'code' => 'LGS.MAT.2.4'],
                        ['title' => 'Oran-Orantı Problemleri',                 'code' => 'LGS.MAT.2.5'],
                        ['title' => 'Yüzde Problemleri',                       'code' => 'LGS.MAT.2.6'],
                    ],
                ],
                [
                    'meb_code' => 'LGS.MAT.3', 'title' => 'Doğrusal Denklemler', 'sort_order' => 3,
                    'topics' => [
                        ['title' => 'İki Bilinmeyenli Denklem Sistemi',        'code' => 'LGS.MAT.3.1'],
                        ['title' => 'Yerine Koyma Yöntemi',                   'code' => 'LGS.MAT.3.2'],
                        ['title' => 'Eşitleme Yöntemi',                        'code' => 'LGS.MAT.3.3'],
                        ['title' => 'Grafik Yöntemi',                          'code' => 'LGS.MAT.3.4'],
                        ['title' => 'Problem Kurma',                           'code' => 'LGS.MAT.3.5'],
                    ],
                ],
                [
                    'meb_code' => 'LGS.MAT.4', 'title' => 'Geometri', 'sort_order' => 4,
                    'topics' => [
                        ['title' => 'Dönüşüm Geometrisi (Öteleme)',           'code' => 'LGS.MAT.4.1'],
                        ['title' => 'Dönüşüm Geometrisi (Yansıma)',           'code' => 'LGS.MAT.4.2'],
                        ['title' => 'Dönüşüm Geometrisi (Döndürme)',          'code' => 'LGS.MAT.4.3'],
                        ['title' => 'Üçgenler ve Özel Üçgenler',              'code' => 'LGS.MAT.4.4'],
                        ['title' => 'Pisagor Teoremi',                         'code' => 'LGS.MAT.4.5'],
                        ['title' => 'Benzerlik',                               'code' => 'LGS.MAT.4.6'],
                        ['title' => 'Çember ve Daire',                         'code' => 'LGS.MAT.4.7'],
                        ['title' => 'Katı Cisimler',                           'code' => 'LGS.MAT.4.8'],
                    ],
                ],
                [
                    'meb_code' => 'LGS.MAT.5', 'title' => 'Veri ve Olasılık', 'sort_order' => 5,
                    'topics' => [
                        ['title' => 'Veri Analizi ve Merkezi Eğilim',          'code' => 'LGS.MAT.5.1'],
                        ['title' => 'Grafikler (Sütun, Çizgi, Pasta)',         'code' => 'LGS.MAT.5.2'],
                        ['title' => 'Olasılık Temelleri',                      'code' => 'LGS.MAT.5.3'],
                        ['title' => 'Basit Olasılık Problemleri',              'code' => 'LGS.MAT.5.4'],
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════════════
            // LGS Türkçe
            // ══════════════════════════════════════════════════════════
            'lgs-turkce' => [
                [
                    'meb_code' => 'LGS.TRK.1', 'title' => 'Okuma Becerileri', 'sort_order' => 1,
                    'topics' => [
                        ['title' => 'Ana Fikir ve Yardımcı Düşünceler',        'code' => 'LGS.TRK.1.1'],
                        ['title' => 'Konu ve Başlık Seçimi',                   'code' => 'LGS.TRK.1.2'],
                        ['title' => 'Paragraf Tamamlama',                      'code' => 'LGS.TRK.1.3'],
                        ['title' => 'Anlatım Teknikleri',                      'code' => 'LGS.TRK.1.4'],
                        ['title' => 'Sözcükte Anlam',                          'code' => 'LGS.TRK.1.5'],
                        ['title' => 'Söz Sanatları ve Deyimler',               'code' => 'LGS.TRK.1.6'],
                    ],
                ],
                [
                    'meb_code' => 'LGS.TRK.2', 'title' => 'Dil Bilgisi', 'sort_order' => 2,
                    'topics' => [
                        ['title' => 'Sözcük Türleri (İsim, Sıfat, Zamir)',    'code' => 'LGS.TRK.2.1'],
                        ['title' => 'Sözcük Türleri (Zarf, Bağlaç, Edat)',    'code' => 'LGS.TRK.2.2'],
                        ['title' => 'Fiiller ve Çekimi',                       'code' => 'LGS.TRK.2.3'],
                        ['title' => 'Cümle Ögeleri',                          'code' => 'LGS.TRK.2.4'],
                        ['title' => 'Cümle Türleri',                          'code' => 'LGS.TRK.2.5'],
                        ['title' => 'Anlatım Bozukluğu',                       'code' => 'LGS.TRK.2.6'],
                        ['title' => 'Yazım Kuralları',                         'code' => 'LGS.TRK.2.7'],
                        ['title' => 'Noktalama İşaretleri',                    'code' => 'LGS.TRK.2.8'],
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════════════
            // LGS Fen Bilimleri
            // ══════════════════════════════════════════════════════════
            'lgs-fen' => [
                [
                    'meb_code' => 'LGS.FEN.1', 'title' => 'Mevsimler ve İklim', 'sort_order' => 1,
                    'topics' => [
                        ['title' => 'Dünya\'nın Şekli ve Eksen Eğikliği',     'code' => 'LGS.FEN.1.1'],
                        ['title' => 'Günlük ve Yıllık Hareketler',            'code' => 'LGS.FEN.1.2'],
                        ['title' => 'Mevsimler ve Oluşumu',                    'code' => 'LGS.FEN.1.3'],
                        ['title' => 'İklim ve Hava Olayları',                  'code' => 'LGS.FEN.1.4'],
                    ],
                ],
                [
                    'meb_code' => 'LGS.FEN.2', 'title' => 'DNA ve Genetik', 'sort_order' => 2,
                    'topics' => [
                        ['title' => 'DNA Yapısı ve Özellikleri',               'code' => 'LGS.FEN.2.1'],
                        ['title' => 'Gen Kavramı',                             'code' => 'LGS.FEN.2.2'],
                        ['title' => 'Kalıtım ve Mendel Kuralları',             'code' => 'LGS.FEN.2.3'],
                        ['title' => 'Mutasyon ve Modifikasyon',                'code' => 'LGS.FEN.2.4'],
                        ['title' => 'Biyoteknoloji Uygulamaları',              'code' => 'LGS.FEN.2.5'],
                    ],
                ],
                [
                    'meb_code' => 'LGS.FEN.3', 'title' => 'Kuvvet ve Enerji', 'sort_order' => 3,
                    'topics' => [
                        ['title' => 'Basit Makineler',                         'code' => 'LGS.FEN.3.1'],
                        ['title' => 'İş ve Güç',                              'code' => 'LGS.FEN.3.2'],
                        ['title' => 'Kinetik ve Potansiyel Enerji',           'code' => 'LGS.FEN.3.3'],
                        ['title' => 'Enerjinin Korunumu',                      'code' => 'LGS.FEN.3.4'],
                        ['title' => 'Yenilenebilir Enerji Kaynakları',        'code' => 'LGS.FEN.3.5'],
                    ],
                ],
                [
                    'meb_code' => 'LGS.FEN.4', 'title' => 'Madde ve Kimya', 'sort_order' => 4,
                    'topics' => [
                        ['title' => 'Kimyasal Tepkimeler ve Denkleştirme',     'code' => 'LGS.FEN.4.1'],
                        ['title' => 'Asitler ve Bazlar',                       'code' => 'LGS.FEN.4.2'],
                        ['title' => 'pH Kavramı',                              'code' => 'LGS.FEN.4.3'],
                        ['title' => 'Kimya ve Günlük Yaşam',                  'code' => 'LGS.FEN.4.4'],
                        ['title' => 'Çevre Kimyası',                           'code' => 'LGS.FEN.4.5'],
                    ],
                ],
            ],
        ];
    }
}

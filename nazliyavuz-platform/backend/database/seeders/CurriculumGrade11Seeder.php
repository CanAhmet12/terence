<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\InsertsCurriculumSubjects;

/**
 * 11. sınıf (lise) — TYMM lise branş programlarındaki ünite/konu yapısına uygun özet müfredat ağacı.
 *
 * @see https://tymm.meb.gov.tr/ogretim-programlari/
 */
class CurriculumGrade11Seeder extends Seeder
{
    use InsertsCurriculumSubjects;

    public function run(): void
    {
        $this->purgeByGradeAndExamType('11', 'all');
        $data = $this->getCurriculum();
        $this->insertCurriculumSubjects($data);
        $this->command->info('CurriculumGrade11Seeder: ' . count($data) . ' ders (11. sınıf) yazıldı.');
    }

    private function getCurriculum(): array
    {
        return [
            [
                'name' => 'Matematik', 'slug' => 'matematik-11',
                'icon' => '📐', 'color' => '#1565c0',
                'grade' => '11', 'exam_type' => 'all', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Nicelikler ve Değişimler (1)', 'meb_code' => 'MAT.11.1', 'topics' => [
                        'Fonksiyonların dönüşümleri',
                        'İkinci dereceden fonksiyonlar ve grafikleri',
                    ]],
                    ['title' => 'Nicelikler ve Değişimler (2)', 'meb_code' => 'MAT.11.2', 'topics' => [
                        'Denklem ve eşitsizlik sistemleri',
                        'İkinci dereceden iki bilinmeyenli denklem sistemleri',
                    ]],
                    ['title' => 'Nicelikler ve Değişimler (3)', 'meb_code' => 'MAT.11.3', 'topics' => [
                        'Yönlü açılar ve trigonometri',
                        'Trigonometrik denklemler ve uygulamalar',
                    ]],
                    ['title' => 'Geometrik Şekiller', 'meb_code' => 'MAT.11.4', 'topics' => [
                        'Çemberin temel elemanları',
                        'Çemberde açılar, teğet, çevre ve alan',
                        'Katı cisimlere giriş',
                    ]],
                    ['title' => 'İstatistiksel Araştırma Süreci', 'meb_code' => 'MAT.11.5', 'topics' => [
                        'Deneysel ve teorik olasılık',
                        'Koşullu olasılık',
                        'Veri üzerinden model kurma',
                    ]],
                ],
            ],
            [
                'name' => 'Fizik', 'slug' => 'fizik-11',
                'icon' => '⚡', 'color' => '#6a1b9a',
                'grade' => '11', 'exam_type' => 'all', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Kuvvet ve Hareket', 'meb_code' => 'FİZ.11.1', 'topics' => [
                        'Çembersel Hareket', 'Merkezcil İvme', 'Açısal Hız',
                    ]],
                    ['title' => 'Elektrik ve Manyetizma', 'meb_code' => 'FİZ.11.2', 'topics' => [
                        'Newton\'un Kütle Çekim Yasası', 'Kepler\'in Yasaları',
                        'Uydu Hareketi',
                    ]],
                    ['title' => 'Madde ve Doğası', 'meb_code' => 'FİZ.11.3', 'topics' => [
                        'BHH Tanımı', 'Yay-Kütle Sistemi', 'Sarkaç',
                    ]],
                    ['title' => 'Optik', 'meb_code' => 'FİZ.11.4', 'topics' => [
                        'Işığın Yapısı', 'Yansıma', 'Kırılma', 'Aynalar', 'Mercekler',
                    ]],
                ],
            ],
            [
                'name' => 'Kimya', 'slug' => 'kimya-11',
                'icon' => '🧪', 'color' => '#e65100',
                'grade' => '11', 'exam_type' => 'all', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Etkileşim', 'meb_code' => 'KİM.11.1', 'topics' => [
                        'Denge Kavramı', 'Kc ve Kp', 'Le Chatelier İlkesi',
                        'Çözünürlük Dengesi',
                    ]],
                    ['title' => 'Çeşitlilik', 'meb_code' => 'KİM.11.2', 'topics' => [
                        'Arrhenius ve Brønsted-Lowry', 'pH Hesabı', 'Tampon Çözeltiler',
                        'Hidroliz', 'Nötralizasyon',
                    ]],
                    ['title' => 'Çeşitlilik (İleri)', 'meb_code' => 'KİM.11.3', 'topics' => [
                        'Redoks Tepkimeleri', 'Galvani Pili', 'Elektroliz',
                        'Korozyon',
                    ]],
                    ['title' => 'Sürdürülebilirlik', 'meb_code' => 'KİM.11.4', 'topics' => [
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
                    ['title' => 'Tepki', 'meb_code' => 'BİYO.11.1', 'topics' => [
                        'Sinir Sistemi', 'Endokrin Sistem', 'Duyu Organları',
                    ]],
                    ['title' => 'Homeostazi', 'meb_code' => 'BİYO.11.2', 'topics' => [
                        'Destek ve Hareket Sistemi', 'Dolaşım Sistemi', 'Solunum Sistemi',
                        'Sindirim Sistemi', 'Boşaltım Sistemi',
                    ]],
                    ['title' => 'Homeostazi (İleri)', 'meb_code' => 'BİYO.11.3', 'topics' => [
                        'Üreme Sistemi', 'Mayoz Bölünme', 'Embriyo Gelişimi',
                    ]],
                ],
            ],
        ];
    }
}

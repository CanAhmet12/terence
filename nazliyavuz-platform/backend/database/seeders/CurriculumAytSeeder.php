<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\InsertsCurriculumSubjects;

/**
 * AYT — Yükseköğretim Kurumları Sınavı ikinci oturum (alan) konu başlıkları (özet ağaç).
 * Resmî sınav kapsamı için ÖSYM kılavuzları esas alınmalıdır.
 */
class CurriculumAytSeeder extends Seeder
{
    use InsertsCurriculumSubjects;

    public function run(): void
    {
        $this->purgeByGradeAndExamType('all', 'AYT');
        $data = $this->getCurriculum();
        $this->insertCurriculumSubjects($data);
        $this->command->info('CurriculumAytSeeder: ' . count($data) . ' ders (AYT) yazıldı.');
    }

    private function getCurriculum(): array
    {
        return [
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
        ];
    }
}

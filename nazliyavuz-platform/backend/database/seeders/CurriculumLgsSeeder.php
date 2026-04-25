<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\InsertsCurriculumSubjects;

/**
 * LGS — Lisans Yerleştirme Sınavı (8. sınıf) konu başlıkları (özet ağaç).
 * Resmî sınav kapsamı için MEB/ÖSYM güncel kılavuzları esas alınmalıdır.
 */
class CurriculumLgsSeeder extends Seeder
{
    use InsertsCurriculumSubjects;

    public function run(): void
    {
        $this->purgeByGradeAndExamType('8', 'LGS');
        $data = $this->getCurriculum();
        $this->insertCurriculumSubjects($data);
        $this->command->info('CurriculumLgsSeeder: ' . count($data) . ' ders (LGS (8. sınıf)) yazıldı.');
    }

    private function getCurriculum(): array
    {
        return [
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
        ];
    }
}

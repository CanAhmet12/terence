<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\InsertsCurriculumSubjects;

/**
 * 12. sınıf (lise) — TYMM lise branş programlarındaki ünite/konu yapısına uygun özet müfredat ağacı.
 *
 * @see https://tymm.meb.gov.tr/ogretim-programlari/
 */
class CurriculumGrade12Seeder extends Seeder
{
    use InsertsCurriculumSubjects;

    public function run(): void
    {
        $this->purgeByGradeAndExamType('12', 'all');
        $data = $this->getCurriculum();
        $this->insertCurriculumSubjects($data);
        $this->command->info('CurriculumGrade12Seeder: ' . count($data) . ' ders (12. sınıf) yazıldı.');
    }

    private function getCurriculum(): array
    {
        return [
            [
                'name' => 'Matematik', 'slug' => 'matematik-12',
                'icon' => '📐', 'color' => '#1565c0',
                'grade' => '12', 'exam_type' => 'all', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Nicelikler ve Değişimler (1)', 'meb_code' => 'MAT.12.1', 'topics' => [
                        'Üstel fonksiyonlar',
                        'Logaritma fonksiyonu',
                        'Üstel-logaritmik denklemler ve eşitsizlikler',
                    ]],
                    ['title' => 'Nicelikler ve Değişimler (2)', 'meb_code' => 'MAT.12.2', 'topics' => [
                        'Gerçek sayı dizileri',
                        'Trigonometrik dönüşümler',
                    ]],
                    ['title' => 'Değişimin Matematiği (1)', 'meb_code' => 'MAT.12.3', 'topics' => [
                        'Limit ve süreklilik',
                        'Anlık değişim oranı',
                    ]],
                    ['title' => 'Değişimin Matematiği (2)', 'meb_code' => 'MAT.12.4', 'topics' => [
                        'Türev ve türevin uygulamaları',
                        'Maksimum-minimum problemleri',
                    ]],
                    ['title' => 'Değişimin Matematiği (3)', 'meb_code' => 'MAT.12.5', 'topics' => [
                        'Belirsiz integral',
                        'Belirli integral ve uygulamaları',
                    ]],
                    ['title' => 'Geometrik Şekiller', 'meb_code' => 'MAT.12.6', 'topics' => [
                        'Çemberin analitik incelenmesi',
                        'Analitik düzlemde dönüşümler',
                    ]],
                    ['title' => 'Geometrik Cisimler', 'meb_code' => 'MAT.12.7', 'topics' => [
                        'Katı cisimlerde hacim ve yüzey',
                        'Uzay geometri uygulamaları',
                    ]],
                    ['title' => 'Hazır Veriler Üzerinde Çalışma', 'meb_code' => 'MAT.12.8', 'topics' => [
                        'Veri seti analizi ve yorumlama',
                        'Model seçimi ve raporlama',
                    ]],
                ],
            ],
            [
                'name' => 'Fizik', 'slug' => 'fizik-12',
                'icon' => '⚡', 'color' => '#6a1b9a',
                'grade' => '12', 'exam_type' => 'all', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Kuvvet ve Hareket', 'meb_code' => 'FİZ.12.1', 'topics' => [
                        'İleri kinematik ve dinamik',
                        'Dönme hareketi ve tork',
                        'Çembersel hareket uygulamaları',
                    ]],
                    ['title' => 'Enerji', 'meb_code' => 'FİZ.12.2', 'topics' => [
                        'İş-güç-enerji ilişkileri',
                        'Enerji korunumu ve dönüşümleri',
                        'Modern enerji sistemleri',
                    ]],
                    ['title' => 'Dalgalar', 'meb_code' => 'FİZ.12.3', 'topics' => [
                        'Mekanik dalgalar ve girişim',
                        'Ses dalgaları ve rezonans',
                        'Elektromanyetik dalga uygulamaları',
                    ]],
                    ['title' => 'Madde ve Doğası', 'meb_code' => 'FİZ.12.4', 'topics' => [
                        'Atom fiziği',
                        'Nükleer fizik ve radyoaktivite',
                        'Katıhal ve malzeme fiziği',
                    ]],
                ],
            ],
            [
                'name' => 'Kimya', 'slug' => 'kimya-12',
                'icon' => '🧪', 'color' => '#e65100',
                'grade' => '12', 'exam_type' => 'all', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Etkileşim', 'meb_code' => 'KİM.12.1', 'topics' => [
                        'Kimyasal tepkimeler ve enerji',
                        'Kimyasal denge',
                        'Asit-baz etkileşimleri',
                    ]],
                    ['title' => 'Çeşitlilik', 'meb_code' => 'KİM.12.2', 'topics' => [
                        'Organik bileşik sınıfları',
                        'Fonksiyonel gruplar',
                        'Polimer ve biyokimya örnekleri',
                    ]],
                    ['title' => 'Sürdürülebilirlik', 'meb_code' => 'KİM.12.3', 'topics' => [
                        'Yeşil kimya uygulamaları',
                        'Atık yönetimi ve geri kazanım',
                        'Endüstriyel süreçlerde çevre bilinci',
                    ]],
                ],
            ],
            [
                'name' => 'Biyoloji', 'slug' => 'biyoloji-12',
                'icon' => '🌿', 'color' => '#2e7d32',
                'grade' => '12', 'exam_type' => 'all', 'sort_order' => 4,
                'units' => [
                    ['title' => 'Üreme', 'meb_code' => 'BİYO.12.1', 'topics' => [
                        'Eşeyli ve eşeysiz üreme',
                        'İnsan üreme sistemi',
                        'Embriyonik gelişim',
                    ]],
                    ['title' => 'Gen', 'meb_code' => 'BİYO.12.2', 'topics' => [
                        'DNA-RNA ve protein sentezi',
                        'Kalıtım ve biyoteknoloji',
                        'Evrimsel süreçler ve güncel uygulamalar',
                    ]],
                ],
            ],
        ];
    }
}

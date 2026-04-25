<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\InsertsCurriculumSubjects;

/**
 * 10. sınıf (lise) — TYMM lise branş programlarındaki ünite/konu yapısına uygun özet müfredat ağacı.
 *
 * @see https://tymm.meb.gov.tr/ogretim-programlari/
 */
class CurriculumGrade10Seeder extends Seeder
{
    use InsertsCurriculumSubjects;

    public function run(): void
    {
        $this->purgeByGradeAndExamType('10', 'all');
        $data = $this->getCurriculum();
        $this->insertCurriculumSubjects($data);
        $this->command->info('CurriculumGrade10Seeder: ' . count($data) . ' ders (10. sınıf) yazıldı.');
    }

    private function getCurriculum(): array
    {
        return [
            [
                'name' => 'Matematik', 'slug' => 'matematik-10',
                'icon' => '📐', 'color' => '#1565c0',
                'grade' => '10', 'exam_type' => 'all', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Sayılar', 'meb_code' => 'MAT.10.1', 'topics' => [
                        'Doğal sayıların asal çarpanları ve bölenleri',
                        'EBOB-EKOK',
                        'Bölünebilme kuralları',
                    ]],
                    ['title' => 'Nicelikler ve Değişimler', 'meb_code' => 'MAT.10.2', 'topics' => [
                        'Karesel fonksiyonlar',
                        'Karekök ve rasyonel fonksiyonlar',
                        'Fonksiyonların nitel özellikleri',
                    ]],
                    ['title' => 'Sayma, Algoritma ve Bilişim', 'meb_code' => 'MAT.10.3', 'topics' => [
                        'Temel sayma stratejileri',
                        'Permütasyon ve kombinasyon',
                        'Algoritmik problem çözme',
                    ]],
                    ['title' => 'Geometrik Şekiller', 'meb_code' => 'MAT.10.4', 'topics' => [
                        'Dik üçgende trigonometrik oranlar',
                        'Sinüs ve kosinüs teoremleri',
                        'Üçgende alan ve yardımcı elemanlar',
                    ]],
                    ['title' => 'Analitik İnceleme', 'meb_code' => 'MAT.10.5', 'topics' => [
                        'Dik koordinat sisteminde nokta ve doğru',
                        'İki nokta arası uzaklık',
                        'Doğru parçasını belli oranda bölme',
                    ]],
                    ['title' => 'İstatistiksel Araştırma Süreci', 'meb_code' => 'MAT.10.6', 'topics' => [
                        'İstatistiksel gösterimler ve yorum',
                        'Veri toplama ve modelleme',
                    ]],
                    ['title' => 'Veriden Olasılığa', 'meb_code' => 'MAT.10.7', 'topics' => [
                        'Koşullu olasılık',
                        'Bağımlı ve bağımsız olaylar',
                        'Bayes teoremi (temel)',
                    ]],
                ],
            ],
            [
                'name' => 'Fizik', 'slug' => 'fizik-10',
                'icon' => '⚡', 'color' => '#6a1b9a',
                'grade' => '10', 'exam_type' => 'all', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Kuvvet ve Hareket', 'meb_code' => 'FİZ.10.1', 'topics' => [
                        'Elektrik Yükü', 'Coulomb Yasası', 'Elektrik Alan',
                        'Elektrik Potansiyel', 'Sığa ve Kondansatör',
                    ]],
                    ['title' => 'Enerji', 'meb_code' => 'FİZ.10.2', 'topics' => [
                        'Ohm Yasası', 'Direnç Bağlantıları', 'Kirchhoff Yasaları',
                        'Devre Analizi', 'Elektrik Gücü',
                    ]],
                    ['title' => 'Elektrik', 'meb_code' => 'FİZ.10.3', 'topics' => [
                        'Manyetik Alan', 'Manyetik Kuvvet', 'Ampere Yasası',
                        'Elektromanyetik İndüksiyon',
                    ]],
                    ['title' => 'Dalgalar', 'meb_code' => 'FİZ.10.4', 'topics' => [
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
                    ['title' => 'Etkileşim', 'meb_code' => 'KİM.10.1', 'topics' => [
                        'Mol Kavramı', 'Kimyasal Formüller', 'Kimyasal Denklemler',
                        'Stokiyometri', 'Verim Hesabı',
                    ]],
                    ['title' => 'Çeşitlilik', 'meb_code' => 'KİM.10.2', 'topics' => [
                        'Gaz Yasaları', 'İdeal Gaz Denklemi', 'Dalton Kısmi Basınç',
                    ]],
                    ['title' => 'Çeşitlilik (İleri)', 'meb_code' => 'KİM.10.3', 'topics' => [
                        'Çözünme', 'Derişim Hesapları', 'Koligatif Özellikler',
                    ]],
                    ['title' => 'Sürdürülebilirlik', 'meb_code' => 'KİM.10.4', 'topics' => [
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
                    ['title' => 'Enerji', 'meb_code' => 'BİYO.10.1', 'topics' => [
                        'Mendel Genetiği', 'Kalıtım Çeşitleri', 'Kan Grupları',
                        'Cinsiyet Bağlantılı Kalıtım', 'Mutasyon',
                    ]],
                    ['title' => 'Ekoloji', 'meb_code' => 'BİYO.10.2', 'topics' => [
                        'Ekosistem Bileşenleri', 'Madde Döngüleri', 'Enerji Akışı',
                        'Popülasyon Ekolojisi', 'Biyom Çeşitliliği',
                    ]],
                    ['title' => 'Ekoloji (İleri)', 'meb_code' => 'BİYO.10.3', 'topics' => [
                        'Bitki Dokuları', 'Fotosentez', 'Solunum',
                        'Bitki Büyümesi', 'Üreme',
                    ]],
                ],
            ],
        ];
    }
}

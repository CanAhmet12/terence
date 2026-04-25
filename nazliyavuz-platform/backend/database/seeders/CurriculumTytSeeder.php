<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\InsertsCurriculumSubjects;

/**
 * TYT — Yükseköğretim Kurumları Sınavı birinci oturum konu başlıkları (özet ağaç).
 * Resmî sınav kapsamı için ÖSYM kılavuzları esas alınmalıdır.
 */
class CurriculumTytSeeder extends Seeder
{
    use InsertsCurriculumSubjects;

    public function run(): void
    {
        $this->purgeByGradeAndExamType('all', 'TYT');
        $data = $this->getCurriculum();
        $this->insertCurriculumSubjects($data);
        $this->command->info('CurriculumTytSeeder: ' . count($data) . ' ders (TYT) yazıldı.');
    }

    private function getCurriculum(): array
    {
        return [
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
        ];
    }
}

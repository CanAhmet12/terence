<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\InsertsCurriculumSubjects;

/**
 * KPSS — Kamu Personeli Seçme Sınavı genel yetenek / genel kültür konu başlıkları (özet ağaç).
 * Resmî sınav kapsamı için ÖSYM kılavuzları esas alınmalıdır.
 */
class CurriculumKpssSeeder extends Seeder
{
    use InsertsCurriculumSubjects;

    public function run(): void
    {
        $this->purgeByGradeAndExamType('all', 'KPSS');
        $data = $this->getCurriculum();
        $this->insertCurriculumSubjects($data);
        $this->command->info('CurriculumKpssSeeder: ' . count($data) . ' ders (KPSS) yazıldı.');
    }

    private function getCurriculum(): array
    {
        return [
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

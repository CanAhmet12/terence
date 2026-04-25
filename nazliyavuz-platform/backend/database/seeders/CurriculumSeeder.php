<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Tüm müfredat ağacını sıfırlar: önce tabloları temizler, ardından
 * her sınıf ve her sınav türü için ayrı seeder dosyalarını sırayla çalıştırır.
 *
 * Ortaokul (5–8) ünite/tema başlıkları TYMM (https://tymm.meb.gov.tr) ile eşleştirilmiştir.
 * Lise (9–12) ve sınav (TYT/AYT/LGS/KPSS) ağaçları genel program yapısına göredir; güncel kazanım listesi için ilgili seeder içi notlara bakın.
 */
class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('curriculum_topics')->delete();
        DB::table('curriculum_units')->delete();
        DB::table('curriculum_subjects')->delete();

        $this->call([
            CurriculumGrade5Seeder::class,
            CurriculumGrade6Seeder::class,
            CurriculumGrade7Seeder::class,
            CurriculumGrade8Seeder::class,
            CurriculumGrade9Seeder::class,
            CurriculumGrade10Seeder::class,
            CurriculumGrade11Seeder::class,
            CurriculumGrade12Seeder::class,
            CurriculumTytSeeder::class,
            CurriculumAytSeeder::class,
            CurriculumLgsSeeder::class,
            CurriculumKpssSeeder::class,
        ]);

        $this->command->info('CurriculumSeeder: Tüm sınıf (5–12) ve sınav (TYT, AYT, LGS, KPSS) müfredatı yüklendi.');
    }
}

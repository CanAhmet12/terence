<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Badge;
use App\Models\Achievement;

class GamificationSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedBadges();
        $this->seedAchievements();
    }

    private function seedBadges(): void
    {
        $badges = [
            // Level Badges
            [
                'code' => 'level_10',
                'name' => 'Yeni Başlayan',
                'description' => 'Seviye 10\'a ulaştın!',
                'category' => 'milestone',
                'condition_type' => 'level',
                'condition_value' => 10,
                'tier' => 'bronze',
                'requirements' => ['level' => 10],
                'points' => 50,
            ],
            [
                'code' => 'level_25',
                'name' => 'Azimli Öğrenci',
                'description' => 'Seviye 25\'e ulaştın!',
                'category' => 'milestone',
                'condition_type' => 'level',
                'condition_value' => 25,
                'tier' => 'silver',
                'requirements' => ['level' => 25],
                'points' => 100,
            ],
            [
                'code' => 'level_50',
                'name' => 'Deneyimli Savaşçı',
                'description' => 'Seviye 50\'ye ulaştın!',
                'category' => 'milestone',
                'condition_type' => 'level',
                'condition_value' => 50,
                'tier' => 'gold',
                'requirements' => ['level' => 50],
                'points' => 200,
            ],
            [
                'code' => 'level_100',
                'name' => 'Efsane',
                'description' => 'Seviye 100\'e ulaştın!',
                'category' => 'milestone',
                'condition_type' => 'level',
                'condition_value' => 100,
                'tier' => 'platinum',
                'requirements' => ['level' => 100],
                'points' => 500,
            ],

            // Streak Badges
            [
                'code' => 'streak_week',
                'name' => '7 Günlük Disiplin',
                'description' => '7 gün üst üste giriş yaptın!',
                'category' => 'streak',
                'condition_type' => 'streak',
                'condition_value' => 7,
                'tier' => 'bronze',
                'requirements' => ['streak_days' => 7],
                'points' => 30,
            ],
            [
                'code' => 'streak_month',
                'name' => 'Aylık Devamlılık',
                'description' => '30 gün üst üste giriş yaptın!',
                'category' => 'streak',
                'condition_type' => 'streak',
                'condition_value' => 30,
                'tier' => 'gold',
                'requirements' => ['streak_days' => 30],
                'points' => 150,
            ],
            [
                'code' => 'streak_100',
                'name' => 'Durmak Yok',
                'description' => '100 gün üst üste giriş yaptın!',
                'category' => 'streak',
                'condition_type' => 'streak',
                'condition_value' => 100,
                'tier' => 'platinum',
                'requirements' => ['streak_days' => 100],
                'points' => 500,
            ],

            // Question Solving Badges
            [
                'code' => 'questions_100',
                'name' => 'Soru Çözücü',
                'description' => '100 soru çözdün!',
                'category' => 'performance',
                'condition_type' => 'questions_solved',
                'condition_value' => 100,
                'tier' => 'bronze',
                'requirements' => ['questions_solved' => 100],
                'points' => 25,
            ],
            [
                'code' => 'questions_1000',
                'name' => 'Soru Avcısı',
                'description' => '1000 soru çözdün!',
                'category' => 'performance',
                'condition_type' => 'questions_solved',
                'condition_value' => 1000,
                'tier' => 'silver',
                'requirements' => ['questions_solved' => 1000],
                'points' => 100,
            ],
            [
                'code' => 'questions_10000',
                'name' => 'Soru Efendisi',
                'description' => '10,000 soru çözdün!',
                'category' => 'performance',
                'condition_type' => 'questions_solved',
                'condition_value' => 10000,
                'tier' => 'gold',
                'requirements' => ['questions_solved' => 10000],
                'points' => 500,
            ],

            // Accuracy Badges
            [
                'code' => 'accuracy_90',
                'name' => 'Keskin Nişancı',
                'description' => '%90 üzeri doğruluk oranı!',
                'category' => 'performance',
                'condition_type' => 'accuracy',
                'condition_value' => 90,
                'tier' => 'silver',
                'requirements' => ['accuracy_rate' => 90, 'min_questions' => 100],
                'points' => 75,
            ],
            [
                'code' => 'accuracy_95',
                'name' => 'Mükemmeliyetçi',
                'description' => '%95 üzeri doğruluk oranı!',
                'category' => 'performance',
                'condition_type' => 'accuracy',
                'condition_value' => 95,
                'tier' => 'gold',
                'requirements' => ['accuracy_rate' => 95, 'min_questions' => 100],
                'points' => 150,
            ],

            // Exam Badges
            [
                'code' => 'exam_10',
                'name' => 'Deneme Ustası',
                'description' => '10 deneme sınavı tamamladın!',
                'category' => 'performance',
                'condition_type' => 'exams',
                'condition_value' => 10,
                'tier' => 'bronze',
                'requirements' => ['exams_completed' => 10],
                'points' => 50,
            ],
            [
                'code' => 'exam_50',
                'name' => 'Sınav Şampiyonu',
                'description' => '50 deneme sınavı tamamladın!',
                'category' => 'performance',
                'condition_type' => 'exams',
                'condition_value' => 50,
                'tier' => 'gold',
                'requirements' => ['exams_completed' => 50],
                'points' => 200,
            ],

            // Special Badges
            [
                'code' => 'early_bird',
                'name' => 'Erken Kuş',
                'description' => 'Sabah 6-8 arası çalıştın!',
                'category' => 'special',
                'condition_type' => 'time',
                'condition_value' => 1,
                'tier' => 'bronze',
                'requirements' => ['early_morning_study' => true],
                'points' => 20,
            ],
            [
                'code' => 'night_owl',
                'name' => 'Gece Kuşu',
                'description' => 'Gece 10-12 arası çalıştın!',
                'category' => 'special',
                'condition_type' => 'time',
                'condition_value' => 1,
                'tier' => 'bronze',
                'requirements' => ['late_night_study' => true],
                'points' => 20,
            ],
        ];

        foreach ($badges as $badge) {
            Badge::updateOrCreate(
                ['code' => $badge['code']],
                $badge
            );
        }
    }

    private function seedAchievements(): void
    {
        $achievements = [
            [
                'code' => 'first_question',
                'name' => 'İlk Adım',
                'description' => 'İlk soruyu çözdün!',
                'type' => 'question_milestone',
                'criteria' => ['questions_solved' => 1],
                'xp_reward' => 10,
                'points_reward' => 5,
                'is_repeatable' => false,
            ],
            [
                'code' => 'daily_5_questions',
                'name' => 'Günlük Hedef',
                'description' => 'Bir günde 5 soru çözdün!',
                'type' => 'daily_goal',
                'criteria' => ['daily_questions' => 5],
                'xp_reward' => 25,
                'points_reward' => 10,
                'is_repeatable' => true,
            ],
            [
                'code' => 'perfect_exam',
                'name' => 'Kusursuz Performans',
                'description' => 'Bir denemede tüm soruları doğru çözdün!',
                'type' => 'exam_perfection',
                'criteria' => ['exam_accuracy' => 100],
                'xp_reward' => 100,
                'points_reward' => 50,
                'is_repeatable' => true,
            ],
            [
                'code' => 'speed_demon',
                'name' => 'Hızlı Düşünen',
                'description' => 'Ortalama 30 saniyede soru çözdün!',
                'type' => 'speed',
                'criteria' => ['avg_time_per_question' => 30],
                'xp_reward' => 50,
                'points_reward' => 25,
                'is_repeatable' => false,
            ],
            [
                'code' => 'study_marathon',
                'name' => 'Maraton Koşucusu',
                'description' => 'Bir günde 4 saat çalıştın!',
                'type' => 'study_time',
                'criteria' => ['daily_study_minutes' => 240],
                'xp_reward' => 75,
                'points_reward' => 35,
                'is_repeatable' => true,
            ],
        ];

        foreach ($achievements as $achievement) {
            Achievement::updateOrCreate(
                ['code' => $achievement['code']],
                $achievement
            );
        }
    }
}

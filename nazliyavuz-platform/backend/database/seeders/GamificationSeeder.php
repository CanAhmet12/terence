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
                'category' => 'achievement',
                'tier' => 'bronze',
                'requirements' => ['level' => 10],
                'points' => 50,
            ],
            [
                'code' => 'level_25',
                'name' => 'Azimli Öğrenci',
                'description' => 'Seviye 25\'e ulaştın!',
                'category' => 'achievement',
                'tier' => 'silver',
                'requirements' => ['level' => 25],
                'points' => 100,
            ],
            [
                'code' => 'level_50',
                'name' => 'Deneyimli Savaşçı',
                'description' => 'Seviye 50\'ye ulaştın!',
                'category' => 'achievement',
                'tier' => 'gold',
                'requirements' => ['level' => 50],
                'points' => 200,
            ],
            [
                'code' => 'level_100',
                'name' => 'Efsane',
                'description' => 'Seviye 100\'e ulaştın!',
                'category' => 'achievement',
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
                'tier' => 'bronze',
                'requirements' => ['streak_days' => 7],
                'points' => 30,
            ],
            [
                'code' => 'streak_month',
                'name' => 'Aylık Devamlılık',
                'description' => '30 gün üst üste giriş yaptın!',
                'category' => 'streak',
                'tier' => 'gold',
                'requirements' => ['streak_days' => 30],
                'points' => 150,
            ],
            [
                'code' => 'streak_100',
                'name' => 'Durmak Yok',
                'description' => '100 gün üst üste giriş yaptın!',
                'category' => 'streak',
                'tier' => 'platinum',
                'requirements' => ['streak_days' => 100],
                'points' => 500,
            ],

            // Question Solving Badges
            [
                'code' => 'questions_100',
                'name' => 'Soru Çözücü',
                'description' => '100 soru çözdün!',
                'category' => 'achievement',
                'tier' => 'bronze',
                'requirements' => ['questions_solved' => 100],
                'points' => 25,
            ],
            [
                'code' => 'questions_1000',
                'name' => 'Soru Avcısı',
                'description' => '1000 soru çözdün!',
                'category' => 'achievement',
                'tier' => 'silver',
                'requirements' => ['questions_solved' => 1000],
                'points' => 100,
            ],
            [
                'code' => 'questions_10000',
                'name' => 'Soru Efendisi',
                'description' => '10,000 soru çözdün!',
                'category' => 'achievement',
                'tier' => 'gold',
                'requirements' => ['questions_solved' => 10000],
                'points' => 500,
            ],

            // Accuracy Badges
            [
                'code' => 'accuracy_90',
                'name' => 'Keskin Nişancı',
                'description' => '%90 üzeri doğruluk oranı!',
                'category' => 'achievement',
                'tier' => 'silver',
                'requirements' => ['accuracy_rate' => 90, 'min_questions' => 100],
                'points' => 75,
            ],
            [
                'code' => 'accuracy_95',
                'name' => 'Mükemmeliyetçi',
                'description' => '%95 üzeri doğruluk oranı!',
                'category' => 'achievement',
                'tier' => 'gold',
                'requirements' => ['accuracy_rate' => 95, 'min_questions' => 100],
                'points' => 150,
            ],

            // Exam Badges
            [
                'code' => 'exam_10',
                'name' => 'Deneme Ustası',
                'description' => '10 deneme sınavı tamamladın!',
                'category' => 'achievement',
                'tier' => 'bronze',
                'requirements' => ['exams_completed' => 10],
                'points' => 50,
            ],
            [
                'code' => 'exam_50',
                'name' => 'Sınav Şampiyonu',
                'description' => '50 deneme sınavı tamamladın!',
                'category' => 'achievement',
                'tier' => 'gold',
                'requirements' => ['exams_completed' => 50],
                'points' => 200,
            ],

            // Social Badges
            [
                'code' => 'social_first_comment',
                'name' => 'Topluluk Üyesi',
                'description' => 'İlk yorumunu yaptın!',
                'category' => 'social',
                'tier' => 'bronze',
                'requirements' => ['comments_made' => 1],
                'points' => 10,
            ],
            [
                'code' => 'social_helpful',
                'name' => 'Yardımsever',
                'description' => '10 kişiye yardımcı oldun!',
                'category' => 'social',
                'tier' => 'silver',
                'requirements' => ['helpful_votes' => 10],
                'points' => 50,
            ],

            // Special Badges
            [
                'code' => 'early_bird',
                'name' => 'Erken Kuş',
                'description' => 'Sabah 6-8 arası çalıştın!',
                'category' => 'special',
                'tier' => 'bronze',
                'requirements' => ['early_morning_study' => true],
                'points' => 20,
            ],
            [
                'code' => 'night_owl',
                'name' => 'Gece Kuşu',
                'description' => 'Gece 10-12 arası çalıştın!',
                'category' => 'special',
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

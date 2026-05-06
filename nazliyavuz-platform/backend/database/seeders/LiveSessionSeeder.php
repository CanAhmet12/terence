<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LiveSessionSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        
        // Öğretmenleri bul
        $teachers = DB::table('users')->where('role', 'teacher')->get();
        
        if ($teachers->isEmpty()) {
            $this->command->error('Öğretmen bulunamadı!');
            return;
        }
        
        // 12. ve 11. sınıf dersleri
        $subjects = DB::table('curriculum_subjects')
            ->whereIn('grade', [11, 12])
            ->get();
        
        // Önümüzdeki 2 hafta ve geçmiş 1 ay için canlı dersler
        $sessions = [];
        
        foreach ($subjects as $subject) {
            // Her ders için 3 geçmiş, 2 gelecek ders
            
            // Geçmiş dersler (kayıtlı)
            for ($i = 1; $i <= 3; $i++) {
                $teacher = $teachers->random();
                $sessionDate = $now->copy()->subDays(rand(1, 30));
                
                $sessions[] = [
                    'title' => "{$subject->name} - Canlı Ders {$i}",
                    'description' => "{$subject->name} konularının detaylı anlatımı. Soru-cevap bölümü ile interaktif ders.",
                    'teacher_id' => $teacher->id,
                    'subject_id' => $subject->id,
                    'scheduled_at' => $sessionDate,
                    'duration_minutes' => rand(60, 120),
                    'meeting_url' => "https://meet.terenceegitim.com/live-" . \Illuminate\Support\Str::random(12),
                    'recording_url' => "https://cdn.terenceegitim.com/recordings/session-" . \Illuminate\Support\Str::random(16) . ".mp4",
                    'status' => 'completed',
                    'max_participants' => rand(50, 200),
                    'is_recorded' => true,
                    'is_public' => rand(0, 1) === 1,
                    'grade' => $subject->grade,
                    'exam_type' => 'TYT-AYT',
                    'thumbnail_url' => "https://cdn.terenceegitim.com/thumbnails/live-{$subject->slug}-{$i}.jpg",
                    'created_at' => $sessionDate->copy()->subHours(24),
                    'updated_at' => $sessionDate->copy()->addHours(2),
                ];
            }
            
            // Gelecek dersler (planlanmış)
            for ($i = 1; $i <= 2; $i++) {
                $teacher = $teachers->random();
                $sessionDate = $now->copy()->addDays(rand(1, 14));
                
                $sessions[] = [
                    'title' => "{$subject->name} - Canlı Ders (Yaklaşan)",
                    'description' => "{$subject->name} konularının interaktif anlatımı. Öğrencilerle soru-cevap ve problem çözümü.",
                    'teacher_id' => $teacher->id,
                    'subject_id' => $subject->id,
                    'scheduled_at' => $sessionDate,
                    'duration_minutes' => rand(60, 120),
                    'meeting_url' => "https://meet.terenceegitim.com/live-" . \Illuminate\Support\Str::random(12),
                    'recording_url' => null,
                    'status' => 'scheduled',
                    'max_participants' => rand(50, 200),
                    'is_recorded' => true,
                    'is_public' => true,
                    'grade' => $subject->grade,
                    'exam_type' => 'TYT-AYT',
                    'thumbnail_url' => "https://cdn.terenceegitim.com/thumbnails/live-{$subject->slug}-upcoming.jpg",
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        
        // Batch insert
        foreach (array_chunk($sessions, 50) as $chunk) {
            DB::table('live_sessions')->insert($chunk);
        }
        
        $this->command->info('✅ ' . count($sessions) . ' canlı ders oluşturuldu!');
    }
}

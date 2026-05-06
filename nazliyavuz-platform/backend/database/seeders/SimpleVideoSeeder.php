<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SimpleVideoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        
        // Mevcut content_items'leri al (type=video olan ama videos tablosunda olmayan)
        $videoContentItems = DB::table('content_items')
            ->where('type', 'video')
            ->get();
        
        $this->command->info("Toplam {$videoContentItems->count()} video content item bulundu");
        
        // Her biri için videos tablosuna kayıt ekle
        $videoCount = 0;
        foreach ($videoContentItems as $contentItem) {
            // Zaten var mı kontrol et
            $exists = DB::table('videos')
                ->where('content_item_id', $contentItem->id)
                ->exists();
            
            if ($exists) {
                continue;
            }
            
            // Topic bilgisini al
            $topic = DB::table('curriculum_topics')->find($contentItem->topic_id);
            if (!$topic) continue;
            
            // Unit bilgisini al
            $unit = DB::table('curriculum_units')->find($topic->unit_id);
            if (!$unit) continue;
            
            // Subject bilgisini al
            $subject = DB::table('curriculum_subjects')->find($unit->subject_id);
            if (!$subject) continue;
            
            // Video kaydı oluştur
            DB::table('videos')->insert([
                'content_item_id' => $contentItem->id,
                'title' => $contentItem->title,
                'description' => "Bu videoda {$topic->title} konusunu detaylı şekilde işleyeceğiz. {$subject->name} dersi için hazırlanmış kapsamlı anlatım.",
                'original_file_path' => "/videos/{$subject->slug}/{$unit->id}/{$topic->id}/video.mp4",
                'cdn_url' => "https://cdn.terenceegitim.com/videos/{$subject->slug}/{$unit->id}/{$topic->id}/video.mp4",
                'duration_seconds' => $contentItem->duration_seconds ?? rand(600, 2400),
                'thumbnail_url' => "https://cdn.terenceegitim.com/thumbnails/{$subject->slug}/{$unit->id}/{$topic->id}/thumb.jpg",
                'drm_enabled' => true,
                'is_processed' => true,
                'available_qualities' => json_encode(['360p', '480p', '720p', '1080p']),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            
            $videoCount++;
        }
        
        $this->command->info("✅ {$videoCount} video başarıyla oluşturuldu!");
        
        // Şimdi canlı dersleri artıralım
        $this->seedMoreLiveSessions($now);
    }
    
    private function seedMoreLiveSessions($now): void
    {
        // Öğretmenleri bul
        $teachers = DB::table('users')->where('role', 'teacher')->get();
        
        if ($teachers->isEmpty()) {
            $this->command->warn('Öğretmen bulunamadı, canlı ders eklenmedi.');
            return;
        }
        
        // 11. ve 12. sınıf dersleri
        $subjects = DB::table('curriculum_subjects')
            ->whereIn('grade', [11, 12])
            ->get();
        
        $sessionCount = 0;
        
        foreach ($subjects as $subject) {
            // Her ders için 2 geçmiş, 1 gelecek ders
            
            // Geçmiş dersler (kayıtlı)
            for ($i = 1; $i <= 2; $i++) {
                $teacher = $teachers->random();
                $sessionDate = $now->copy()->subDays(rand(1, 20));
                
                DB::table('live_sessions')->insert([
                    'title' => "{$subject->name} - Canlı Ders Kaydı {$i}",
                    'description' => "{$subject->name} konularının detaylı anlatımı. Soru-cevap bölümü ile interaktif ders kaydı.",
                    'teacher_id' => $teacher->id,
                    'subject_id' => $subject->id,
                    'scheduled_at' => $sessionDate,
                    'duration_minutes' => rand(60, 90),
                    'meeting_url' => "https://meet.terenceegitim.com/live-" . \Illuminate\Support\Str::random(10),
                    'recording_url' => "https://cdn.terenceegitim.com/recordings/session-" . \Illuminate\Support\Str::random(16) . ".mp4",
                    'status' => 'completed',
                    'max_participants' => rand(50, 150),
                    'is_recorded' => true,
                    'is_public' => true,
                    'grade' => $subject->grade,
                    'exam_type' => 'TYT-AYT',
                    'thumbnail_url' => "https://cdn.terenceegitim.com/thumbnails/live-{$subject->slug}-{$i}.jpg",
                    'created_at' => $sessionDate->copy()->subHours(24),
                    'updated_at' => $sessionDate->copy()->addHours(2),
                ]);
                
                $sessionCount++;
            }
            
            // Gelecek ders (planlanmış)
            $teacher = $teachers->random();
            $sessionDate = $now->copy()->addDays(rand(1, 10));
            
            DB::table('live_sessions')->insert([
                'title' => "{$subject->name} - Canlı Ders",
                'description' => "{$subject->name} konularının interaktif anlatımı. Öğrencilerle soru-cevap ve problem çözümü.",
                'teacher_id' => $teacher->id,
                'subject_id' => $subject->id,
                'scheduled_at' => $sessionDate,
                'duration_minutes' => rand(60, 90),
                'meeting_url' => "https://meet.terenceegitim.com/live-" . \Illuminate\Support\Str::random(10),
                'recording_url' => null,
                'status' => 'scheduled',
                'max_participants' => rand(50, 150),
                'is_recorded' => true,
                'is_public' => true,
                'grade' => $subject->grade,
                'exam_type' => 'TYT-AYT',
                'thumbnail_url' => "https://cdn.terenceegitim.com/thumbnails/live-{$subject->slug}-upcoming.jpg",
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            
            $sessionCount++;
        }
        
        $this->command->info("✅ {$sessionCount} canlı ders başarıyla oluşturuldu!");
    }
}

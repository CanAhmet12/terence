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
        
        $sessionCount = 0;
        
        // Basit canlı dersler - 10 geçmiş, 5 gelecek
        for ($i = 1; $i <= 10; $i++) {
            $teacher = $teachers->random();
            $sessionDate = $now->copy()->subDays(rand(1, 30));
            
            DB::table('live_sessions')->insert([
                'teacher_id' => $teacher->id,
                'class_room_id' => null,
                'title' => "TYT/AYT Canlı Ders - Kayıt {$i}",
                'daily_room_url' => "https://meet.terenceegitim.com/live-" . \Illuminate\Support\Str::random(10),
                'daily_room_name' => "live-session-" . \Illuminate\Support\Str::random(8),
                'scheduled_at' => $sessionDate,
                'duration_minutes' => rand(60, 90),
                'status' => 'ended',
                'created_at' => $sessionDate->copy()->subHours(24),
                'updated_at' => $sessionDate->copy()->addHours(2),
            ]);
            
            $sessionCount++;
        }
        
        // Gelecek dersler
        for ($i = 1; $i <= 5; $i++) {
            $teacher = $teachers->random();
            $sessionDate = $now->copy()->addDays(rand(1, 10));
            
            DB::table('live_sessions')->insert([
                'teacher_id' => $teacher->id,
                'class_room_id' => null,
                'title' => "TYT/AYT Canlı Ders - Yaklaşan {$i}",
                'daily_room_url' => "https://meet.terenceegitim.com/live-" . \Illuminate\Support\Str::random(10),
                'daily_room_name' => "live-session-" . \Illuminate\Support\Str::random(8),
                'scheduled_at' => $sessionDate,
                'duration_minutes' => rand(60, 90),
                'status' => 'scheduled',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            
            $sessionCount++;
        }
        
        $this->command->info("✅ {$sessionCount} canlı ders başarıyla oluşturuldu!");
    }
}

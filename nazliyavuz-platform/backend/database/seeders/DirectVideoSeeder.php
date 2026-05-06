<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DirectVideoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        
        // topics tablosundaki konular (content_items ile ilişkili olan)
        $topics = DB::table('topics as t')
            ->join('units as u', 't.unit_id', '=', 'u.id')
            ->select('t.id as topic_id', 't.title as topic_title', 'u.id as unit_id')
            ->where('t.is_active', true)
            ->get();
        
        if ($topics->isEmpty()) {
            $this->command->warn('Konular bulunamadı.');
            return;
        }
        
        $this->command->info("{$topics->count()} konu bulundu");
        
        $videoCount = 0;
        
        foreach ($topics as $topic) {
            // Her konu için 3-5 video oluştur
            $count = rand(3, 5);
            
            for ($i = 1; $i <= $count; $i++) {
                // Content item oluştur
                $contentItemId = DB::table('content_items')->insertGetId([
                    'topic_id' => $topic->topic_id,
                    'type' => 'video',
                    'title' => "{$topic->topic_title} - Video Ders {$i}",
                    'url' => "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    'duration_seconds' => rand(600, 2400),
                    'size_bytes' => rand(50000000, 200000000),
                    'sort_order' => $i,
                    'is_free' => $i === 1,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                
                // Video detayı oluştur
                DB::table('videos')->insert([
                    'content_item_id' => $contentItemId,
                    'title' => "{$topic->topic_title} - Video Ders {$i}",
                    'description' => "Bu videoda {$topic->topic_title} konusunu detaylı şekilde işleyeceğiz. TYT/AYT hazırlık için kapsamlı video ders anlatımı.",
                    'original_file_path' => "/videos/unit-{$topic->unit_id}/topic-{$topic->topic_id}/video_{$i}.mp4",
                    'cdn_url' => "https://cdn.terenceegitim.com/videos/unit-{$topic->unit_id}/topic-{$topic->topic_id}/video_{$i}.mp4",
                    'duration_seconds' => rand(600, 2400),
                    'thumbnail_url' => "https://cdn.terenceegitim.com/thumbnails/unit-{$topic->unit_id}/topic-{$topic->topic_id}/thumb_{$i}.jpg",
                    'drm_enabled' => true,
                    'is_processed' => true,
                    'available_qualities' => json_encode(['360p', '480p', '720p', '1080p']),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                
                $videoCount++;
            }
        }
        
        $this->command->info("✅ {$videoCount} video başarıyla oluşturuldu!");
    }
}

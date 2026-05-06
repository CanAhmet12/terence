<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ComprehensiveVideoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        
        // TYT/AYT için 12. sınıf dersleri
        $grade12Subjects = DB::table('curriculum_subjects')
            ->where('grade', 12)
            ->get();
        
        if ($grade12Subjects->isEmpty()) {
            $this->command->error('12. sınıf dersleri bulunamadı!');
            return;
        }
        
        // Her ders için konu ve içerik oluştur
        foreach ($grade12Subjects as $subject) {
            $this->command->info("İşleniyor: {$subject->name} (Sınıf 12)");
            
            // Konular oluştur
            $topics = $this->createTopicsForSubject($subject, $now);
            
            foreach ($topics as $topic) {
                // Her konu için video content items oluştur
                $this->createVideoContents($topic, $subject, $now);
            }
        }
        
        // 11. sınıf için de ekle
        $grade11Subjects = DB::table('curriculum_subjects')
            ->where('grade', 11)
            ->get();
            
        foreach ($grade11Subjects as $subject) {
            $this->command->info("İşleniyor: {$subject->name} (Sınıf 11)");
            
            $topics = $this->createTopicsForSubject($subject, $now);
            
            foreach ($topics as $topic) {
                $this->createVideoContents($topic, $subject, $now);
            }
        }
        
        $this->command->info('✅ Video içerikleri başarıyla oluşturuldu!');
    }
    
    private function createTopicsForSubject($subject, $now): array
    {
        $topics = [];
        
        // Matematik konuları
        if (str_contains(strtolower($subject->name), 'matematik')) {
            $topicNames = [
                'Fonksiyonlar',
                'Türev',
                'İntegral',
                'Limit ve Süreklilik',
                'Trigonometri',
                'Logaritma',
                'Diziler ve Seriler',
                'Olasılık'
            ];
        }
        // Fizik konuları
        elseif (str_contains(strtolower($subject->name), 'fizik')) {
            $topicNames = [
                'Kuvvet ve Hareket',
                'Enerji',
                'Elektrik',
                'Manyetizma',
                'Optik',
                'Modern Fizik',
                'Dalga ve Titreşim',
                'Atım ve Çarpışma'
            ];
        }
        // Kimya konuları
        elseif (str_contains(strtolower($subject->name), 'kimya')) {
            $topicNames = [
                'Atom ve Periyodik Sistem',
                'Kimyasal Bağlar',
                'Asitler ve Bazlar',
                'Kimyasal Tepkimeler',
                'Organik Kimya',
                'Karışımlar',
                'Gazlar',
                'Çözelti Kimyası'
            ];
        }
        // Biyoloji konuları
        elseif (str_contains(strtolower($subject->name), 'biyoloji')) {
            $topicNames = [
                'Hücre Bölünmesi',
                'Genetik',
                'DNA ve RNA',
                'Canlıların Sınıflandırılması',
                'Ekosistem',
                'Sinir Sistemi',
                'Dolaşım Sistemi',
                'Bitki Biyolojisi'
            ];
        }
        // Türkçe konuları
        elseif (str_contains(strtolower($subject->name), 'türkçe') || str_contains(strtolower($subject->name), 'türk dili')) {
            $topicNames = [
                'Sözcük Türleri',
                'Cümle Bilgisi',
                'Anlatım Biçimleri',
                'Paragraf',
                'Söz Sanatları',
                'Yazım Kuralları',
                'Noktalama',
                'Fiilimsiler'
            ];
        }
        // Tarih konuları
        elseif (str_contains(strtolower($subject->name), 'tarih')) {
            $topicNames = [
                'Osmanlı Tarihi',
                'Atatürk İlkeleri',
                'İnkılap Tarihi',
                'Dünya Savaşları',
                'Soğuk Savaş Dönemi',
                'Türk Kurtuluş Savaşı',
                'İslam Tarihi',
                'Çağdaş Türk Tarihi'
            ];
        }
        // Coğrafya konuları
        elseif (str_contains(strtolower($subject->name), 'coğrafya')) {
            $topicNames = [
                'Fiziki Coğrafya',
                'Beşeri Coğrafya',
                'Haritalar',
                'İklim ve Hava',
                'Türkiye Coğrafyası',
                'Ekonomik Coğrafya',
                'Doğal Kaynaklar',
                'Nüfus ve Yerleşme'
            ];
        }
        // Edebiyat konuları
        elseif (str_contains(strtolower($subject->name), 'edebiyat')) {
            $topicNames = [
                'Divan Edebiyatı',
                'Tanzimat Edebiyatı',
                'Cumhuriyet Dönemi Edebiyatı',
                'Nazım Biçimleri',
                'Edebi Akımlar',
                'Roman İncelemesi',
                'Şiir İncelemesi',
                'Hikaye İncelemesi'
            ];
        }
        // Felsefe konuları
        elseif (str_contains(strtolower($subject->name), 'felsefe')) {
            $topicNames = [
                'Felsefenin Doğuşu',
                'Epistemoloji',
                'Ontoloji',
                'Etik',
                'Mantık',
                'Bilgi Felsefesi',
                'Din Felsefesi',
                'Siyaset Felsefesi'
            ];
        }
        else {
            $topicNames = [
                'Temel Kavramlar',
                'İleri Konular',
                'Problemler ve Çözümler',
                'Sınav Stratejileri'
            ];
        }
        
        foreach ($topicNames as $index => $topicName) {
            $topicId = DB::table('curriculum_topics')->insertGetId([
                'subject_id' => $subject->id,
                'name' => $topicName,
                'slug' => \Illuminate\Support\Str::slug($topicName . '-' . $subject->id),
                'description' => "{$subject->name} - {$topicName} konusu detaylı anlatım",
                'sort_order' => $index + 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            
            $topics[] = (object)[
                'id' => $topicId,
                'name' => $topicName,
                'subject_id' => $subject->id
            ];
        }
        
        return $topics;
    }
    
    private function createVideoContents($topic, $subject, $now): void
    {
        // Her konu için 3-5 video oluştur
        $videoCount = rand(3, 5);
        
        for ($i = 1; $i <= $videoCount; $i++) {
            // Content item oluştur
            $contentItemId = DB::table('content_items')->insertGetId([
                'topic_id' => $topic->id,
                'type' => 'video',
                'title' => "{$topic->name} - Ders {$i}",
                'url' => "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Örnek URL
                'duration_seconds' => rand(600, 2400), // 10-40 dakika
                'size_bytes' => rand(50000000, 200000000), // 50-200 MB
                'sort_order' => $i,
                'is_free' => $i === 1, // İlk video ücretsiz
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            
            // Video detayları oluştur
            DB::table('videos')->insert([
                'content_item_id' => $contentItemId,
                'title' => "{$subject->name} - {$topic->name} Ders {$i}",
                'description' => "Bu videoda {$topic->name} konusunu detaylı şekilde işleyeceğiz. {$subject->name} dersi için hazırlanmış kapsamlı anlatım.",
                'original_file_path' => "/videos/{$subject->slug}/{$topic->id}/video_{$i}.mp4",
                'cdn_url' => "https://cdn.terenceegitim.com/videos/{$subject->slug}/{$topic->id}/video_{$i}.mp4",
                'duration_seconds' => rand(600, 2400),
                'thumbnail_url' => "https://cdn.terenceegitim.com/thumbnails/{$subject->slug}/{$topic->id}/thumb_{$i}.jpg",
                'drm_enabled' => true,
                'is_processed' => true,
                'available_qualities' => json_encode(['360p', '480p', '720p', '1080p']),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}

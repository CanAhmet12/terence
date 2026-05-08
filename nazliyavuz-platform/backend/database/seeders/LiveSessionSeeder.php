<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Gerçek `live_sessions` şeması ile uyumlu örnek veriler (geliştirme).
 * Yeni kolonlar için önce `2026_05_08_120000_extend_live_sessions_and_attendance` migration çalıştırılmalıdır.
 */
class LiveSessionSeeder extends Seeder
{
    public function run(): void
    {
        $teacher = DB::table('users')->where('role', 'teacher')->first();
        if (!$teacher) {
            if ($this->command) {
                $this->command->warn('LiveSessionSeeder: öğretmen yok, atlanıyor.');
            }

            return;
        }

        $classId = DB::table('class_rooms')->where('teacher_id', $teacher->id)->value('id');
        $now     = Carbon::now();

        $room1 = 'terence-seed-' . Str::random(6);
        $room2 = 'terence-seed-' . Str::random(6);

        $rows = [
            [
                'teacher_id'        => $teacher->id,
                'class_room_id'     => $classId,
                'is_public'         => false,
                'title'             => 'Örnek yaklaşan canlı ders',
                'subject_tag'       => 'TYT Matematik',
                'description'       => 'Seeder ile oluşturuldu.',
                'daily_room_url'    => 'https://terenceegitim.daily.co/' . $room1,
                'daily_room_name'   => $room1,
                'recording_url'     => null,
                'scheduled_at'      => $now->copy()->addDays(2),
                'started_at'        => null,
                'ended_at'          => null,
                'duration_minutes'  => 45,
                'max_participants'  => 120,
                'status'            => 'scheduled',
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
            [
                'teacher_id'        => $teacher->id,
                'class_room_id'     => null,
                'is_public'         => true,
                'title'             => 'Genel yayın (örnek)',
                'subject_tag'       => 'TYT Türkçe',
                'description'       => null,
                'daily_room_url'    => 'https://terenceegitim.daily.co/' . $room2,
                'daily_room_name'   => $room2,
                'recording_url'     => null,
                'scheduled_at'      => $now->copy()->addHours(3),
                'started_at'        => null,
                'ended_at'          => null,
                'duration_minutes'  => 60,
                'max_participants'  => null,
                'status'            => 'scheduled',
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
            [
                'teacher_id'        => $teacher->id,
                'class_room_id'     => $classId,
                'is_public'         => false,
                'title'             => 'Bitmiş ders (kayıt örneği)',
                'subject_tag'       => 'AYT Fizik',
                'description'       => null,
                'daily_room_url'    => 'https://terenceegitim.daily.co/' . Str::slug('bitmis-' . Str::random(4)),
                'daily_room_name'   => 'terence-ended-' . Str::random(4),
                'recording_url'     => 'https://example.com/recordings/demo.mp4',
                'scheduled_at'      => $now->copy()->subDays(5),
                'started_at'        => $now->copy()->subDays(5),
                'ended_at'          => $now->copy()->subDays(5)->addMinutes(50),
                'duration_minutes'  => 50,
                'max_participants'  => null,
                'status'            => 'ended',
                'created_at'        => $now->copy()->subDays(6),
                'updated_at'        => $now->copy()->subDays(5),
            ],
        ];

        foreach ($rows as $row) {
            DB::table('live_sessions')->insert($row);
        }

        if ($this->command) {
            $this->command->info('LiveSessionSeeder: ' . count($rows) . ' oturum eklendi.');
        }
    }
}

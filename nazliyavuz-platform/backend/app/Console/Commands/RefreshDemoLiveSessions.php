<?php

namespace App\Console\Commands;

use App\Models\LiveSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Örnek / herkese açık canlı ders kayıtlarının tarihlerini geleceğe alır.
 * Eski seed veya geçmiş tarihler nedeniyle API'nin "upcoming" listesinde görünmemelerini önler.
 */
class RefreshDemoLiveSessions extends Command
{
    protected $signature = 'live:refresh-demos';

    protected $description = 'Örnek ve herkese açık canlı ders oturumlarının scheduled_at değerlerini günceller.';

    public function handle(): int
    {
        $teacher = User::query()->where('role', 'teacher')->orderBy('id')->first();
        if (!$teacher) {
            $this->warn('Öğretmen kullanıcısı yok; işlem yapılmadı.');

            return self::FAILURE;
        }

        $base = Carbon::now();

        $sessions = LiveSession::query()
            ->where(function ($q) {
                $q->where('is_public', true)
                    ->orWhere('title', 'like', '%örnek%')
                    ->orWhere('title', 'like', '%Genel yayın%')
                    ->orWhere('title', 'like', '%yaklaşan canlı%');
            })
            ->orderBy('id')
            ->get();

        if ($sessions->isEmpty()) {
            $room = 'terence-demo-' . Str::random(6);
            LiveSession::query()->create([
                'teacher_id'       => $teacher->id,
                'class_room_id'    => null,
                'is_public'        => true,
                'title'            => 'Genel yayın (örnek)',
                'subject_tag'      => 'TYT Türkçe',
                'description'      => 'Otomatik oluşturuldu (live:refresh-demos).',
                'daily_room_url'   => 'https://terenceegitim.daily.co/' . $room,
                'daily_room_name'  => $room,
                'recording_url'    => null,
                'scheduled_at'     => $base->copy()->addHours(4),
                'started_at'       => null,
                'ended_at'         => null,
                'duration_minutes' => 45,
                'max_participants' => 120,
                'status'           => 'scheduled',
            ]);
            $this->info('Herkese açık örnek oturum oluşturuldu.');

            return self::SUCCESS;
        }

        $offsetHours = 4;
        foreach ($sessions as $session) {
            $session->status = 'scheduled';
            $session->scheduled_at = $base->copy()->addHours($offsetHours);
            if (!$session->daily_room_url) {
                $room = 'terence-demo-' . Str::random(6);
                $session->daily_room_url = 'https://terenceegitim.daily.co/' . $room;
                $session->daily_room_name = $room;
            }
            $session->save();
            $this->line(sprintf(
                '#%d %s → %s',
                $session->id,
                $session->title,
                $session->scheduled_at->toIso8601String()
            ));
            $offsetHours += 6;
        }

        $this->info($sessions->count() . ' oturum güncellendi.');

        return self::SUCCESS;
    }
}

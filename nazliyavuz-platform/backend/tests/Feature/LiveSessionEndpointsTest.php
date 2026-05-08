<?php

namespace Tests\Feature;

use App\Models\ClassRoom;
use App\Models\User;
use App\Models\LiveSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Manuel kontrol (özet): TZ ile datetime-local; mobilde iframe izinleri; iki tarayıcıda aynı oda.
 */
class LiveSessionEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_student_live_lessons(): void
    {
        $this->getJson('/api/student/live-lessons')->assertStatus(401);
    }

    public function test_student_can_list_live_lessons(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $token = JWTAuth::fromUser($student);

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/student/live-lessons')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_webhook_updates_recording_url_by_room_name(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $session = LiveSession::query()->create([
            'teacher_id'       => $teacher->id,
            'class_room_id'    => null,
            'is_public'        => true,
            'title'            => 'Test',
            'daily_room_name'  => 'room-test-abc',
            'daily_room_url'   => 'https://example.test/room-test-abc',
            'scheduled_at'     => now()->addDay(),
            'duration_minutes' => 45,
            'status'           => 'ended',
        ]);

        $this->postJson('/api/webhooks/daily-recording', [
            'room_name'     => 'room-test-abc',
            'download_link' => 'https://cdn.example/rec.mp4',
        ])
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertSame('https://cdn.example/rec.mp4', $session->fresh()->recording_url);
    }

    public function test_student_cannot_join_private_session_of_unrelated_class(): void
    {
        $otherTeacher = User::factory()->create(['role' => 'teacher']);
        $student       = User::factory()->create(['role' => 'student']);
        $class         = ClassRoom::query()->create([
            'teacher_id' => $otherTeacher->id,
            'name'       => 'Başka sınıf',
            'is_active'    => true,
        ]);
        $session = LiveSession::query()->create([
            'teacher_id'       => $otherTeacher->id,
            'class_room_id'    => $class->id,
            'is_public'        => false,
            'title'            => 'Kapalı oturum',
            'daily_room_name'  => 'room-join-test',
            'daily_room_url'   => 'https://terenceegitim.daily.co/room-join-test',
            'scheduled_at'     => now()->addHour(),
            'duration_minutes' => 45,
            'status'           => 'scheduled',
        ]);

        $token = JWTAuth::fromUser($student);
        $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/student/live-sessions/{$session->id}/join")
            ->assertForbidden();
    }

    public function test_foreign_teacher_cannot_go_live_on_others_session(): void
    {
        $teacherA = User::factory()->create(['role' => 'teacher']);
        $teacherB = User::factory()->create(['role' => 'teacher']);
        $session  = LiveSession::query()->create([
            'teacher_id'       => $teacherA->id,
            'class_room_id'    => null,
            'is_public'        => true,
            'title'            => 'A oturumu',
            'daily_room_name'  => 'room-go-live-test',
            'daily_room_url'   => 'https://terenceegitim.daily.co/room-go-live-test',
            'scheduled_at'     => now()->addHour(),
            'duration_minutes' => 45,
            'status'           => 'scheduled',
        ]);

        $token = JWTAuth::fromUser($teacherB);
        $this->withHeader('Authorization', "Bearer $token")
            ->patchJson("/api/teacher/live-sessions/{$session->id}/go-live")
            ->assertNotFound();
    }
}

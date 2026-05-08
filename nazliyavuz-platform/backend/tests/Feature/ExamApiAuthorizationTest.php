<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ExamApiAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_exam_history(): void
    {
        $this->getJson('/api/exams/history')->assertStatus(401);
    }

    public function test_parent_cannot_access_student_exam_history(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $token = JWTAuth::fromUser($parent);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/exams/history')
            ->assertStatus(403);
    }

    public function test_student_with_grade_can_access_exam_history_and_summary(): void
    {
        $student = User::factory()->create([
            'role'        => 'student',
            'grade'       => 10,
            'target_exam' => 'TYT',
        ]);
        $token = JWTAuth::fromUser($student);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/exams/history')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/exams/summary')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'total_completed',
                'this_week_count',
                'avg_net',
                'best_net',
                'avg_time_seconds',
            ]);
    }

    public function test_parent_child_exams_returns_404_without_approved_link(): void
    {
        $parent  = User::factory()->create(['role' => 'parent']);
        $student = User::factory()->create(['role' => 'student', 'grade' => 10, 'target_exam' => 'TYT']);
        $token   = JWTAuth::fromUser($parent);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/parent/children/{$student->id}/exams")
            ->assertStatus(404);
    }
}

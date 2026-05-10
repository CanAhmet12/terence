<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class GradeScopedIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_without_grade_is_blocked_from_student_endpoints(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
            'grade' => null,
            'target_exam' => 'TYT',
        ]);

        $token = JWTAuth::fromUser($student);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/curriculum')
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'GRADE_REQUIRED');
    }

    public function test_student_cannot_access_curriculum_subject_outside_scope(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
            'grade' => 6,
            'target_exam' => 'GENEL',
        ]);

        DB::table('curriculum_subjects')->insert([
            'name' => 'TYT Matematik',
            'slug' => 'tyt-matematik-test',
            'icon' => '📚',
            'color' => '#6366f1',
            'grade' => '12',
            'exam_type' => 'TYT',
            'sort_order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = JWTAuth::fromUser($student);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/curriculum/tyt-matematik-test')
            ->assertStatus(403)
            ->assertJsonPath('code', 'FORBIDDEN_SCOPE');
    }

    public function test_student_cannot_start_exam_with_mismatched_exam_type(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
            'grade' => 8,
            'target_exam' => 'LGS',
        ]);

        $token = JWTAuth::fromUser($student);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/exams/start', [
                'exam_type' => 'TYT',
                'question_count' => 5,
            ])
            ->assertStatus(422);
    }
}

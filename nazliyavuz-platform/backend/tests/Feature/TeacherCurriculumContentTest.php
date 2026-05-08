<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class TeacherCurriculumContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_teacher_curriculum_topics(): void
    {
        $this->getJson('/api/v1/teacher/curriculum/topics')
            ->assertStatus(401);
    }

    public function test_teacher_can_search_curriculum_topics(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $subjectId = DB::table('curriculum_subjects')->insertGetId([
            'name' => 'Test Matematik',
            'slug' => 'test-matematik-'.uniqid(),
            'icon' => '📐',
            'color' => '#2563eb',
            'grade' => '8',
            'exam_type' => 'LGS',
            'sort_order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitId = DB::table('curriculum_units')->insertGetId([
            'subject_id' => $subjectId,
            'title' => 'Ünite 1',
            'description' => null,
            'meb_code' => null,
            'sort_order' => 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('curriculum_topics')->insert([
            'unit_id' => $unitId,
            'title' => 'Özel Arama Konusu XYZ',
            'description' => null,
            'meb_code' => 'M.8.1.1',
            'sort_order' => 0,
            'is_active' => true,
            'linked_topic_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = JWTAuth::fromUser($teacher);

        $json = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/teacher/curriculum/topics?q=XYZ')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->json();

        $this->assertNotEmpty($json['topics']);
        $this->assertStringContainsString('XYZ', $json['topics'][0]['title']);
    }
}

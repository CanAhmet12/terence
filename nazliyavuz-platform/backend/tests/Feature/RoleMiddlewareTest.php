<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test unauthenticated user is rejected
     */
    public function test_unauthenticated_user_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/admin/users');

        $response->assertStatus(401)
            ->assertJson([
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => 'Giriş yapmanız gerekiyor'
                ]
            ]);
    }

    /**
     * Test user with wrong role is forbidden
     */
    public function test_user_with_wrong_role_is_forbidden(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $token = JWTAuth::fromUser($student);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/users');

        $response->assertStatus(403)
            ->assertJson([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Bu işlem için yetkiniz bulunmuyor'
                ]
            ]);
    }

    /**
     * Test user with correct role is allowed
     */
    public function test_user_with_correct_role_is_allowed(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/users');

        // Should not be 403 (actual response code depends on endpoint implementation)
        $response->assertNotForbidden();
    }

    /**
     * Test middleware accepts multiple roles (comma-separated)
     */
    public function test_middleware_accepts_multiple_roles(): void
    {
        // Teacher should be allowed
        $teacher = User::factory()->create(['role' => 'teacher']);
        $teacherToken = JWTAuth::fromUser($teacher);

        $response = $this->withHeader('Authorization', "Bearer $teacherToken")
            ->getJson('/api/reservations');

        $response->assertNotForbidden();

        // Admin should also be allowed
        $admin = User::factory()->create(['role' => 'admin']);
        $adminToken = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer $adminToken")
            ->getJson('/api/reservations');

        $response->assertNotForbidden();

        // Student should be rejected
        $student = User::factory()->create(['role' => 'student']);
        $studentToken = JWTAuth::fromUser($student);

        $response = $this->withHeader('Authorization', "Bearer $studentToken")
            ->getJson('/api/reservations');

        $response->assertStatus(403);
    }

    /**
     * Test suspended user is rejected
     */
    public function test_suspended_user_is_rejected(): void
    {
        $suspendedAdmin = User::factory()->create([
            'role' => 'admin',
            'suspended_at' => now(),
            'suspended_until' => now()->addDays(7),
            'suspension_reason' => 'Violated terms of service'
        ]);

        $token = JWTAuth::fromUser($suspendedAdmin);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/users');

        $response->assertStatus(403)
            ->assertJson([
                'error' => [
                    'code' => 'ACCOUNT_SUSPENDED',
                    'message' => 'Hesabınız askıya alınmıştır'
                ]
            ]);
    }

    /**
     * Test suspension expired user is allowed
     */
    public function test_suspension_expired_user_is_allowed(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'suspended_at' => now()->subDays(10),
            'suspended_until' => now()->subDays(3), // Suspension ended 3 days ago
        ]);

        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/users');

        // Should not be suspended anymore
        $response->assertNotForbidden();
    }

    /**
     * Test permanently suspended user (no until date) is rejected
     */
    public function test_permanently_suspended_user_is_rejected(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'suspended_at' => now(),
            'suspended_until' => null, // Permanent suspension
            'suspension_reason' => 'Permanent ban'
        ]);

        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/users');

        $response->assertStatus(403)
            ->assertJson([
                'error' => [
                    'code' => 'ACCOUNT_SUSPENDED'
                ]
            ]);
    }

    /**
     * Test parent role can access parent endpoints
     */
    public function test_parent_role_can_access_parent_endpoints(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $token = JWTAuth::fromUser($parent);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/parent/children');

        // Should not be forbidden (actual response depends on implementation)
        $response->assertNotForbidden();
    }

    /**
     * Test student role can access student endpoints
     */
    public function test_student_role_can_access_student_endpoints(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $token = JWTAuth::fromUser($student);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/student/progress');

        // Should not be forbidden
        $response->assertNotForbidden();
    }

    /**
     * Test teacher role can access teacher endpoints
     */
    public function test_teacher_role_can_access_teacher_endpoints(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'teacher_status' => 'approved'
        ]);
        $token = JWTAuth::fromUser($teacher);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/teacher/reservations');

        // Should not be forbidden
        $response->assertNotForbidden();
    }
}

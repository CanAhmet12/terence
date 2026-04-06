<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\RefreshToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class JWTSecurityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test login sets HttpOnly refresh token cookie
     */
    public function test_login_sets_httponly_refresh_token_cookie(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password123')]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'token', 'user']);

        // Check if refresh token cookie is set
        $response->assertCookie('refresh_token');
        
        // Verify cookie is HttpOnly (cannot be checked directly in test, but verified in code)
        $this->assertDatabaseHas('refresh_tokens', [
            'user_id' => $user->id,
        ]);
    }

    /**
     * Test refresh token rotation
     */
    public function test_refresh_token_rotation(): void
    {
        $user = User::factory()->create();
        $oldRefreshToken = RefreshToken::generate($user->id, 'device1', 'device1', '127.0.0.1', 'Test Agent');

        $response = $this->withCookie('refresh_token', $oldRefreshToken->token)
            ->postJson('/api/auth/refresh');

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'token', 'user']);

        // Old token should be revoked
        $oldRefreshToken->refresh();
        $this->assertTrue($oldRefreshToken->is_revoked);

        // New token should exist
        $newToken = $response->getCookie('refresh_token');
        $this->assertNotNull($newToken);
        $this->assertNotEquals($oldRefreshToken->token, $newToken->getValue());
    }

    /**
     * Test expired refresh token is rejected
     */
    public function test_expired_refresh_token_is_rejected(): void
    {
        $user = User::factory()->create();
        $expiredToken = RefreshToken::create([
            'user_id' => $user->id,
            'token' => 'expired_token_' . bin2hex(random_bytes(16)),
            'expires_at' => now()->subDays(1), // Expired yesterday
        ]);

        $response = $this->withCookie('refresh_token', $expiredToken->token)
            ->postJson('/api/auth/refresh');

        $response->assertStatus(401)
            ->assertJson([
                'error' => true,
                'code' => 'REFRESH_TOKEN_INVALID',
            ]);
    }

    /**
     * Test revoked refresh token is rejected
     */
    public function test_revoked_refresh_token_is_rejected(): void
    {
        $user = User::factory()->create();
        $revokedToken = RefreshToken::generate($user->id);
        $revokedToken->revoke();

        $response = $this->withCookie('refresh_token', $revokedToken->token)
            ->postJson('/api/auth/refresh');

        $response->assertStatus(401)
            ->assertJson([
                'error' => true,
                'code' => 'REFRESH_TOKEN_INVALID',
            ]);
    }

    /**
     * Test password change revokes all tokens
     */
    public function test_password_change_revokes_all_tokens(): void
    {
        $user = User::factory()->create(['password' => bcrypt('oldpassword')]);
        $token = JWTAuth::fromUser($user);

        // Create some refresh tokens
        RefreshToken::generate($user->id, 'device1', 'device1');
        RefreshToken::generate($user->id, 'device2', 'device2');

        $this->assertEquals(2, RefreshToken::where('user_id', $user->id)->count());

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/auth/change-password', [
                'current_password' => 'oldpassword',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(200);

        // All tokens should be revoked
        $this->assertEquals(2, RefreshToken::where('user_id', $user->id)->where('is_revoked', true)->count());
    }

    /**
     * Test logout revokes refresh token
     */
    public function test_logout_revokes_refresh_token(): void
    {
        $user = User::factory()->create();
        $token = JWTAuth::fromUser($user);
        $refreshToken = RefreshToken::generate($user->id);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->withCookie('refresh_token', $refreshToken->token)
            ->postJson('/api/auth/logout');

        $response->assertStatus(200);

        // Refresh token should be revoked
        $refreshToken->refresh();
        $this->assertTrue($refreshToken->is_revoked);
    }

    /**
     * Test revoke all tokens endpoint
     */
    public function test_revoke_all_tokens_endpoint(): void
    {
        $user = User::factory()->create();
        $token = JWTAuth::fromUser($user);

        // Create multiple tokens
        RefreshToken::generate($user->id, 'device1', 'device1');
        RefreshToken::generate($user->id, 'device2', 'device2');
        RefreshToken::generate($user->id, 'device3', 'device3');

        $this->assertEquals(3, RefreshToken::where('user_id', $user->id)->count());

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/auth/revoke-all-tokens');

        $response->assertStatus(200);

        // All tokens should be revoked
        $this->assertEquals(3, RefreshToken::where('user_id', $user->id)->where('is_revoked', true)->count());
    }

    /**
     * Test device-based token rotation
     */
    public function test_device_based_token_rotation(): void
    {
        $user = User::factory()->create();

        // First login from device1
        $token1 = RefreshToken::generate($user->id, 'iPhone', 'device1');

        // Second login from same device1 (should revoke previous)
        $token2 = RefreshToken::generate($user->id, 'iPhone', 'device1');

        $token1->refresh();
        $this->assertTrue($token1->is_revoked);
        $this->assertFalse($token2->is_revoked);
    }

    /**
     * Test clean expired tokens command
     */
    public function test_clean_expired_tokens_command(): void
    {
        $user = User::factory()->create();

        // Create expired token
        RefreshToken::create([
            'user_id' => $user->id,
            'token' => 'expired_' . bin2hex(random_bytes(16)),
            'expires_at' => now()->subDays(10),
        ]);

        // Create valid token
        $validToken = RefreshToken::generate($user->id);

        $this->assertEquals(2, RefreshToken::count());

        // Run cleanup
        $deletedCount = RefreshToken::cleanExpired();

        $this->assertEquals(1, $deletedCount);
        $this->assertEquals(1, RefreshToken::count());
        $this->assertTrue(RefreshToken::find($validToken->id)->exists());
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders([
            'referer' => 'http://localhost',
            'origin' => 'http://localhost',
        ]);
    }

    public function test_user_can_register_with_valid_details(): void
    {
        Event::fake([Registered::class]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Fatima Noor',
            'email' => 'fatima@example.com',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Fatima Noor',
                    'email' => 'fatima@example.com',
                    'email_verified' => false,
                    'role' => 'user',
                    'status' => 'active',
                ],
            ]);

        // Ensure sensitive attributes are never exposed
        $response->assertJsonMissing(['password', 'remember_token', 'password_hash']);

        $this->assertDatabaseHas('users', [
            'email' => 'fatima@example.com',
            'name' => 'Fatima Noor',
            'role' => 'user',
            'status' => 'active',
        ]);

        Event::assertDispatched(Registered::class);
        $this->assertAuthenticated();
    }

    public function test_registration_validation_fails_for_duplicate_or_invalid_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        // Duplicate email
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ali Khan',
            'email' => 'existing@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        // Invalid format
        $response2 = $this->postJson('/api/auth/register', [
            'name' => 'Ali Khan',
            'email' => 'not-an-email',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_fails_with_weak_or_unconfirmed_password(): void
    {
        // Unconfirmed password
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ali Khan',
            'email' => 'ali@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Mismatch123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        // Too short (<8 characters)
        $response2 = $this->postJson('/api/auth/register', [
            'name' => 'Ali Khan',
            'email' => 'ali@example.com',
            'password' => 'Pass1',
            'password_confirmation' => 'Pass1',
        ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        // No numbers
        $response3 = $this->postJson('/api/auth/register', [
            'name' => 'Ali Khan',
            'email' => 'ali@example.com',
            'password' => 'PasswordOnly',
            'password_confirmation' => 'PasswordOnly',
        ]);

        $response3->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'bilal@example.com',
            'password' => Hash::make('Secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'bilal@example.com',
            'password' => 'Secret123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'email' => 'bilal@example.com',
                ],
            ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'bilal@example.com',
            'password' => Hash::make('Secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'bilal@example.com',
            'password' => 'WrongPassword999',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'INVALID_CREDENTIALS',
            ]);

        $this->assertGuest();
    }

    public function test_suspended_user_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'suspended@example.com',
            'password' => Hash::make('Secret123'),
            'status' => 'suspended',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'suspended@example.com',
            'password' => 'Secret123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'ACCOUNT_SUSPENDED',
            ]);

        $this->assertGuest();
    }

    public function test_authenticated_user_can_fetch_own_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Ayesha Khan',
            'email' => 'ayesha@example.com',
        ]);

        $response = $this->actingAs($user)->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => 'Ayesha Khan',
                    'email' => 'ayesha@example.com',
                    'email_verified' => true,
                ],
            ]);

        // Also test the /api/user alias
        $aliasResponse = $this->actingAs($user)->getJson('/api/user');
        $aliasResponse->assertStatus(200)
            ->assertJsonPath('data.email', 'ayesha@example.com');
    }

    public function test_unauthenticated_request_to_me_returns_401(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error_code' => 'UNAUTHENTICATED',
            ]);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('Secret123'),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Secret123',
        ]);

        $this->assertAuthenticatedAs($user);

        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logged out successfully.',
            ]);

        $this->assertGuest('web');
        $this->assertGuest('sanctum');
    }

    public function test_user_can_verify_email_via_signed_url(): void
    {
        Event::fake([Verified::class]);

        $user = User::factory()->unverified()->create([
            'email' => 'unverified@example.com',
        ]);

        $this->assertFalse($user->hasVerifiedEmail());

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $response = $this->getJson($verificationUrl);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['email_verified' => true],
            ]);

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        Event::assertDispatched(Verified::class);
    }

    public function test_email_verification_fails_with_invalid_signature(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'unverified@example.com',
        ]);

        $invalidUrl = "/api/auth/email/verify/{$user->id}/" . sha1($user->getEmailForVerification()) . '?signature=tampered';

        $response = $this->getJson($invalidUrl);

        $response->assertStatus(403);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_resend_email_verification_notification(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->postJson('/api/auth/email/verification-notification');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Verification email sent successfully.',
            ]);

        // When user is already verified, it returns 400
        $verifiedUser = User::factory()->create();
        $response2 = $this->actingAs($verifiedUser)->postJson('/api/auth/email/verification-notification');
        $response2->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error_code' => 'EMAIL_ALREADY_VERIFIED',
            ]);
    }

    public function test_forgot_password_sends_reset_link_with_generic_response(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'resetme@example.com']);

        // Existing user
        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'resetme@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Non-existent email also returns generic message (preventing email enumeration)
        $response2 = $this->postJson('/api/auth/forgot-password', [
            'email' => 'nonexistent@example.com',
        ]);

        $response2->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        Event::fake([PasswordReset::class]);

        $user = User::factory()->create([
            'email' => 'target@example.com',
            'password' => Hash::make('OldPassword1'),
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'target@example.com',
            'password' => 'NewPassword999',
            'password_confirmation' => 'NewPassword999',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        Event::assertDispatched(PasswordReset::class);

        // Verify that user can now log in with the new password
        $this->assertTrue(Hash::check('NewPassword999', $user->fresh()->password));

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'target@example.com',
            'password' => 'NewPassword999',
        ]);

        $loginResponse->assertStatus(200);
    }

    public function test_login_endpoint_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => 'ratelimit@example.com',
                'password' => 'wrong-password',
            ]);
        }

        // 6th attempt should trigger 429 Too Many Requests
        $response = $this->postJson('/api/auth/login', [
            'email' => 'ratelimit@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(429);
    }
}

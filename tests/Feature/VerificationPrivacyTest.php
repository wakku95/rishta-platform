<?php

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\ProfileVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VerificationPrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_discovery_only_exposes_safe_boolean_badges(): void
    {
        $viewer = User::factory()->create(['email_verified_at' => now(), 'status' => 'active']);
        $candidateUser = User::factory()->create(['email_verified_at' => now(), 'status' => 'active']);

        $candidateProfile = Profile::create([
            'user_id' => $candidateUser->id,
            'gender' => 'female',
            'date_of_birth' => now()->subYears(25)->toDateString(),
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Software / IT',
            'marital_status' => 'never_married',
            'height' => 165,
            'about' => 'Private statement.',
            'family_background' => 'Private family statement.',
            'managed_by' => 'parent',
            'profile_status' => 'active',
        ]);

        // Add approved identity verification
        ProfileVerification::create([
            'user_id' => $candidateUser->id,
            'type' => 'identity',
            'status' => 'approved',
            'document_front_path' => 'verifications/sensitive/secret_front.jpg',
            'document_back_path' => 'verifications/sensitive/secret_back.jpg',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($viewer, ['*']);

        $response = $this->getJson("/api/discovery/profiles/{$candidateProfile->profile_code}");
        $response->assertStatus(200);

        // Assert boolean trust badge is present
        $response->assertJson([
            'data' => [
                'verifications' => [
                    'email_verified' => true,
                    'identity_verified' => true,
                    'education_verified' => false,
                ],
            ],
        ]);

        // CRITICAL PRIVACY ASSERTIONS: Verify sensitive fields are strictly absent
        $jsonString = $response->getContent();
        $this->assertStringNotContainsString('secret_front.jpg', $jsonString);
        $this->assertStringNotContainsString('secret_back.jpg', $jsonString);
        $this->assertStringNotContainsString('document_front_path', $jsonString);
        $this->assertStringNotContainsString('document_back_path', $jsonString);
        $this->assertStringNotContainsString('verifications/sensitive', $jsonString);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders([
            'referer' => 'http://localhost:8000',
            'origin' => 'http://localhost:8000',
            'Accept' => 'application/json',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_profile_endpoints(): void
    {
        $this->getJson('/api/profile')->assertStatus(401);
        $this->postJson('/api/profile', [])->assertStatus(401);
        $this->getJson('/api/profile/preferences')->assertStatus(401);
        $this->putJson('/api/profile/preferences', [])->assertStatus(401);
        $this->postJson('/api/profile/activate')->assertStatus(401);
        $this->postJson('/api/profile/hide')->assertStatus(401);
    }

    public function test_authenticated_user_without_profile_gets_null_data(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/profile');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => null,
            ]);
    }

    public function test_authenticated_user_can_create_profile(): void
    {
        $user = User::factory()->create();

        $profileData = [
            'gender' => 'male',
            'date_of_birth' => '1995-05-14',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Master's in Computer Science",
            'profession' => 'Software Engineer',
            'marital_status' => 'never_married',
            'height' => 175,
            'about' => 'Practicing Muslim from a respectable family in Lahore, working in tech.',
            'managed_by' => 'myself',
        ];

        $response = $this->actingAs($user)->postJson('/api/profile', $profileData);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Profile created successfully as draft.',
                'data' => [
                    'gender' => 'male',
                    'religion' => 'Islam',
                    'sect' => 'Sunni',
                    'city' => 'Lahore',
                    'marital_status' => 'never_married',
                    'height' => 175,
                    'height_formatted' => '5\'9" (175 cm)',
                    'managed_by' => 'myself',
                    'profile_status' => 'draft',
                ],
            ]);

        $this->assertDatabaseHas('profiles', [
            'user_id' => $user->id,
            'city' => 'Lahore',
            'profile_status' => 'draft',
        ]);

        // Verify non-sequential random profile_code generated e.g. RK-XXXXXX
        $profile = $user->fresh()->profile;
        $this->assertNotNull($profile->profile_code);
        $this->assertMatchesRegularExpression('/^RK-[A-Z0-9]{6}$/', $profile->profile_code);
    }

    public function test_authenticated_user_can_update_existing_profile(): void
    {
        $user = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-SAMPLE',
            'gender' => 'female',
            'date_of_birth' => '1998-02-20',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Islamabad',
            'education' => "Bachelor's",
            'profession' => 'Dentist',
            'marital_status' => 'never_married',
            'height' => 163,
            'about' => 'Initial about bio text.',
            'managed_by' => 'parent',
            'profile_status' => 'draft',
        ]);

        $response = $this->actingAs($user)->postJson('/api/profile', [
            'gender' => 'female',
            'date_of_birth' => '1998-02-20',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Rawalpindi', // Changed
            'education' => "Master's", // Changed
            'profession' => 'Orthodontist', // Changed
            'marital_status' => 'never_married',
            'height' => 163,
            'about' => 'Updated about text with more details.',
            'managed_by' => 'parent',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'city' => 'Rawalpindi',
                    'profession' => 'Orthodontist',
                ],
            ]);

        $this->assertDatabaseHas('profiles', [
            'id' => $profile->id,
            'city' => 'Rawalpindi',
            'profession' => 'Orthodontist',
        ]);
    }

    public function test_profile_validation_rejects_underage_candidate(): void
    {
        $user = User::factory()->create();

        // 16 years old
        $underageDob = now()->subYears(16)->format('Y-m-d');

        $response = $this->actingAs($user)->postJson('/api/profile', [
            'gender' => 'male',
            'date_of_birth' => $underageDob,
            'religion' => 'Islam',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Student',
            'marital_status' => 'never_married',
            'height' => 170,
            'managed_by' => 'myself',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date_of_birth']);
    }

    public function test_profile_validation_rejects_future_or_unrealistic_dob(): void
    {
        $user = User::factory()->create();

        // Future date
        $futureDob = now()->addYear()->format('Y-m-d');
        $response = $this->actingAs($user)->postJson('/api/profile', [
            'gender' => 'male',
            'date_of_birth' => $futureDob,
            'religion' => 'Islam',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Engineer',
            'marital_status' => 'never_married',
            'height' => 170,
            'managed_by' => 'myself',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['date_of_birth']);

        // Over 80 years old
        $oldDob = now()->subYears(95)->format('Y-m-d');
        $response2 = $this->actingAs($user)->postJson('/api/profile', [
            'gender' => 'male',
            'date_of_birth' => $oldDob,
            'religion' => 'Islam',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Engineer',
            'marital_status' => 'never_married',
            'height' => 170,
            'managed_by' => 'myself',
        ]);
        $response2->assertStatus(422)->assertJsonValidationErrors(['date_of_birth']);
    }

    public function test_authenticated_user_can_create_and_update_partner_preferences(): void
    {
        $user = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-ABC123',
            'gender' => 'male',
            'date_of_birth' => '1992-06-15',
            'religion' => 'Islam',
            'city' => 'Karachi',
            'education' => "Bachelor's",
            'profession' => 'Accountant',
            'marital_status' => 'never_married',
            'height' => 178,
            'managed_by' => 'myself',
            'profile_status' => 'draft',
        ]);

        $prefData = [
            'preferred_gender' => 'female',
            'min_age' => 22,
            'max_age' => 29,
            'preferred_cities' => ['Karachi', 'Islamabad'],
            'preferred_religion' => 'Islam',
            'preferred_sect' => 'Sunni',
            'min_height' => 155,
            'max_height' => 170,
            'preferred_education' => "Bachelor's or Master's",
            'preferred_marital_status' => ['never_married'],
        ];

        $response = $this->actingAs($user)->putJson('/api/profile/preferences', $prefData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'preferred_gender' => 'female',
                    'min_age' => 22,
                    'max_age' => 29,
                    'preferred_cities' => ['Karachi', 'Islamabad'],
                    'preferred_marital_status' => ['never_married'],
                ],
            ]);

        $this->assertDatabaseHas('profile_preferences', [
            'profile_id' => $profile->id,
            'preferred_gender' => 'female',
            'min_age' => 22,
            'max_age' => 29,
        ]);

        // Get preferences endpoint
        $getResponse = $this->actingAs($user)->getJson('/api/profile/preferences');
        $getResponse->assertStatus(200)
            ->assertJsonPath('data.min_age', 22);
    }

    public function test_preferences_validation_rejects_max_age_smaller_than_min_age(): void
    {
        $user = User::factory()->create();
        Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-TEST01',
            'gender' => 'female',
            'date_of_birth' => '1996-01-01',
            'religion' => 'Islam',
            'city' => 'Multan',
            'education' => 'Doctorate',
            'profession' => 'Professor',
            'marital_status' => 'never_married',
            'height' => 165,
            'managed_by' => 'myself',
        ]);

        $response = $this->actingAs($user)->putJson('/api/profile/preferences', [
            'preferred_gender' => 'male',
            'min_age' => 35,
            'max_age' => 25, // Invalid: max < min
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['max_age']);
    }

    public function test_unverified_user_cannot_activate_profile(): void
    {
        $user = User::factory()->unverified()->create();
        Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-UNVER1',
            'gender' => 'male',
            'date_of_birth' => '1994-08-10',
            'religion' => 'Islam',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Architect',
            'marital_status' => 'never_married',
            'height' => 172,
            'managed_by' => 'myself',
            'profile_status' => 'draft',
        ]);

        $response = $this->actingAs($user)->postJson('/api/profile/activate');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'EMAIL_NOT_VERIFIED',
            ]);

        $this->assertEquals('draft', $user->fresh()->profile->profile_status);
    }

    public function test_verified_user_can_activate_and_hide_profile(): void
    {
        $user = User::factory()->create(); // verified by default in UserFactory
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-ACTIVATE',
            'gender' => 'female',
            'date_of_birth' => '1997-03-12',
            'religion' => 'Islam',
            'city' => 'Peshawar',
            'education' => "Master's",
            'profession' => 'Lecturer',
            'marital_status' => 'never_married',
            'height' => 160,
            'managed_by' => 'sibling',
            'profile_status' => 'draft',
        ]);

        // Activate
        $activateResponse = $this->actingAs($user)->postJson('/api/profile/activate');
        $activateResponse->assertStatus(200)
            ->assertJsonPath('data.profile_status', 'active');
        $this->assertEquals('active', $profile->fresh()->profile_status);

        // Hide
        $hideResponse = $this->actingAs($user)->postJson('/api/profile/hide');
        $hideResponse->assertStatus(200)
            ->assertJsonPath('data.profile_status', 'hidden');
        $this->assertEquals('hidden', $profile->fresh()->profile_status);
    }

    public function test_profile_completion_percentage_calculation_is_deterministic(): void
    {
        $user = User::factory()->create();

        // Minimal profile with basic fields filled
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-CALC',
            'gender' => 'male',
            'date_of_birth' => '1990-01-01',
            'religion' => 'Islam',
            'city' => 'Faisalabad',
            'education' => "Bachelor's",
            'profession' => 'Manager',
            'marital_status' => 'never_married',
            'height' => 170,
            'about' => 'This is a valid about bio that is longer than ten characters.',
            'managed_by' => 'myself',
            'profile_status' => 'draft',
        ]);

        // 10 items in core biodata completed = 70%
        $this->assertEquals(70, $profile->calculateCompletionPercentage());

        // Add preferences
        $profile->preferences()->create([
            'preferred_gender' => 'female',
            'min_age' => 20,
            'max_age' => 28,
            'preferred_cities' => ['Faisalabad'],
            'preferred_education' => "Bachelor's",
            'preferred_marital_status' => ['never_married'],
            'min_height' => 150,
            'max_height' => 170,
        ]);

        // Core (70%) + All 6 Preferences items (30%) = 100%
        $this->assertEquals(100, $profile->calculateCompletionPercentage());
    }

    public function test_profile_endpoint_strictly_excludes_private_authentication_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'private_candidate@example.com',
            'password' => bcrypt('SuperSecretPassword123!'),
            'role' => 'user',
            'status' => 'active',
        ]);

        Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-PRIVACY',
            'gender' => 'male',
            'date_of_birth' => '1995-10-10',
            'religion' => 'Islam',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Engineer',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'myself',
        ]);

        $response = $this->actingAs($user)->getJson('/api/profile');

        $response->assertStatus(200);

        $jsonString = $response->getContent();

        // Assert sensitive keywords and data are completely absent from the payload
        $this->assertStringNotContainsString('private_candidate@example.com', $jsonString);
        $this->assertStringNotContainsString('password', $jsonString);
        $this->assertStringNotContainsString('remember_token', $jsonString);
        $this->assertStringNotContainsString('phone_number', $jsonString);
    }
}


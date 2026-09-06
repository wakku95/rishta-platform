<?php

namespace Tests\Feature;

use App\Constants\ProfileOptions;
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

    public function test_unauthenticated_user_cannot_access_protected_profile_endpoints(): void
    {
        $this->getJson('/api/profile')->assertStatus(401);
        $this->postJson('/api/profile', [])->assertStatus(401);
        $this->getJson('/api/profile/preview')->assertStatus(401);
        $this->getJson('/api/profile/preferences')->assertStatus(401);
        $this->putJson('/api/profile/preferences', [])->assertStatus(401);
        $this->postJson('/api/profile/activate')->assertStatus(401);
        $this->postJson('/api/profile/hide')->assertStatus(401);
    }

    public function test_canonical_options_endpoint_is_accessible(): void
    {
        $response = $this->getJson('/api/profile/options');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'genders' => [
                        ['value' => 'male', 'label' => 'Male'],
                        ['value' => 'female', 'label' => 'Female'],
                    ],
                    'religions' => [
                        ['value' => 'Islam', 'label' => 'Islam'],
                    ],
                ],
            ]);

        $this->assertArrayHasKey('sects', $response->json('data'));
        $this->assertArrayHasKey('cities', $response->json('data'));
        $this->assertArrayHasKey('educations', $response->json('data'));
        $this->assertArrayHasKey('professions', $response->json('data'));
        $this->assertArrayHasKey('marital_statuses', $response->json('data'));
        $this->assertArrayHasKey('managed_by', $response->json('data'));
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

    public function test_authenticated_user_can_create_profile_with_controlled_options(): void
    {
        $user = User::factory()->create();

        $profileData = [
            'gender' => 'male',
            'date_of_birth' => '1995-05-14',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Software / IT',
            'marital_status' => 'never_married',
            'height' => 175,
            'about' => 'Practicing Muslim working in technology.',
            'family_background' => 'Respectable family based in Lahore.',
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
                    'education' => "Bachelor's",
                    'profession' => 'Software / IT',
                    'marital_status' => 'never_married',
                    'height' => 175,
                    'height_formatted' => '5\'9" (175 cm)',
                    'about' => 'Practicing Muslim working in technology.',
                    'family_background' => 'Respectable family based in Lahore.',
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

    public function test_profile_validation_rejects_non_canonical_options(): void
    {
        $user = User::factory()->create();

        $invalidData = [
            'gender' => 'invalid_gender',
            'date_of_birth' => '1995-05-14',
            'religion' => 'CustomReligion',
            'sect' => 'UnrecognizedSect',
            'city' => 'UnknownCity123',
            'education' => 'FakeDegree',
            'profession' => 'Astronaut',
            'marital_status' => 'invalid_status',
            'height' => 175,
            'managed_by' => 'unknown_entity',
        ];

        $response = $this->actingAs($user)->postJson('/api/profile', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'gender',
                'religion',
                'sect',
                'city',
                'education',
                'profession',
                'marital_status',
                'managed_by',
            ]);
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
            'profession' => 'Medical / Healthcare',
            'marital_status' => 'never_married',
            'height' => 163,
            'about' => 'Initial about bio text.',
            'family_background' => 'Initial family info.',
            'managed_by' => 'parent',
            'profile_status' => 'draft',
        ]);

        $response = $this->actingAs($user)->postJson('/api/profile', [
            'gender' => 'female',
            'date_of_birth' => '1998-02-20',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Rawalpindi',
            'education' => "Master's",
            'profession' => 'Education',
            'marital_status' => 'never_married',
            'height' => 163,
            'about' => 'Updated about statement.',
            'family_background' => 'Updated family background statement.',
            'managed_by' => 'parent',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'city' => 'Rawalpindi',
                    'education' => "Master's",
                    'profession' => 'Education',
                    'about' => 'Updated about statement.',
                    'family_background' => 'Updated family background statement.',
                ],
            ]);

        $this->assertDatabaseHas('profiles', [
            'id' => $profile->id,
            'city' => 'Rawalpindi',
            'profession' => 'Education',
            'family_background' => 'Updated family background statement.',
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
            'sect' => 'Sunni',
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

    public function test_authenticated_user_can_create_and_update_partner_preferences(): void
    {
        $user = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-ABC123',
            'gender' => 'male',
            'date_of_birth' => '1992-06-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Karachi',
            'education' => "Bachelor's",
            'profession' => 'Finance / Banking',
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
            'preferred_education' => "Bachelor's",
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
                    'preferred_religion' => 'Islam',
                    'preferred_sect' => 'Sunni',
                    'preferred_education' => "Bachelor's",
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

    public function test_preferences_validation_rejects_invalid_options(): void
    {
        $user = User::factory()->create();
        Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-TEST01',
            'gender' => 'female',
            'date_of_birth' => '1996-01-01',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Multan',
            'education' => 'PhD',
            'profession' => 'Education',
            'marital_status' => 'never_married',
            'height' => 165,
            'managed_by' => 'myself',
        ]);

        // max_age < min_age AND invalid city AND invalid religion
        $response = $this->actingAs($user)->putJson('/api/profile/preferences', [
            'preferred_gender' => 'male',
            'min_age' => 35,
            'max_age' => 25,
            'preferred_cities' => ['NonExistentCity'],
            'preferred_religion' => 'InvalidReligion',
            'preferred_education' => 'FakeDegree',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['max_age', 'preferred_cities.0', 'preferred_religion', 'preferred_education']);
    }

    public function test_unverified_user_cannot_activate_profile(): void
    {
        $user = User::factory()->unverified()->create();
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-UNVER1',
            'gender' => 'male',
            'date_of_birth' => '1994-08-10',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Engineering',
            'marital_status' => 'never_married',
            'height' => 172,
            'managed_by' => 'myself',
            'profile_status' => 'draft',
        ]);

        $profile->preferences()->create([
            'preferred_gender' => 'female',
            'min_age' => 20,
            'max_age' => 28,
        ]);

        $response = $this->actingAs($user)->postJson('/api/profile/activate');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'EMAIL_NOT_VERIFIED',
            ]);

        $this->assertEquals('draft', $user->fresh()->profile->profile_status);
    }

    public function test_profile_activation_requires_preferences_but_about_and_family_are_optional(): void
    {
        $user = User::factory()->create(); // verified email
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-ACTIVATE',
            'gender' => 'female',
            'date_of_birth' => '1997-03-12',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Peshawar',
            'education' => "Master's",
            'profession' => 'Education',
            'marital_status' => 'never_married',
            'height' => 160,
            'managed_by' => 'sibling',
            'about' => null, // OPTIONAL
            'family_background' => null, // OPTIONAL
            'profile_status' => 'draft',
        ]);

        // Without preferences, activation must fail with 422
        $failResponse = $this->actingAs($user)->postJson('/api/profile/activate');
        $failResponse->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'INCOMPLETE_PREFERENCES',
            ]);

        // Add mandatory partner preferences
        $profile->preferences()->create([
            'preferred_gender' => 'male',
            'min_age' => 25,
            'max_age' => 32,
        ]);

        // Now activation must succeed even without about/family_background
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

    public function test_public_profile_preview_strictly_omits_private_fields(): void
    {
        $user = User::factory()->create([
            'email' => 'private_owner@example.com',
        ]);

        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-SAFE01',
            'gender' => 'male',
            'date_of_birth' => '1995-10-10',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Software / IT',
            'marital_status' => 'never_married',
            'height' => 175,
            'about' => 'This is sensitive private information that must not be in public preview.',
            'family_background' => 'Father retired officer, mother homemaker, two siblings in UK.',
            'managed_by' => 'myself',
            'profile_status' => 'draft',
        ]);

        $response = $this->actingAs($user)->getJson('/api/profile/preview');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'profile_code' => 'RK-SAFE01',
                    'age' => $profile->age,
                    'gender' => 'male',
                    'city' => 'Lahore',
                    'religion' => 'Islam',
                    'sect' => 'Sunni',
                    'education' => "Bachelor's",
                    'profession' => 'Software / IT',
                    'marital_status' => 'never_married',
                    'height' => 175,
                    'height_formatted' => '5\'9" (175 cm)',
                    'managed_by' => 'myself',
                    'profile_status' => 'draft',
                ],
            ]);

        $previewContent = $response->getContent();

        // STRICT PRIVACY VERIFICATIONS:
        // 1. Full date of birth is excluded (only calculated age is present)
        $this->assertStringNotContainsString('1995-10-10', $previewContent);
        $this->assertArrayNotHasKey('date_of_birth', $response->json('data'));

        // 2. Private about and family_background text are excluded
        $this->assertArrayNotHasKey('about', $response->json('data'));
        $this->assertArrayNotHasKey('family_background', $response->json('data'));
        $this->assertStringNotContainsString('sensitive private information', $previewContent);
        $this->assertStringNotContainsString('Father retired officer', $previewContent);

        // 3. User identifiers, email, and credentials are excluded
        $this->assertArrayNotHasKey('email', $response->json('data'));
        $this->assertArrayNotHasKey('user_id', $response->json('data'));
        $this->assertArrayNotHasKey('id', $response->json('data'));
        $this->assertStringNotContainsString('private_owner@example.com', $previewContent);
    }

    public function test_profile_completion_percentage_deterministic_formula(): void
    {
        $user = User::factory()->create();

        // 1. Basic profile with 10 fields filled, no about, no family, no prefs
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-COMPL',
            'gender' => 'male',
            'date_of_birth' => '1990-01-01',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Faisalabad',
            'education' => "Bachelor's",
            'profession' => 'Business',
            'marital_status' => 'never_married',
            'height' => 170,
            'managed_by' => 'myself',
            'about' => null,
            'family_background' => null,
            'profile_status' => 'draft',
        ]);

        // 10 items @ 6% each = 60%
        $this->assertEquals(60, $profile->calculateCompletionPercentage());

        // 2. Add private intro: about (+5%) and family_background (+5%) = +10% => 70%
        $profile->about = 'Valid about text with more than 10 characters.';
        $profile->family_background = 'Valid family background with more than 10 characters.';
        $profile->save();

        $this->assertEquals(70, $profile->calculateCompletionPercentage());

        // 3. Add all partner preferences = +30% => 100%
        $profile->preferences()->create([
            'preferred_gender' => 'female', // 4%
            'min_age' => 20,
            'max_age' => 28, // 4%
            'preferred_cities' => ['Faisalabad'], // 4%
            'preferred_religion' => 'Islam', // 3%
            'preferred_sect' => 'Sunni', // 3%
            'min_height' => 150,
            'max_height' => 170, // 4%
            'preferred_education' => "Bachelor's", // 4%
            'preferred_marital_status' => ['never_married'], // 4%
        ]);

        $this->assertEquals(100, $profile->calculateCompletionPercentage());
    }

    public function test_canonical_options_returns_all_nine_religions(): void
    {
        $response = $this->getJson('/api/profile/options');

        $response->assertStatus(200);
        $religions = collect($response->json('data.religions'))->pluck('value')->all();

        $expected = [
            'Islam',
            'Christianity',
            'Hinduism',
            'Sikhism',
            'Buddhism',
            'Jainism',
            'Other',
            'No religion',
            'Prefer not to say',
        ];

        $this->assertEquals($expected, $religions);
    }

    public function test_authenticated_user_can_create_non_islam_profile_without_sect(): void
    {
        $user = User::factory()->create();

        $profileData = [
            'gender' => 'female',
            'date_of_birth' => '1996-08-20',
            'religion' => 'Christianity',
            'city' => 'Islamabad',
            'education' => "Bachelor's",
            'profession' => 'Finance / Banking',
            'marital_status' => 'never_married',
            'height' => 165,
            'about' => null,
            'family_background' => null,
            'managed_by' => 'myself',
        ];

        $response = $this->actingAs($user)->postJson('/api/profile', $profileData);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'religion' => 'Christianity',
                    'sect' => null,
                ],
            ]);

        $this->assertDatabaseHas('profiles', [
            'user_id' => $user->id,
            'religion' => 'Christianity',
            'sect' => null,
        ]);

        $profile = $user->fresh()->profile;
        $this->assertEquals(60, $profile->calculateCompletionPercentage());
    }

    public function test_non_islam_profile_can_be_activated_without_sect(): void
    {
        $user = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-HINDU1',
            'gender' => 'male',
            'date_of_birth' => '1993-04-10',
            'religion' => 'Hinduism',
            'sect' => null,
            'city' => 'Karachi',
            'education' => "Master's",
            'profession' => 'Business',
            'marital_status' => 'never_married',
            'height' => 172,
            'managed_by' => 'myself',
            'profile_status' => 'draft',
        ]);

        $profile->preferences()->create([
            'preferred_gender' => 'female',
            'min_age' => 22,
            'max_age' => 29,
        ]);

        $response = $this->actingAs($user)->postJson('/api/profile/activate');
        $response->assertStatus(200)
            ->assertJsonPath('data.profile_status', 'active');

        $this->assertEquals('active', $profile->fresh()->profile_status);
    }

    public function test_updating_profile_from_islam_to_non_islam_clears_sect(): void
    {
        $user = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-UPDATE1',
            'gender' => 'male',
            'date_of_birth' => '1994-01-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Engineering',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'myself',
            'profile_status' => 'draft',
        ]);

        $response = $this->actingAs($user)->postJson('/api/profile', [
            'gender' => 'male',
            'date_of_birth' => '1994-01-15',
            'religion' => 'Sikhism',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Engineering',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'myself',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'religion' => 'Sikhism',
                    'sect' => null,
                ],
            ]);

        $this->assertDatabaseHas('profiles', [
            'id' => $profile->id,
            'religion' => 'Sikhism',
            'sect' => null,
        ]);
    }

    public function test_islam_profile_requires_sect_for_creation_and_activation(): void
    {
        $user = User::factory()->create();

        // Creation without sect when religion is Islam must fail with 422
        $response = $this->actingAs($user)->postJson('/api/profile', [
            'gender' => 'male',
            'date_of_birth' => '1995-05-14',
            'religion' => 'Islam',
            'sect' => null,
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Software / IT',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'myself',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sect']);

        // Directly created Muslim profile without sect must fail activation
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-NOSECT',
            'gender' => 'male',
            'date_of_birth' => '1995-05-14',
            'religion' => 'Islam',
            'sect' => null,
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Software / IT',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'myself',
            'profile_status' => 'draft',
        ]);

        $profile->preferences()->create([
            'preferred_gender' => 'female',
            'min_age' => 20,
            'max_age' => 28,
        ]);

        $activateResponse = $this->actingAs($user)->postJson('/api/profile/activate');
        $activateResponse->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'INCOMPLETE_PROFILE',
            ]);
    }

    public function test_partner_preferences_accepts_all_canonical_religions_and_handles_completion(): void
    {
        $user = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-PREFREL',
            'gender' => 'female',
            'date_of_birth' => '1996-03-25',
            'religion' => 'Christianity',
            'sect' => null,
            'city' => 'Islamabad',
            'education' => "Master's",
            'profession' => 'Education',
            'marital_status' => 'never_married',
            'height' => 162,
            'about' => null,
            'family_background' => null,
            'managed_by' => 'myself',
            'profile_status' => 'draft',
        ]);

        $response = $this->actingAs($user)->putJson('/api/profile/preferences', [
            'preferred_gender' => 'male',
            'min_age' => 26,
            'max_age' => 34,
            'preferred_cities' => ['Islamabad', 'Rawalpindi'],
            'preferred_religion' => 'Christianity',
            'preferred_sect' => null,
            'min_height' => 165,
            'max_height' => 185,
            'preferred_education' => "Bachelor's",
            'preferred_marital_status' => ['never_married'],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'preferred_religion' => 'Christianity',
                    'preferred_sect' => null,
                ],
            ]);

        $this->assertDatabaseHas('profile_preferences', [
            'profile_id' => $profile->id,
            'preferred_religion' => 'Christianity',
            'preferred_sect' => null,
        ]);

        // 60% basic + 30% preferences (all preferences completed including non-Islam religion) = 90%
        $this->assertEquals(90, $profile->calculateCompletionPercentage());
    }

    public function test_profile_preview_for_non_islam_profile_omits_sect(): void
    {
        $user = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-BUDDHA',
            'gender' => 'male',
            'date_of_birth' => '1991-11-11',
            'religion' => 'Buddhism',
            'sect' => null,
            'city' => 'Taxila',
            'education' => 'Doctorate / PhD',
            'profession' => 'Education',
            'marital_status' => 'never_married',
            'height' => 170,
            'managed_by' => 'myself',
            'profile_status' => 'draft',
        ]);

        $response = $this->actingAs($user)->getJson('/api/profile/preview');
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'profile_code' => 'RK-BUDDHA',
                    'religion' => 'Buddhism',
                    'sect' => null,
                ],
            ]);
    }
}



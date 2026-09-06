<?php

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DiscoveryTest extends TestCase
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

    /**
     * Helper to create a user and active matrimonial profile.
     */
    protected function createCandidate(array $profileAttributes = [], array $userAttributes = []): Profile
    {
        $user = User::factory()->create(array_merge([
            'status' => 'active',
            'email_verified_at' => now(),
        ], $userAttributes));

        return Profile::create(array_merge([
            'user_id' => $user->id,
            'gender' => 'female',
            'date_of_birth' => now()->subYears(25)->toDateString(),
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Software / IT',
            'marital_status' => 'never_married',
            'height' => 165,
            'about' => 'Private personal statement that should never leak.',
            'family_background' => 'Private family background statement.',
            'managed_by' => 'parent',
            'profile_status' => 'active',
        ], $profileAttributes));
    }

    // ==========================================
    // 1. Authentication & Authorization Tests
    // ==========================================

    public function test_guest_cannot_search_profiles(): void
    {
        $response = $this->getJson('/api/discovery/profiles');
        $response->assertStatus(401);
    }

    public function test_unverified_user_cannot_search_profiles(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'EMAIL_NOT_VERIFIED',
            ]);
    }

    public function test_suspended_user_cannot_search_profiles(): void
    {
        $user = User::factory()->create(['status' => 'suspended']);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'ACCOUNT_SUSPENDED',
            ]);
    }

    public function test_verified_user_can_search_profiles(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    // ==========================================
    // 2. Active Status & Exclusions
    // ==========================================

    public function test_only_active_profiles_appear_in_search(): void
    {
        $user = User::factory()->create();

        $activeCandidate = $this->createCandidate(['profile_status' => 'active']);
        $draftCandidate = $this->createCandidate(['profile_status' => 'draft']);
        $hiddenCandidate = $this->createCandidate(['profile_status' => 'hidden']);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles');

        $response->assertStatus(200);
        $codes = collect($response->json('data'))->pluck('profile_code')->all();

        $this->assertContains($activeCandidate->profile_code, $codes);
        $this->assertNotContains($draftCandidate->profile_code, $codes);
        $this->assertNotContains($hiddenCandidate->profile_code, $codes);
    }

    public function test_suspended_and_unverified_users_profiles_do_not_appear(): void
    {
        $searcher = User::factory()->create();

        $validCandidate = $this->createCandidate();
        $suspendedUserCandidate = $this->createCandidate([], ['status' => 'suspended']);
        $unverifiedUserCandidate = $this->createCandidate([], ['email_verified_at' => null]);

        $response = $this->actingAs($searcher)->getJson('/api/discovery/profiles');

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertContains($validCandidate->profile_code, $codes);
        $this->assertNotContains($suspendedUserCandidate->profile_code, $codes);
        $this->assertNotContains($unverifiedUserCandidate->profile_code, $codes);
    }

    public function test_current_users_own_profile_never_appears_in_search_results(): void
    {
        $user = User::factory()->create();
        $myProfile = Profile::create([
            'user_id' => $user->id,
            'gender' => 'male',
            'date_of_birth' => '1995-01-01',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Software / IT',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'myself',
            'profile_status' => 'active',
        ]);

        $otherCandidate = $this->createCandidate();

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles');

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertNotContains($myProfile->profile_code, $codes);
        $this->assertContains($otherCandidate->profile_code, $codes);
    }

    // ==========================================
    // 3. Search Filters
    // ==========================================

    public function test_gender_filter_works(): void
    {
        $user = User::factory()->create();

        $female = $this->createCandidate(['gender' => 'female']);
        $male = $this->createCandidate(['gender' => 'male']);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?gender=female');

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertContains($female->profile_code, $codes);
        $this->assertNotContains($male->profile_code, $codes);
    }

    public function test_age_range_filter_works_with_calculated_dob(): void
    {
        $user = User::factory()->create();

        // Ages: 22, 27, 35
        $c22 = $this->createCandidate(['date_of_birth' => now()->subYears(22)->toDateString()]);
        $c27 = $this->createCandidate(['date_of_birth' => now()->subYears(27)->toDateString()]);
        $c35 = $this->createCandidate(['date_of_birth' => now()->subYears(35)->toDateString()]);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?min_age=25&max_age=30');

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertNotContains($c22->profile_code, $codes);
        $this->assertContains($c27->profile_code, $codes);
        $this->assertNotContains($c35->profile_code, $codes);
    }

    public function test_city_filter_works(): void
    {
        $user = User::factory()->create();

        $lahore = $this->createCandidate(['city' => 'Lahore']);
        $karachi = $this->createCandidate(['city' => 'Karachi']);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?city=Karachi');

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertNotContains($lahore->profile_code, $codes);
        $this->assertContains($karachi->profile_code, $codes);
    }

    public function test_religion_filter_works(): void
    {
        $user = User::factory()->create();

        $muslim = $this->createCandidate(['religion' => 'Islam', 'sect' => 'Sunni']);
        $christian = $this->createCandidate(['religion' => 'Christianity', 'sect' => null]);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?religion=Christianity');

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertNotContains($muslim->profile_code, $codes);
        $this->assertContains($christian->profile_code, $codes);
    }

    public function test_sect_filter_works_and_excludes_non_islam(): void
    {
        $user = User::factory()->create();

        $sunni = $this->createCandidate(['religion' => 'Islam', 'sect' => 'Sunni']);
        $shia = $this->createCandidate(['religion' => 'Islam', 'sect' => 'Shia']);
        $christian = $this->createCandidate(['religion' => 'Christianity', 'sect' => null]);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?sect=Sunni');

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertContains($sunni->profile_code, $codes);
        $this->assertNotContains($shia->profile_code, $codes);
        $this->assertNotContains($christian->profile_code, $codes);
    }

    public function test_education_and_profession_filters_work(): void
    {
        $user = User::factory()->create();

        $doctor = $this->createCandidate([
            'education' => 'PhD',
            'profession' => 'Medical / Healthcare',
        ]);
        $engineer = $this->createCandidate([
            'education' => "Bachelor's",
            'profession' => 'Engineering',
        ]);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?profession=Medical / Healthcare&education=PhD');

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertContains($doctor->profile_code, $codes);
        $this->assertNotContains($engineer->profile_code, $codes);
    }

    public function test_minimum_education_filter_includes_higher_qualifications(): void
    {
        $user = User::factory()->create();

        $matric = $this->createCandidate(['education' => 'Matric / O-Level']);
        $bachelor = $this->createCandidate(['education' => "Bachelor's"]);
        $master = $this->createCandidate(['education' => "Master's"]);
        $mphil = $this->createCandidate(['education' => 'MPhil']);
        $phd = $this->createCandidate(['education' => 'PhD']);

        // Filter by minimum Bachelor's: should include Bachelor's, Master's, MPhil, PhD; exclude Matric
        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?education=' . urlencode("Bachelor's"));

        $response->assertStatus(200);
        $codes = collect($response->json('data'))->pluck('profile_code')->all();

        $this->assertNotContains($matric->profile_code, $codes);
        $this->assertContains($bachelor->profile_code, $codes);
        $this->assertContains($master->profile_code, $codes);
        $this->assertContains($mphil->profile_code, $codes);
        $this->assertContains($phd->profile_code, $codes);
    }

    public function test_marital_status_and_height_filters_work(): void
    {
        $user = User::factory()->create();

        $candidate1 = $this->createCandidate([
            'marital_status' => 'never_married',
            'height' => 165,
        ]);
        $candidate2 = $this->createCandidate([
            'marital_status' => 'divorced',
            'height' => 175,
        ]);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?marital_status=never_married&min_height=160&max_height=170');

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertContains($candidate1->profile_code, $codes);
        $this->assertNotContains($candidate2->profile_code, $codes);
    }

    public function test_multiple_filters_work_together(): void
    {
        $user = User::factory()->create();

        $target = $this->createCandidate([
            'gender' => 'female',
            'date_of_birth' => now()->subYears(26)->toDateString(),
            'city' => 'Islamabad',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'education' => "Master's",
            'profession' => 'Education',
            'marital_status' => 'never_married',
            'height' => 162,
        ]);

        $other = $this->createCandidate([
            'gender' => 'female',
            'date_of_birth' => now()->subYears(26)->toDateString(),
            'city' => 'Lahore', // different city
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'education' => "Master's",
            'profession' => 'Education',
            'marital_status' => 'never_married',
            'height' => 162,
        ]);

        $query = http_build_query([
            'gender' => 'female',
            'min_age' => 24,
            'max_age' => 28,
            'city' => 'Islamabad',
            'religion' => 'Islam',
            'education' => "Master's",
        ]);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?' . $query);

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertContains($target->profile_code, $codes);
        $this->assertNotContains($other->profile_code, $codes);
    }

    // ==========================================
    // 4. Validation Rejection Tests
    // ==========================================

    public function test_invalid_filter_parameters_are_rejected(): void
    {
        $user = User::factory()->create();

        $invalidParams = [
            'gender' => 'alien',
            'religion' => 'FakeFaith',
            'sect' => 'UnrecognizedSect',
            'city' => 'Narnia',
            'education' => 'Wizardry',
            'profession' => 'TimeTraveler',
            'marital_status' => 'complicated',
            'min_age' => 15, // underage
            'max_age' => 14, // min_age > max_age
            'min_height' => 100, // < 120cm
            'max_height' => 90, // < min_height
        ];

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?' . http_build_query($invalidParams));

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'gender',
                'religion',
                'sect',
                'city',
                'education',
                'profession',
                'marital_status',
                'min_age',
                'max_age',
                'min_height',
                'max_height',
            ]);
    }

    // ==========================================
    // 5. Public Detail Endpoint Tests
    // ==========================================

    public function test_active_profile_can_be_viewed_by_profile_code(): void
    {
        $user = User::factory()->create();
        $candidate = $this->createCandidate();

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles/' . $candidate->profile_code);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'profile_code' => $candidate->profile_code,
                    'gender' => 'female',
                    'city' => 'Lahore',
                    'religion' => 'Islam',
                    'sect' => 'Sunni',
                    'verifications' => [
                        'email_verified' => true,
                    ],
                ],
            ]);
    }

    public function test_guest_cannot_view_public_detail(): void
    {
        $candidate = $this->createCandidate();

        $response = $this->getJson('/api/discovery/profiles/' . $candidate->profile_code);
        $response->assertStatus(401);
    }

    public function test_unverified_user_cannot_view_public_detail(): void
    {
        $user = User::factory()->unverified()->create();
        $candidate = $this->createCandidate();

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles/' . $candidate->profile_code);
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'EMAIL_NOT_VERIFIED',
            ]);
    }

    public function test_suspended_user_cannot_view_public_detail(): void
    {
        $user = User::factory()->create(['status' => 'suspended']);
        $candidate = $this->createCandidate();

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles/' . $candidate->profile_code);
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'ACCOUNT_SUSPENDED',
            ]);
    }

    public function test_hidden_or_draft_profile_cannot_be_viewed_via_public_detail(): void
    {
        $user = User::factory()->create();
        $hidden = $this->createCandidate(['profile_status' => 'hidden']);
        $draft = $this->createCandidate(['profile_status' => 'draft']);

        $this->actingAs($user)->getJson('/api/discovery/profiles/' . $hidden->profile_code)
            ->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error_code' => 'PROFILE_NOT_FOUND',
            ]);

        $this->actingAs($user)->getJson('/api/discovery/profiles/' . $draft->profile_code)
            ->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error_code' => 'PROFILE_NOT_FOUND',
            ]);
    }

    public function test_non_existent_profile_code_returns_404(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles/RK-DOESNOTEXIST');
        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error_code' => 'PROFILE_NOT_FOUND',
            ]);
    }

    // ==========================================
    // 6. Strict Privacy Verification Tests
    // ==========================================

    public function test_discovery_and_detail_strictly_omit_private_fields(): void
    {
        $searcher = User::factory()->create();

        $candidateUser = User::factory()->create([
            'email' => 'private_candidate@secretdomain.com',
        ]);

        $candidate = Profile::create([
            'user_id' => $candidateUser->id,
            'gender' => 'female',
            'date_of_birth' => '1998-04-14',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Islamabad',
            'education' => "Master's",
            'profession' => 'Education',
            'marital_status' => 'never_married',
            'height' => 163,
            'about' => 'Extremely sensitive confidential bio statement.',
            'family_background' => 'Family tree and background confidential.',
            'managed_by' => 'myself',
            'profile_status' => 'active',
        ]);

        // 1. Check Search API Response
        $searchResponse = $this->actingAs($searcher)->getJson('/api/discovery/profiles');
        $searchRaw = $searchResponse->getContent();
        $searchItem = collect($searchResponse->json('data'))->firstWhere('profile_code', $candidate->profile_code);

        $this->assertNotNull($searchItem);
        $this->assertArrayNotHasKey('about', $searchItem);
        $this->assertArrayNotHasKey('family_background', $searchItem);
        $this->assertArrayNotHasKey('date_of_birth', $searchItem);
        $this->assertArrayNotHasKey('email', $searchItem);
        $this->assertArrayNotHasKey('phone_number', $searchItem);
        $this->assertArrayNotHasKey('user_id', $searchItem);
        $this->assertArrayNotHasKey('id', $searchItem);

        $this->assertStringNotContainsString('1998-04-14', $searchRaw);
        $this->assertStringNotContainsString('private_candidate@secretdomain.com', $searchRaw);
        $this->assertStringNotContainsString('Extremely sensitive confidential', $searchRaw);
        $this->assertStringNotContainsString('Family tree and background confidential', $searchRaw);

        // 2. Check Detail API Response
        $detailResponse = $this->actingAs($searcher)->getJson('/api/discovery/profiles/' . $candidate->profile_code);
        $detailRaw = $detailResponse->getContent();
        $detailData = $detailResponse->json('data');

        $this->assertArrayNotHasKey('about', $detailData);
        $this->assertArrayNotHasKey('family_background', $detailData);
        $this->assertArrayNotHasKey('date_of_birth', $detailData);
        $this->assertArrayNotHasKey('email', $detailData);
        $this->assertArrayNotHasKey('phone_number', $detailData);
        $this->assertArrayNotHasKey('user_id', $detailData);
        $this->assertArrayNotHasKey('id', $detailData);

        $this->assertStringNotContainsString('1998-04-14', $detailRaw);
        $this->assertStringNotContainsString('private_candidate@secretdomain.com', $detailRaw);
        $this->assertStringNotContainsString('Extremely sensitive confidential', $detailRaw);
        $this->assertStringNotContainsString('Family tree and background confidential', $detailRaw);
    }

    // ==========================================
    // 7. Pagination & Default Ordering Tests
    // ==========================================

    public function test_search_results_are_paginated_with_metadata(): void
    {
        $user = User::factory()->create();

        // Create 15 candidates
        for ($i = 0; $i < 15; $i++) {
            $this->createCandidate();
        }

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles?per_page=5&page=1');

        $response->assertStatus(200)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.total', 15);

        $this->assertCount(5, $response->json('data'));

        // Page 2
        $page2Response = $this->actingAs($user)->getJson('/api/discovery/profiles?per_page=5&page=2');
        $page2Response->assertStatus(200)
            ->assertJsonPath('meta.current_page', 2);
        $this->assertCount(5, $page2Response->json('data'));
    }

    public function test_default_ordering_is_recently_updated_first(): void
    {
        $user = User::factory()->create();

        $older = $this->createCandidate(['created_at' => now()->subDays(5), 'updated_at' => now()->subDays(5)]);
        $newer = $this->createCandidate(['created_at' => now()->subDays(1), 'updated_at' => now()->subHour()]);

        $response = $this->actingAs($user)->getJson('/api/discovery/profiles');

        $codes = collect($response->json('data'))->pluck('profile_code')->all();
        $this->assertEquals($newer->profile_code, $codes[0]);
        $this->assertEquals($older->profile_code, $codes[1]);
    }
}

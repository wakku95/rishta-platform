<?php

namespace Tests\Feature;

use App\Models\AssistedListing;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminMatchmakerTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_matchmaker_endpoints(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user, ['*']);

        $res = $this->getJson('/api/admin/matchmaker/candidates');
        $res->assertStatus(403);

        $resMatches = $this->postJson('/api/admin/matchmaker/matches', []);
        $resMatches->assertStatus(403);
    }

    public function test_admin_can_retrieve_candidates_for_matchmaking(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin, ['*']);

        // Create an assisted listing
        $listing = AssistedListing::factory()->create([
            'listing_code' => 'AL-TEST01',
            'full_name' => 'Sara Khan',
            'gender' => 'female',
            'listing_status' => 'published',
        ]);

        $response = $this->getJson('/api/admin/matchmaker/candidates?type=assisted&gender=female');
        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $codes = collect($response->json('data.candidates'))->pluck('code')->toArray();
        $this->assertContains('AL-TEST01', $codes);
    }

    public function test_admin_can_find_compatible_matches_for_candidate(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin, ['*']);

        // Potential match 1: Registered Profile (Male, Lahore, Bachelor's)
        $userMale = User::factory()->create();
        $maleProfile = Profile::create([
            'user_id' => $userMale->id,
            'profile_code' => 'RK-MALE01',
            'gender' => 'male',
            'date_of_birth' => '1995-05-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Engineer',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'myself',
            'profile_status' => 'active',
        ]);

        // Potential match 2: Assisted Listing (Male, Lahore, Master's)
        $maleListing = AssistedListing::factory()->create([
            'listing_code' => 'AL-MALE02',
            'gender' => 'male',
            'date_of_birth' => '1994-01-10',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Master's",
            'profession' => 'Doctor',
            'marital_status' => 'never_married',
            'listing_status' => 'published',
        ]);

        // Find matches for a female looking for Male in Lahore with at least Bachelor's
        $response = $this->postJson('/api/admin/matchmaker/matches', [
            'preferred_gender' => 'male',
            'min_age' => 25,
            'max_age' => 35,
            'cities' => ['Lahore'],
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'education' => "Bachelor's",
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $matchedCodes = collect($response->json('data.matches'))->pluck('code')->toArray();
        $this->assertContains('RK-MALE01', $matchedCodes);
        $this->assertContains('AL-MALE02', $matchedCodes);
    }
}

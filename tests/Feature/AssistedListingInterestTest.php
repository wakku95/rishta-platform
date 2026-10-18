<?php

namespace Tests\Feature;

use App\Models\AssistedListing;
use App\Models\AssistedListingInterest;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AssistedListingInterestTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitor_cannot_submit_interest_without_logging_in()
    {
        $listing = AssistedListing::factory()->create([
            'listing_status' => 'published',
        ]);

        $response = $this->postJson("/api/listings/{$listing->listing_code}/interest", [
            'submitter_name' => 'Guest User',
            'submitter_contact' => '03001234567',
        ]);

        $response->assertStatus(401);
    }

    public function test_logged_in_user_without_profile_cannot_submit_interest()
    {
        $listing = AssistedListing::factory()->create([
            'listing_status' => 'published',
        ]);
        
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson("/api/listings/{$listing->listing_code}/interest", [
            'submitter_name' => 'Logged User',
            'submitter_contact' => '+923111234567',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'PROFILE_REQUIRED');
    }

    public function test_logged_in_user_with_profile_attaches_user_id()
    {
        $listing = AssistedListing::factory()->create([
            'listing_status' => 'published',
        ]);
        
        $user = User::factory()->create();
        Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-APPLICANT01',
            'gender' => 'male',
            'date_of_birth' => '1995-05-15',
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

        $response = $this->actingAs($user)->postJson("/api/listings/{$listing->listing_code}/interest", [
            'submitter_name' => 'Logged User',
            'submitter_contact' => '+923111234567',
            'message' => 'Interested in proposal',
        ]);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('assisted_listing_interests', [
            'assisted_listing_id' => $listing->id,
            'user_id' => $user->id,
            'submitter_contact' => '+923111234567',
        ]);
    }

    public function test_duplicate_interest_rate_limited()
    {
        $listing = AssistedListing::factory()->create([
            'listing_status' => 'published',
        ]);

        $user = User::factory()->create();
        Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-APPLICANT02',
            'gender' => 'male',
            'date_of_birth' => '1995-05-15',
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

        AssistedListingInterest::factory()->create([
            'assisted_listing_id' => $listing->id,
            'user_id' => $user->id,
            'submitter_contact' => '+923001234567',
            'created_at' => now()->subHours(2),
        ]);

        // Attempt second submission with same user
        $response = $this->actingAs($user)->postJson("/api/listings/{$listing->listing_code}/interest", [
            'submitter_name' => 'Spammer',
            'submitter_contact' => '03001234567',
        ]);

        $response->assertStatus(429)
                 ->assertJsonPath('message', 'You have already submitted an interest for this listing recently.');
    }

    public function test_assisted_listings_can_be_filtered_by_education()
    {
        $phd = \App\Models\AssistedListing::factory()->create([
            'listing_code' => 'AL-PHD001',
            'education' => 'PhD',
            'listing_status' => 'published',
        ]);

        $bachelor = \App\Models\AssistedListing::factory()->create([
            'listing_code' => 'AL-BACH002',
            'education' => "Bachelor's",
            'listing_status' => 'published',
        ]);

        $matric = \App\Models\AssistedListing::factory()->create([
            'listing_code' => 'AL-MAT003',
            'education' => 'Matric / O-Level',
            'listing_status' => 'published',
        ]);

        // Filter by Bachelor's (includes Bachelor's, Master's, MPhil, PhD)
        $res = $this->getJson('/api/listings?education=' . urlencode("Bachelor's"));
        $res->assertStatus(200);
        $codes = collect($res->json('data'))->pluck('listing_code')->toArray();
        $this->assertContains('AL-PHD001', $codes);
        $this->assertContains('AL-BACH002', $codes);
        $this->assertNotContains('AL-MAT003', $codes);

        // Filter by PhD (only includes PhD)
        $resPhd = $this->getJson('/api/listings?education=' . urlencode('PhD'));
        $resPhd->assertStatus(200);
        $codesPhd = collect($resPhd->json('data'))->pluck('listing_code')->toArray();
        $this->assertContains('AL-PHD001', $codesPhd);
        $this->assertNotContains('AL-BACH002', $codesPhd);
        $this->assertNotContains('AL-MAT003', $codesPhd);
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AssistedListingInterestTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitor_can_submit_interest_with_contact()
    {
        $listing = \App\Models\AssistedListing::factory()->create([
            'listing_status' => 'published',
        ]);

        $response = $this->postJson("/api/listings/{$listing->listing_code}/interest", [
            'submitter_name' => 'Guest User',
            'submitter_contact' => '03001234567',
        ]);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('assisted_listing_interests', [
            'assisted_listing_id' => $listing->id,
            'submitter_name' => 'Guest User',
            'submitter_contact' => '+923001234567', // Normalized
            'status' => 'new',
            'user_id' => null,
        ]);
    }

    public function test_logged_in_user_interest_attaches_user_id()
    {
        $listing = \App\Models\AssistedListing::factory()->create([
            'listing_status' => 'published',
        ]);
        
        $user = \App\Models\User::factory()->create();

        $response = $this->actingAs($user)->postJson("/api/listings/{$listing->listing_code}/interest", [
            'submitter_name' => 'Logged User',
            'submitter_contact' => '+923111234567',
        ]);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('assisted_listing_interests', [
            'assisted_listing_id' => $listing->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_duplicate_interest_rate_limited()
    {
        $listing = \App\Models\AssistedListing::factory()->create([
            'listing_status' => 'published',
        ]);

        \App\Models\AssistedListingInterest::factory()->create([
            'assisted_listing_id' => $listing->id,
            'submitter_contact' => '+923001234567',
            'created_at' => now()->subHours(2),
        ]);

        // Attempt second submission with same normalized contact
        $response = $this->postJson("/api/listings/{$listing->listing_code}/interest", [
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

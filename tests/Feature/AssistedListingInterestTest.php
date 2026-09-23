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
}

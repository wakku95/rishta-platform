<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AdminListingInterestTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_listing_interests()
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        $listing = \App\Models\AssistedListing::factory()->create();
        $interest = \App\Models\AssistedListingInterest::factory()->create([
            'assisted_listing_id' => $listing->id,
            'status' => 'new',
        ]);

        // Update status
        $response = $this->actingAs($admin)->postJson("/api/admin/listings/{$listing->id}/interests/{$interest->id}/status", [
            'status' => 'contacted',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('assisted_listing_interests', [
            'id' => $interest->id,
            'status' => 'contacted',
            'reviewed_by' => $admin->id,
        ]);

        // Add notes
        $response = $this->actingAs($admin)->postJson("/api/admin/listings/{$listing->id}/interests/{$interest->id}/notes", [
            'admin_notes' => 'Called the family.',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('assisted_listing_interests', [
            'id' => $interest->id,
            'admin_notes' => 'Called the family.',
        ]);

        // Delete interest
        $response = $this->actingAs($admin)->deleteJson("/api/admin/listings/{$listing->id}/interests/{$interest->id}");
        $response->assertStatus(200);
        
        $this->assertDatabaseMissing('assisted_listing_interests', [
            'id' => $interest->id,
        ]);
    }
}

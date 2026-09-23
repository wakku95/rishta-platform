<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AssistedListingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_assisted_listing()
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->postJson('/api/admin/listings', [
            'full_name' => 'John Doe',
            'gender' => 'male',
            'date_of_birth' => '1990-01-01',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Engineering',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'myself',
            'listing_status' => 'draft',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('assisted_listings', [
            'full_name' => 'John Doe',
            'listing_status' => 'draft',
        ]);
        
        $listing = \App\Models\AssistedListing::first();
        $this->assertStringStartsWith('AP-', $listing->listing_code);
    }

    public function test_listing_code_is_sequential()
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        
        \App\Models\AssistedListing::factory()->create(['listing_code' => 'AP-1005']);

        $response = $this->actingAs($admin)->postJson('/api/admin/listings', [
            'full_name' => 'Jane Doe',
            'gender' => 'female',
            'date_of_birth' => '1995-01-01',
            'religion' => 'Islam',
            'city' => 'Karachi',
            'education' => "Master's",
            'profession' => 'Medical / Healthcare',
            'marital_status' => 'never_married',
            'height' => 165,
            'managed_by' => 'parent',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('assisted_listings', [
            'listing_code' => 'AP-1006'
        ]);
    }

    public function test_listing_cannot_be_published_without_consent()
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->postJson('/api/admin/listings', [
            'full_name' => 'John Doe',
            'gender' => 'male',
            'date_of_birth' => '1990-01-01',
            'religion' => 'Islam',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Engineering',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'myself',
            'listing_status' => 'published',
            'consent_given' => false,
        ]);

        $response->assertStatus(422)
                 ->assertJsonPath('message', 'Cannot publish a listing without consent.');
    }

    public function test_admin_can_unpublish_listing()
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        $listing = \App\Models\AssistedListing::factory()->create([
            'listing_status' => 'published',
            'consent_given_at' => now(),
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/listings/{$listing->id}/unpublish");

        $response->assertStatus(200);
        $this->assertDatabaseHas('assisted_listings', [
            'id' => $listing->id,
            'listing_status' => 'unpublished',
        ]);
    }
    public function test_conversion_aborts_on_duplicate_user()
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        $existingUser = \App\Models\User::factory()->create(['email' => 'duplicate@example.com']);
        $listing = \App\Models\AssistedListing::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/listings/{$listing->id}/convert", [
            'email' => 'duplicate@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(400)
                 ->assertJsonPath('message', 'An account with this email already exists. Please resolve manually.');
    }

    public function test_conversion_maps_fields_correctly()
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        $listing = \App\Models\AssistedListing::factory()->create([
            'public_about' => 'This is public.',
            'family_background' => 'This is private family background.',
            'contact_otp_hash' => 'hash123',
            'admin_notes' => 'Secret admin notes.',
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/listings/{$listing->id}/convert", [
            'email' => 'newuser@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);

        $user = \App\Models\User::where('email', 'newuser@example.com')->first();
        $this->assertNotNull($user);

        $profile = \App\Models\Profile::where('user_id', $user->id)->first();
        $this->assertNotNull($profile);

        // Assert field mapping
        $this->assertEquals('This is public.', $profile->about);
        $this->assertEquals('This is private family background.', $profile->family_background);
        
        // Ensure OTP state and admin notes were NOT mapped
        $this->assertNull($profile->contact_otp_hash ?? null);
        $this->assertNull($profile->admin_notes ?? null);

        // Ensure listing is marked converted
        $listing->refresh();
        $this->assertEquals('converted', $listing->listing_status);
        $this->assertEquals($user->id, $listing->user_id);
    }
}

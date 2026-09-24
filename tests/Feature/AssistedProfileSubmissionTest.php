<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\AssistedProfileSubmission;
use App\Models\AssistedListing;

class AssistedProfileSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private array $validPublicBiodata = [
        'gender' => 'female',
        'date_of_birth' => '1995-01-01',
        'marital_status' => 'never_married',
        'city' => 'Karachi',
        'religion' => 'Islam',
        'sect' => 'Sunni',
        'education' => 'Bachelor\'s',
        'profession' => 'Software / IT',
        'height' => 165,
        'managed_by' => 'parent',
        'public_about' => 'Looking for a good match.'
    ];

    public function test_customer_can_submit_assisted_profile_request()
    {
        $payload = [
            'submitter_name' => 'John Doe',
            'submitter_contact' => '03001234567',
            'public_biodata' => $this->validPublicBiodata,
            'terms_accepted' => true,
            'social_publication_consent' => true
        ];

        $response = $this->postJson('/api/assisted-submissions', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('assisted_profile_submissions', [
            'submitter_name' => 'John Doe',
            'submitter_contact' => '03001234567',
            'status' => 'pending',
            'terms_accepted' => 1,
            'social_publication_consent' => 1
        ]);
        
        $this->assertDatabaseCount('assisted_listings', 0);
    }

    public function test_terms_consent_is_required()
    {
        $payload = [
            'submitter_name' => 'John Doe',
            'submitter_contact' => '03001234567',
            'public_biodata' => $this->validPublicBiodata,
            'terms_accepted' => false,
        ];

        $response = $this->postJson('/api/assisted-submissions', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('terms_accepted');
    }

    public function test_admin_can_view_pending_submissions()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        AssistedProfileSubmission::create([
            'submitter_name' => 'Jane',
            'submitter_contact' => '03001234567',
            'public_biodata' => $this->validPublicBiodata,
            'terms_accepted' => true,
            'terms_accepted_at' => now(),
            'status' => 'pending'
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/assisted-submissions');
        $response->assertStatus(200);
        $response->assertJsonPath('data.0.submitter_name', 'Jane');
    }

    public function test_admin_can_approve_submission()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $submission = AssistedProfileSubmission::create([
            'submitter_name' => 'Jane',
            'submitter_contact' => '03001234567',
            'public_biodata' => $this->validPublicBiodata,
            'terms_accepted' => true,
            'terms_accepted_at' => now(),
            'status' => 'pending'
        ]);

        $response = $this->actingAs($admin)->postJson('/api/admin/assisted-submissions/' . $submission->id . '/approve');
        $response->assertStatus(200);

        $submission->refresh();
        $this->assertEquals('approved', $submission->status);
        $this->assertNotNull($submission->resulting_assisted_listing_id);

        $this->assertDatabaseHas('assisted_listings', [
            'full_name' => 'Jane',
            'contact_number' => '03001234567',
            'listing_status' => 'published',
            'created_by_admin_id' => $admin->id,
            'city' => 'Karachi'
        ]);
    }

    public function test_admin_can_reject_submission_with_reason()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $submission = AssistedProfileSubmission::create([
            'submitter_name' => 'Jane',
            'submitter_contact' => '03001234567',
            'public_biodata' => $this->validPublicBiodata,
            'terms_accepted' => true,
            'terms_accepted_at' => now(),
            'status' => 'pending'
        ]);

        $response = $this->actingAs($admin)->postJson('/api/admin/assisted-submissions/' . $submission->id . '/reject', [
            'rejection_reason' => 'Incomplete info'
        ]);
        
        $response->assertStatus(200);

        $submission->refresh();
        $this->assertEquals('rejected', $submission->status);
        $this->assertEquals('Incomplete info', $submission->rejection_reason);

        $this->assertDatabaseCount('assisted_listings', 0);
    }
}
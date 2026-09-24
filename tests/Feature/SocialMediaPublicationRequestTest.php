<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Profile;
use App\Models\SocialMediaPublicationRequest;

class SocialMediaPublicationRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_submit_social_media_request()
    {
        $user = User::factory()->create();
        $profile = Profile::create(['user_id' => $user->id, 'profile_code' => 'RN-1234', 'gender' => 'male', 'date_of_birth' => '1990-01-01', 'marital_status' => 'never_married', 'city' => 'Karachi', 'religion' => 'Islam', 'education' => 'Bachelor\'s', 'profession' => 'IT', 'height' => 170, 'managed_by' => 'myself', 'profile_status' => 'active']);

        $response = $this->actingAs($user)->postJson('/api/social-media-publication-requests', [
            'requested_platforms' => ['facebook', 'instagram'],
            'consent_given' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('social_media_publication_requests', [
            'user_id' => $user->id,
            'profile_id' => $profile->id,
            'status' => 'pending',
            'consent_given' => 1,
        ]);
    }

    public function test_inactive_user_cannot_submit_social_media_request()
    {
        $user = User::factory()->create();
        $profile = Profile::create(['user_id' => $user->id, 'profile_code' => 'RN-1235', 'gender' => 'male', 'date_of_birth' => '1990-01-01', 'marital_status' => 'never_married', 'city' => 'Karachi', 'religion' => 'Islam', 'education' => 'Bachelor\'s', 'profession' => 'IT', 'height' => 170, 'managed_by' => 'myself', 'profile_status' => 'draft']);

        $response = $this->actingAs($user)->postJson('/api/social-media-publication-requests', [
            'requested_platforms' => ['facebook', 'instagram'],
            'consent_given' => true,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_approve_request()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $req = SocialMediaPublicationRequest::create([
            'user_id' => $user->id,
            'status' => 'pending',
            'requested_platforms' => ['facebook'],
            'consent_given' => true
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/social-media-publication-requests/{$req->id}/approve");
        $response->assertStatus(200);

        $this->assertEquals('approved', $req->fresh()->status);
    }

    public function test_admin_can_mark_published()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $req = SocialMediaPublicationRequest::create([
            'user_id' => $user->id,
            'status' => 'approved',
            'requested_platforms' => ['facebook'],
            'consent_given' => true
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/social-media-publication-requests/{$req->id}/mark-published");
        $response->assertStatus(200);

        $this->assertEquals('published', $req->fresh()->status);
    }
}
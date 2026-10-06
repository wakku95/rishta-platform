<?php

namespace Tests\Feature;

use App\Models\AssistedListing;
use App\Models\CandidateVerificationRequest;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CandidateVerificationLinkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_guest_cannot_generate_verification_link(): void
    {
        $this->postJson('/api/admin/verification-links/generate', [
            'candidate_type' => 'assisted',
            'candidate_id' => 1,
        ])->assertStatus(401);
    }

    public function test_admin_can_generate_verification_link_for_assisted_listing(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $listing = AssistedListing::create([
            'listing_code' => 'AS-9988',
            'full_name' => 'Test Candidate',
            'contact_number' => '03001234567',
            'gender' => 'male',
            'height' => 175,
            'city' => 'Lahore',
            'date_of_birth' => '1995-01-01',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'education' => 'Bachelors',
            'profession' => 'Engineer',
            'marital_status' => 'never_married',
            'listing_status' => 'published',
            'managed_by' => 'self',
        ]);

        $res = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/verification-links/generate', [
                'candidate_type' => 'assisted',
                'candidate_id' => $listing->id,
                'document_type' => 'cnic',
            ])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $token = $res->json('data.token');
        $this->assertNotEmpty($token);
        $this->assertDatabaseHas('candidate_verification_requests', [
            'token' => $token,
            'candidate_code' => $listing->listing_code,
            'status' => 'pending',
        ]);
    }

    public function test_admin_can_generate_separate_links_for_different_document_types(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $listing = AssistedListing::create([
            'listing_code' => 'AS-9989',
            'full_name' => 'Multi Doc Candidate',
            'contact_number' => '03009999999',
            'gender' => 'female',
            'height' => 162,
            'city' => 'Karachi',
            'date_of_birth' => '1998-05-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'education' => 'Masters',
            'profession' => 'Doctor',
            'marital_status' => 'never_married',
            'listing_status' => 'published',
            'managed_by' => 'self',
        ]);

        // Generate CNIC link
        $resCnic = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/verification-links/generate', [
                'candidate_type' => 'assisted',
                'candidate_id' => $listing->id,
                'document_type' => 'cnic',
            ])
            ->assertStatus(200);

        // Generate Salary Slip link for same candidate
        $resSalary = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/verification-links/generate', [
                'candidate_type' => 'assisted',
                'candidate_id' => $listing->id,
                'document_type' => 'salary_slip',
            ])
            ->assertStatus(200);

        $freshListing = $listing->fresh();
        $this->assertNotEquals($resCnic->json('data.token'), $resSalary->json('data.token'));
        $this->assertDatabaseCount('candidate_verification_requests', 2);
        $this->assertDatabaseHas('candidate_verification_requests', [
            'candidate_code' => $freshListing->listing_code,
            'document_type' => 'salary_slip',
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('candidate_verification_requests', [
            'candidate_code' => $freshListing->listing_code,
            'document_type' => 'cnic',
            'status' => 'pending',
        ]);
    }

    public function test_public_can_view_and_submit_verification_document(): void
    {
        $request = CandidateVerificationRequest::create([
            'token' => 'test-token-1234567890abcdef',
            'candidate_type' => 'assisted',
            'candidate_id' => 1,
            'candidate_code' => 'AS-1001',
            'document_type' => 'cnic',
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        // 1. View link
        $viewRes = $this->getJson("/api/public/verify-doc/{$request->token}")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.candidate_code', 'AS-1001')
            ->assertJsonPath('data.status', 'pending');

        // 2. Submit document using UploadedFile::fake()->create()
        $front = UploadedFile::fake()->create('front_cnic.jpg', 100, 'image/jpeg');
        $back = UploadedFile::fake()->create('back_cnic.jpg', 100, 'image/jpeg');

        $submitRes = $this->postJson("/api/public/verify-doc/{$request->token}/submit", [
            'front_image' => $front,
            'back_image' => $back,
            'notes' => 'Nadra Smart Card',
        ])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'submitted');

        $this->assertDatabaseHas('candidate_verification_requests', [
            'token' => $request->token,
            'status' => 'submitted',
            'notes' => 'Nadra Smart Card',
        ]);
    }

    public function test_admin_can_approve_submitted_verification(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $req = CandidateVerificationRequest::create([
            'token' => 'approve-token-123',
            'candidate_type' => 'assisted',
            'candidate_id' => 1,
            'candidate_code' => 'AS-1002',
            'document_type' => 'cnic',
            'status' => 'submitted',
            'expires_at' => now()->addDays(7),
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/verification-links/{$req->id}/approve", [
                'notes' => 'CNIC verified with Nadra records.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('candidate_verification_requests', [
            'id' => $req->id,
            'status' => 'approved',
            'reviewed_by_user_id' => $admin->id,
        ]);
    }

    public function test_expired_verification_link_is_rejected_on_submission(): void
    {
        $req = CandidateVerificationRequest::create([
            'token' => 'expired-token-123',
            'candidate_type' => 'assisted',
            'candidate_id' => 1,
            'candidate_code' => 'AS-1003',
            'document_type' => 'cnic',
            'status' => 'pending',
            'expires_at' => now()->subDay(), // Expired
        ]);

        $front = UploadedFile::fake()->create('front.jpg', 100, 'image/jpeg');

        $this->postJson("/api/public/verify-doc/{$req->token}/submit", [
            'front_image' => $front,
        ])->assertStatus(410); // HTTP_GONE
    }
}

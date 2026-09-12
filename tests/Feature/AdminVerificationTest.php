<?php

namespace Tests\Feature;

use App\Models\ProfileVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_regular_user_cannot_access_admin_verification_endpoints(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user, ['*']);

        $this->getJson('/api/admin/verifications')->assertStatus(403);
    }

    public function test_admin_can_list_and_filter_verifications(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();

        ProfileVerification::create([
            'user_id' => $user->id,
            'type' => 'identity',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        ProfileVerification::create([
            'user_id' => $user->id,
            'type' => 'education',
            'status' => 'approved',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->getJson('/api/admin/verifications?status=pending');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.data'));
        $this->assertEquals('identity', $response->json('data.data.0.type'));
    }

    public function test_admin_can_approve_verification(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();

        $verification = ProfileVerification::create([
            'user_id' => $user->id,
            'type' => 'identity',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/admin/verifications/{$verification->id}/approve");
        $response->assertStatus(200);

        $this->assertEquals('approved', $verification->fresh()->status);
        $this->assertEquals($admin->id, $verification->fresh()->reviewed_by);
        $this->assertTrue($user->fresh()->isIdentityVerified());
    }

    public function test_admin_can_reject_verification_with_reason(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();

        $verification = ProfileVerification::create([
            'user_id' => $user->id,
            'type' => 'identity',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/admin/verifications/{$verification->id}/reject", [
            'reason' => 'CNIC photo is blurry and illegible. Please re-upload.',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('rejected', $verification->fresh()->status);
        $this->assertEquals('CNIC photo is blurry and illegible. Please re-upload.', $verification->fresh()->rejection_reason);
        $this->assertFalse($user->fresh()->isIdentityVerified());
    }

    public function test_admin_can_view_document_stream(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();

        $file = UploadedFile::fake()->create('test.pdf', 200, 'application/pdf');
        $path = Storage::disk('local')->putFile('verifications/' . $user->id, $file);

        $verification = ProfileVerification::create([
            'user_id' => $user->id,
            'type' => 'identity',
            'status' => 'pending',
            'document_front_path' => $path,
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->get("/api/admin/verifications/{$verification->id}/document/front");
        $response->assertStatus(200);
        $this->assertEquals('inline', $response->headers->get('Content-Disposition'));
    }

    public function test_admin_can_purge_approved_documents_via_api(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        // 1. Approved 40 days ago (older than 30 days)
        $file1 = UploadedFile::fake()->create('old.jpg', 100, 'image/jpeg');
        $path1 = Storage::disk('local')->putFile('verifications/' . $user1->id, $file1);
        $oldApproved = ProfileVerification::create([
            'user_id' => $user1->id,
            'type' => 'identity',
            'status' => 'approved',
            'document_front_path' => $path1,
            'reviewed_at' => now()->subDays(40),
            'reviewed_by' => $admin->id,
            'submitted_at' => now()->subDays(41),
        ]);

        // 2. Approved 5 days ago (newer than 30 days)
        $file2 = UploadedFile::fake()->create('recent.jpg', 100, 'image/jpeg');
        $path2 = Storage::disk('local')->putFile('verifications/' . $user2->id, $file2);
        $recentApproved = ProfileVerification::create([
            'user_id' => $user2->id,
            'type' => 'identity',
            'status' => 'approved',
            'document_front_path' => $path2,
            'reviewed_at' => now()->subDays(5),
            'reviewed_by' => $admin->id,
            'submitted_at' => now()->subDays(6),
        ]);

        // 3. Pending (should NEVER be purged)
        $file3 = UploadedFile::fake()->create('pending.jpg', 100, 'image/jpeg');
        $path3 = Storage::disk('local')->putFile('verifications/' . $user3->id, $file3);
        $pending = ProfileVerification::create([
            'user_id' => $user3->id,
            'type' => 'identity',
            'status' => 'pending',
            'document_front_path' => $path3,
            'submitted_at' => now()->subDays(50),
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson('/api/admin/verifications/purge', ['days' => 30]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.purged_records', 1)
            ->assertJsonPath('data.freed_files', 1);

        // Old approved file unlinked
        Storage::disk('local')->assertMissing($path1);
        $this->assertNull($oldApproved->fresh()->document_front_path);
        $this->assertNotNull($oldApproved->fresh()->documents_purged_at);
        // User STILL verified!
        $this->assertTrue($user1->fresh()->isIdentityVerified());

        // Recent approved file preserved
        Storage::disk('local')->assertExists($path2);
        $this->assertNotNull($recentApproved->fresh()->document_front_path);

        // Pending file preserved
        Storage::disk('local')->assertExists($path3);
        $this->assertNotNull($pending->fresh()->document_front_path);
    }

    public function test_artisan_command_purges_approved_documents(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();

        $file = UploadedFile::fake()->create('doc.jpg', 100, 'image/jpeg');
        $path = Storage::disk('local')->putFile('verifications/' . $user->id, $file);
        $verification = ProfileVerification::create([
            'user_id' => $user->id,
            'type' => 'education',
            'status' => 'approved',
            'document_front_path' => $path,
            'reviewed_at' => now()->subDays(35),
            'reviewed_by' => $admin->id,
            'submitted_at' => now()->subDays(36),
        ]);

        $this->artisan('verifications:purge-documents', ['--days' => 30])
            ->assertSuccessful();

        Storage::disk('local')->assertMissing($path);
        $this->assertNull($verification->fresh()->document_front_path);
        $this->assertNotNull($verification->fresh()->documents_purged_at);
        $this->assertTrue($user->fresh()->isEducationVerified());
    }
}

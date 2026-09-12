<?php

namespace Tests\Feature;

use App\Models\ProfileVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_guest_cannot_access_verification_endpoints(): void
    {
        $this->getJson('/api/verifications')->assertStatus(401);
        $this->postJson('/api/verifications/identity')->assertStatus(401);
        $this->postJson('/api/verifications/education')->assertStatus(401);
    }

    public function test_authenticated_user_can_submit_identity_verification(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        Sanctum::actingAs($user, ['*']);

        $front = UploadedFile::fake()->create('cnic_front.pdf', 500, 'application/pdf');
        $back = UploadedFile::fake()->create('cnic_back.pdf', 500, 'application/pdf');

        $response = $this->postJson('/api/verifications/identity', [
            'front' => $front,
            'back' => $back,
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'data' => [
                'type' => 'identity',
                'status' => 'pending',
                'has_front_document' => true,
                'has_back_document' => true,
            ],
        ]);

        $this->assertDatabaseHas('profile_verifications', [
            'user_id' => $user->id,
            'type' => 'identity',
            'status' => 'pending',
        ]);
    }

    public function test_authenticated_user_can_submit_education_verification(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        Sanctum::actingAs($user, ['*']);

        $doc = UploadedFile::fake()->create('degree.pdf', 1024, 'application/pdf');

        $response = $this->postJson('/api/verifications/education', [
            'document' => $doc,
            'label' => 'BS Computer Science Degree',
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'data' => [
                'type' => 'education',
                'status' => 'pending',
                'document_name' => 'BS Computer Science Degree',
            ],
        ]);

        $this->assertDatabaseHas('profile_verifications', [
            'user_id' => $user->id,
            'type' => 'education',
            'status' => 'pending',
        ]);
    }

    public function test_invalid_file_types_are_rejected(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $exeFile = UploadedFile::fake()->create('malicious.exe', 100);

        $response = $this->postJson('/api/verifications/identity', [
            'front' => $exeFile,
            'back' => $exeFile,
        ]);

        $response->assertStatus(422);
    }

    public function test_oversized_file_is_rejected(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        // 6 MB file (limit is 5 MB)
        $largeFile = UploadedFile::fake()->create('large.pdf', 6144, 'application/pdf');
        $validFile = UploadedFile::fake()->create('valid.pdf', 500, 'application/pdf');

        $response = $this->postJson('/api/verifications/identity', [
            'front' => $largeFile,
            'back' => $validFile,
        ]);

        $response->assertStatus(422);
    }

    public function test_submitting_while_already_pending_replaces_old_files_safely(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $front1 = UploadedFile::fake()->create('front1.pdf', 500, 'application/pdf');
        $back1 = UploadedFile::fake()->create('back1.pdf', 500, 'application/pdf');

        $this->postJson('/api/verifications/identity', [
            'front' => $front1,
            'back' => $back1,
        ])->assertStatus(201);

        $this->assertEquals(1, ProfileVerification::where('user_id', $user->id)->count());

        // Re-submit while still pending
        $front2 = UploadedFile::fake()->create('front2.pdf', 500, 'application/pdf');
        $back2 = UploadedFile::fake()->create('back2.pdf', 500, 'application/pdf');

        $this->postJson('/api/verifications/identity', [
            'front' => $front2,
            'back' => $back2,
        ])->assertStatus(201);

        // Count must still be 1 (replaced, no duplicate active pending)
        $this->assertEquals(1, ProfileVerification::where('user_id', $user->id)->count());
    }

    public function test_user_can_withdraw_pending_verification(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $front = UploadedFile::fake()->create('front.pdf', 500, 'application/pdf');
        $back = UploadedFile::fake()->create('back.pdf', 500, 'application/pdf');

        $res = $this->postJson('/api/verifications/identity', [
            'front' => $front,
            'back' => $back,
        ]);

        $id = $res->json('data.id');

        $delRes = $this->deleteJson("/api/verifications/{$id}");
        $delRes->assertStatus(200);

        $this->assertDatabaseMissing('profile_verifications', ['id' => $id]);
    }
}

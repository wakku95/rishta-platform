<?php

namespace Tests\Feature;

use App\Events\RishtaRequestAccepted;
use App\Events\RishtaRequestCancelled;
use App\Events\RishtaRequestDeclined;
use App\Events\RishtaRequestSent;
use App\Models\Profile;
use App\Models\RishtaRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class RishtaRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function createVerifiedUser(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'status' => 'active',
        ], $attributes));
    }

    protected function createActiveProfile(User $user, array $attributes = []): Profile
    {
        return Profile::create(array_merge([
            'user_id' => $user->id,
            'gender' => 'female',
            'date_of_birth' => '1998-05-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => 'Bachelors',
            'profession' => 'Software Engineer',
            'marital_status' => 'never_married',
            'height' => 165,
            'managed_by' => 'self',
            'profile_status' => 'active',
        ], $attributes));
    }

    public function test_user_without_active_profile_cannot_send_request(): void
    {
        $user1 = $this->createVerifiedUser();
        // User1 has no profile
        $user2 = $this->createVerifiedUser();
        $targetProfile = $this->createActiveProfile($user2);

        $response = $this->actingAs($user1)->postJson('/api/requests', [
            'profile_code' => $targetProfile->profile_code,
        ]);

        $response->assertStatus(Response::HTTP_FORBIDDEN)
            ->assertJson([
                'success' => false,
                'error_code' => 'ACTIVE_PROFILE_REQUIRED',
            ]);
    }

    public function test_user_with_active_profile_can_send_rishta_request(): void
    {
        Event::fake([RishtaRequestSent::class]);

        $user1 = $this->createVerifiedUser();
        $this->createActiveProfile($user1, ['gender' => 'male']);

        $user2 = $this->createVerifiedUser();
        $targetProfile = $this->createActiveProfile($user2);

        $response = $this->actingAs($user1)->postJson('/api/requests', [
            'profile_code' => $targetProfile->profile_code,
        ]);

        $response->assertStatus(Response::HTTP_CREATED)
            ->assertJson([
                'success' => true,
                'message' => 'Rishta request sent successfully.',
            ]);

        $this->assertDatabaseHas('rishta_requests', [
            'sender_id' => $user1->id,
            'receiver_id' => $user2->id,
            'status' => 'pending',
            'active_pair_hash' => min($user1->id, $user2->id) . '_' . max($user1->id, $user2->id),
        ]);

        Event::assertDispatched(RishtaRequestSent::class);
    }

    public function test_user_cannot_send_request_to_self(): void
    {
        $user = $this->createVerifiedUser();
        $ownProfile = $this->createActiveProfile($user);

        $response = $this->actingAs($user)->postJson('/api/requests', [
            'profile_code' => $ownProfile->profile_code,
        ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)
            ->assertJson([
                'success' => false,
                'error_code' => 'CANNOT_REQUEST_SELF',
            ]);
    }

    public function test_concurrent_or_duplicate_request_in_either_direction_is_blocked(): void
    {
        $user1 = $this->createVerifiedUser();
        $this->createActiveProfile($user1, ['gender' => 'male']);

        $user2 = $this->createVerifiedUser();
        $profile2 = $this->createActiveProfile($user2);

        // 1. User1 sends to User2
        $this->actingAs($user1)->postJson('/api/requests', ['profile_code' => $profile2->profile_code])
            ->assertStatus(Response::HTTP_CREATED);

        // 2. User1 attempts to send again to User2
        $responseDuplicate = $this->actingAs($user1)->postJson('/api/requests', ['profile_code' => $profile2->profile_code]);
        $responseDuplicate->assertStatus(Response::HTTP_CONFLICT)
            ->assertJson([
                'success' => false,
                'error_code' => 'ACTIVE_REQUEST_EXISTS',
            ]);

        // 3. User2 attempts to send to User1 (reverse direction while pending)
        $profile1 = $user1->profile;
        $responseReverse = $this->actingAs($user2)->postJson('/api/requests', ['profile_code' => $profile1->profile_code]);
        $responseReverse->assertStatus(Response::HTTP_CONFLICT)
            ->assertJson([
                'success' => false,
                'error_code' => 'ACTIVE_REQUEST_EXISTS',
            ]);
    }

    public function test_recipient_can_accept_pending_request(): void
    {
        Event::fake([RishtaRequestAccepted::class]);

        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);

        $receiver = $this->createVerifiedUser();
        $receiverProfile = $this->createActiveProfile($receiver);

        $createRes = $this->actingAs($sender)->postJson('/api/requests', ['profile_code' => $receiverProfile->profile_code]);
        $requestCode = $createRes->json('data.request_code');

        $response = $this->actingAs($receiver)->postJson("/api/requests/{$requestCode}/accept");

        $response->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'request_code' => $requestCode,
                    'status' => 'accepted',
                ],
            ]);

        $this->assertDatabaseHas('rishta_requests', [
            'request_code' => $requestCode,
            'status' => 'accepted',
        ]);
        $this->assertNotNull(RishtaRequest::where('request_code', $requestCode)->first()->accepted_at);

        Event::assertDispatched(RishtaRequestAccepted::class);
    }

    public function test_sender_cannot_accept_own_request(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);

        $receiver = $this->createVerifiedUser();
        $receiverProfile = $this->createActiveProfile($receiver);

        $createRes = $this->actingAs($sender)->postJson('/api/requests', ['profile_code' => $receiverProfile->profile_code]);
        $requestCode = $createRes->json('data.request_code');

        $response = $this->actingAs($sender)->postJson("/api/requests/{$requestCode}/accept");

        $response->assertStatus(Response::HTTP_FORBIDDEN)
            ->assertJson([
                'success' => false,
                'error_code' => 'UNAUTHORIZED_ACTION',
            ]);
    }

    public function test_recipient_can_decline_pending_request_and_frees_active_pair_hash(): void
    {
        Event::fake([RishtaRequestDeclined::class]);

        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);

        $receiver = $this->createVerifiedUser();
        $receiverProfile = $this->createActiveProfile($receiver);

        $createRes = $this->actingAs($sender)->postJson('/api/requests', ['profile_code' => $receiverProfile->profile_code]);
        $requestCode = $createRes->json('data.request_code');

        $response = $this->actingAs($receiver)->postJson("/api/requests/{$requestCode}/decline");

        $response->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'request_code' => $requestCode,
                    'status' => 'declined',
                ],
            ]);

        $req = RishtaRequest::where('request_code', $requestCode)->first();
        $this->assertEquals('declined', $req->status);
        $this->assertNull($req->active_pair_hash);
        $this->assertNotNull($req->declined_at);

        Event::assertDispatched(RishtaRequestDeclined::class);
    }

    public function test_directional_permanent_decline_prohibits_original_sender_from_re_requesting(): void
    {
        $sender = $this->createVerifiedUser();
        $senderProfile = $this->createActiveProfile($sender, ['gender' => 'male']);

        $receiver = $this->createVerifiedUser();
        $receiverProfile = $this->createActiveProfile($receiver);

        // 1. Sender sends to Receiver
        $createRes = $this->actingAs($sender)->postJson('/api/requests', ['profile_code' => $receiverProfile->profile_code]);
        $requestCode = $createRes->json('data.request_code');

        // 2. Receiver declines
        $this->actingAs($receiver)->postJson("/api/requests/{$requestCode}/decline")->assertStatus(Response::HTTP_OK);

        // 3. Original sender attempts to re-request receiver in same direction -> BLOCKED
        $reRequest = $this->actingAs($sender)->postJson('/api/requests', ['profile_code' => $receiverProfile->profile_code]);
        $reRequest->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)
            ->assertJson([
                'success' => false,
                'error_code' => 'REQUEST_PREVIOUSLY_DECLINED',
            ]);

        // 4. Reverse direction: Receiver initiates request to original sender -> ALLOWED
        $reverseRequest = $this->actingAs($receiver)->postJson('/api/requests', ['profile_code' => $senderProfile->profile_code]);
        $reverseRequest->assertStatus(Response::HTTP_CREATED);
    }

    public function test_sender_can_cancel_pending_request_and_frees_active_pair_hash(): void
    {
        Event::fake([RishtaRequestCancelled::class]);

        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);

        $receiver = $this->createVerifiedUser();
        $receiverProfile = $this->createActiveProfile($receiver);

        $createRes = $this->actingAs($sender)->postJson('/api/requests', ['profile_code' => $receiverProfile->profile_code]);
        $requestCode = $createRes->json('data.request_code');

        $response = $this->actingAs($sender)->postJson("/api/requests/{$requestCode}/cancel");

        $response->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'request_code' => $requestCode,
                    'status' => 'cancelled',
                ],
            ]);

        $req = RishtaRequest::where('request_code', $requestCode)->first();
        $this->assertEquals('cancelled', $req->status);
        $this->assertNull($req->active_pair_hash);
        $this->assertNotNull($req->cancelled_at);

        Event::assertDispatched(RishtaRequestCancelled::class);
    }

    public function test_terminal_states_cannot_transition(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);

        $receiver = $this->createVerifiedUser();
        $receiverProfile = $this->createActiveProfile($receiver);

        $createRes = $this->actingAs($sender)->postJson('/api/requests', ['profile_code' => $receiverProfile->profile_code]);
        $requestCode = $createRes->json('data.request_code');

        // Decline request (now terminal)
        $this->actingAs($receiver)->postJson("/api/requests/{$requestCode}/decline")->assertStatus(Response::HTTP_OK);

        // Attempt to accept declined request
        $acceptDeclined = $this->actingAs($receiver)->postJson("/api/requests/{$requestCode}/accept");
        $acceptDeclined->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)
            ->assertJson([
                'success' => false,
                'error_code' => 'INVALID_TRANSITION',
            ]);

        // Attempt to cancel declined request
        $cancelDeclined = $this->actingAs($sender)->postJson("/api/requests/{$requestCode}/cancel");
        $cancelDeclined->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)
            ->assertJson([
                'success' => false,
                'error_code' => 'INVALID_TRANSITION',
            ]);
    }

    public function test_lazy_expiration_marks_request_expired_on_access(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);

        $receiver = $this->createVerifiedUser();
        $receiverProfile = $this->createActiveProfile($receiver);

        $createRes = $this->actingAs($sender)->postJson('/api/requests', ['profile_code' => $receiverProfile->profile_code]);
        $requestCode = $createRes->json('data.request_code');

        // Manually manipulate expires_at into the past
        RishtaRequest::where('request_code', $requestCode)->update([
            'expires_at' => Carbon::now()->subDay(),
        ]);

        // Access via show
        $response = $this->actingAs($receiver)->getJson("/api/requests/{$requestCode}");
        $response->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'expired',
                ],
            ]);

        $this->assertDatabaseHas('rishta_requests', [
            'request_code' => $requestCode,
            'status' => 'expired',
            'active_pair_hash' => null,
        ]);
    }

    public function test_scheduled_expire_stale_command_marks_expired(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);

        $receiver = $this->createVerifiedUser();
        $receiverProfile = $this->createActiveProfile($receiver);

        $createRes = $this->actingAs($sender)->postJson('/api/requests', ['profile_code' => $receiverProfile->profile_code]);
        $requestCode = $createRes->json('data.request_code');

        // Set expires_at in past
        RishtaRequest::where('request_code', $requestCode)->update([
            'expires_at' => Carbon::now()->subHours(2),
        ]);

        $this->artisan('requests:expire-stale')
            ->expectsOutput('Expired 1 stale rishta request(s).')
            ->assertExitCode(0);

        $this->assertDatabaseHas('rishta_requests', [
            'request_code' => $requestCode,
            'status' => 'expired',
            'active_pair_hash' => null,
        ]);
    }

    public function test_viewer_context_in_discovery_profile_show(): void
    {
        $viewer = $this->createVerifiedUser();
        $this->createActiveProfile($viewer, ['gender' => 'male']);

        $candidate = $this->createVerifiedUser();
        $candidateProfile = $this->createActiveProfile($candidate);

        // Before shortlist & request
        $res1 = $this->actingAs($viewer)->getJson("/api/discovery/profiles/{$candidateProfile->profile_code}");
        $res1->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'viewer_context' => [
                        'is_shortlisted' => false,
                        'active_request' => null,
                    ],
                ],
            ]);

        // Shortlist candidate
        $this->actingAs($viewer)->postJson('/api/shortlists', ['profile_code' => $candidateProfile->profile_code]);

        // Send rishta request
        $createRes = $this->actingAs($viewer)->postJson('/api/requests', ['profile_code' => $candidateProfile->profile_code]);
        $requestCode = $createRes->json('data.request_code');

        // After shortlist & request
        $res2 = $this->actingAs($viewer)->getJson("/api/discovery/profiles/{$candidateProfile->profile_code}");
        $res2->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'viewer_context' => [
                        'is_shortlisted' => true,
                        'active_request' => [
                            'request_code' => $requestCode,
                            'status' => 'pending',
                            'is_sender' => true,
                        ],
                    ],
                ],
            ]);
    }
}

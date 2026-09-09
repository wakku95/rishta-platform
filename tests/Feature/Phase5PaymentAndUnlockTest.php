<?php

namespace Tests\Feature;

use App\Contracts\PaymentGatewayInterface;
use App\Models\ContactUnlock;
use App\Models\Payment;
use App\Models\Profile;
use App\Models\RishtaRequest;
use App\Models\User;
use App\Notifications\ContactDetailsUnlockedNotification;
use App\Services\Payments\FakePaymentService;
use App\Services\Sms\MockSmsService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class Phase5PaymentAndUnlockTest extends TestCase
{
    use RefreshDatabase;

    protected FakePaymentService $paymentService;
    protected MockSmsService $smsService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->paymentService = app(PaymentGatewayInterface::class);
        $this->smsService = app(\App\Contracts\SmsServiceInterface::class);
    }

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

    protected function createAcceptedRequest(User $sender, User $receiver): RishtaRequest
    {
        return RishtaRequest::create([
            'request_code' => RishtaRequest::generateUniqueRequestCode(),
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'status' => RishtaRequest::STATUS_ACCEPTED,
            'active_pair_hash' => min($sender->id, $receiver->id) . '_' . max($sender->id, $receiver->id),
            'accepted_at' => now(),
        ]);
    }

    // =========================================================================
    // 1. PAYMENT INITIATION TESTS
    // =========================================================================

    public function test_sender_can_initiate_payment_for_accepted_request(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $response = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");

        $response->assertStatus(Response::HTTP_CREATED)
            ->assertJson([
                'success' => true,
                'data' => [
                    'request_code' => $request->request_code,
                    'amount' => 300,
                    'currency' => 'PKR',
                    'status' => 'pending',
                    'gateway' => 'fake',
                ],
            ]);

        $this->assertDatabaseHas('payments', [
            'rishta_request_id' => $request->id,
            'user_id' => $sender->id,
            'amount' => 300.00,
            'currency' => 'PKR',
            'status' => 'pending',
        ]);
    }

    public function test_receiver_cannot_initiate_payment(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $response = $this->actingAs($receiver)->postJson("/api/requests/{$request->request_code}/payment/initiate");

        $response->assertStatus(Response::HTTP_FORBIDDEN)
            ->assertJson([
                'success' => false,
                'error_code' => 'UNAUTHORIZED_PAYMENT_INITIATOR',
            ]);
    }

    public function test_third_party_user_cannot_initiate_payment(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);
        $thirdParty = $this->createVerifiedUser();

        $request = $this->createAcceptedRequest($sender, $receiver);

        $response = $this->actingAs($thirdParty)->postJson("/api/requests/{$request->request_code}/payment/initiate");

        $response->assertStatus(Response::HTTP_FORBIDDEN)
            ->assertJson([
                'success' => false,
                'error_code' => 'UNAUTHORIZED_PAYMENT_INITIATOR',
            ]);
    }

    public function test_cannot_initiate_payment_for_non_accepted_request(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = RishtaRequest::create([
            'request_code' => RishtaRequest::generateUniqueRequestCode(),
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'status' => RishtaRequest::STATUS_PENDING,
            'active_pair_hash' => min($sender->id, $receiver->id) . '_' . max($sender->id, $receiver->id),
        ]);

        $response = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)
            ->assertJson([
                'success' => false,
                'error_code' => 'REQUEST_NOT_ACCEPTED',
            ]);
    }

    public function test_cannot_initiate_duplicate_payment_if_already_paid(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        // Create an existing paid payment
        Payment::create([
            'rishta_request_id' => $request->id,
            'user_id' => $sender->id,
            'amount' => 300.00,
            'currency' => 'PKR',
            'status' => Payment::STATUS_PAID,
            'paid_at' => now(),
            'gateway' => 'fake',
        ]);

        $response = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");

        $response->assertStatus(Response::HTTP_BAD_REQUEST)
            ->assertJson([
                'success' => false,
                'error_code' => 'PAYMENT_ALREADY_COMPLETED',
            ]);
    }

    // =========================================================================
    // 2. PAYMENT VERIFICATION TESTS
    // =========================================================================

    public function test_payment_verification_succeeds_and_creates_contact_unlock(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        // Initiate payment
        $initResponse = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $paymentUuid = $initResponse->json('data.payment_uuid');

        // Verify payment
        $verifyResponse = $this->actingAs($sender)->postJson("/api/payments/{$paymentUuid}/verify", [
            'transaction_reference' => 'FAKE-TXN-123456',
            'status' => 'PAID',
        ]);

        $verifyResponse->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'payment_uuid' => $paymentUuid,
                    'status' => 'paid',
                    'is_paid' => true,
                ],
            ]);

        $payment = Payment::where('payment_uuid', $paymentUuid)->first();
        $this->assertTrue($payment->isPaid());
        $this->assertNotNull($payment->paid_at);

        // Contact unlock row created with payment_id
        $this->assertDatabaseHas('contact_unlocks', [
            'rishta_request_id' => $request->id,
            'payment_id' => $payment->id,
            'unlocked_at' => null,
        ]);
    }

    public function test_payment_verification_is_idempotent(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $initResponse = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $paymentUuid = $initResponse->json('data.payment_uuid');

        // Verify once
        $this->actingAs($sender)->postJson("/api/payments/{$paymentUuid}/verify", [
            'status' => 'PAID',
        ])->assertStatus(Response::HTTP_OK);

        // Verify second time (Idempotent replay)
        $secondResponse = $this->actingAs($sender)->postJson("/api/payments/{$paymentUuid}/verify", [
            'status' => 'PAID',
        ]);

        $secondResponse->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'payment_uuid' => $paymentUuid,
                    'is_paid' => true,
                    'already_verified' => true,
                ],
            ]);

        $this->assertDatabaseCount('contact_unlocks', 1);
    }

    public function test_failed_gateway_verification_marks_payment_failed(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $initResponse = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $paymentUuid = $initResponse->json('data.payment_uuid');

        // Gateway returns failure status
        $verifyResponse = $this->actingAs($sender)->postJson("/api/payments/{$paymentUuid}/verify", [
            'status' => 'FAILED',
            'error_message' => 'Insufficient funds',
        ]);

        $verifyResponse->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)
            ->assertJson([
                'success' => false,
                'error_code' => 'PAYMENT_VERIFICATION_FAILED',
            ]);

        $payment = Payment::where('payment_uuid', $paymentUuid)->first();
        $this->assertEquals(Payment::STATUS_FAILED, $payment->status);
        $this->assertDatabaseMissing('contact_unlocks', [
            'rishta_request_id' => $request->id,
        ]);
    }

    public function test_payment_retry_after_failure_correctly_updates_contact_unlock(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        // Attempt 1 fails
        $init1 = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $paymentUuid1 = $init1->json('data.payment_uuid');
        $this->actingAs($sender)->postJson("/api/payments/{$paymentUuid1}/verify", ['status' => 'FAILED']);

        // Attempt 2 succeeds
        $init2 = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $paymentUuid2 = $init2->json('data.payment_uuid');
        $this->actingAs($sender)->postJson("/api/payments/{$paymentUuid2}/verify", ['status' => 'PAID'])
            ->assertStatus(Response::HTTP_OK);

        $payment2 = Payment::where('payment_uuid', $paymentUuid2)->first();
        $unlock = ContactUnlock::where('rishta_request_id', $request->id)->first();

        $this->assertNotNull($unlock);
        $this->assertEquals($payment2->id, $unlock->payment_id);
    }

    // =========================================================================
    // 3. OTP VERIFICATION & CONTACT UNLOCK TESTS
    // =========================================================================

    public function test_cannot_send_otp_prior_to_payment(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $response = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/send", [
            'phone' => '03001234567',
        ]);

        $response->assertStatus(Response::HTTP_FORBIDDEN)
            ->assertJson([
                'success' => false,
                'error_code' => 'PAYMENT_REQUIRED',
            ]);
    }

    public function test_sender_and_receiver_can_request_otp_after_payment(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        // Pay fee
        $init = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $this->actingAs($sender)->postJson("/api/payments/{$init->json('data.payment_uuid')}/verify", ['status' => 'PAID']);

        // Sender requests OTP
        $resSender = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/send", [
            'phone' => '03001234567',
        ]);

        $resSender->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'phone' => '+923001234567',
                    'cooldown_seconds' => 60,
                ],
            ]);

        $unlock = ContactUnlock::where('rishta_request_id', $request->id)->first();
        $this->assertEquals('+923001234567', $unlock->sender_phone);
        $this->assertNotNull($unlock->sender_otp_hash);

        // Receiver requests OTP
        $resReceiver = $this->actingAs($receiver)->postJson("/api/requests/{$request->request_code}/otp/send", [
            'phone' => '03129876543',
        ]);

        $resReceiver->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'phone' => '+923129876543',
                ],
            ]);

        $unlock->refresh();
        $this->assertEquals('+923129876543', $unlock->receiver_phone);
        $this->assertNotNull($unlock->receiver_otp_hash);
    }

    public function test_otp_resend_cooldown_enforced_at_60_seconds(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $init = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $this->actingAs($sender)->postJson("/api/payments/{$init->json('data.payment_uuid')}/verify", ['status' => 'PAID']);

        // First OTP send
        $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/send", [
            'phone' => '03001234567',
        ])->assertStatus(Response::HTTP_OK);

        // Immediate second OTP send -> 429 Too Many Requests
        $resCooldown = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/send", [
            'phone' => '03001234567',
        ]);

        $resCooldown->assertStatus(Response::HTTP_TOO_MANY_REQUESTS)
            ->assertJson([
                'success' => false,
                'error_code' => 'OTP_COOLDOWN_ACTIVE',
            ]);

        // After 61 seconds -> Allowed
        $this->travel(61)->seconds();

        $resAfter = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/send", [
            'phone' => '03001234567',
        ]);

        $resAfter->assertStatus(Response::HTTP_OK);
    }

    public function test_otp_max_5_failed_attempts_locks_and_returns_429(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $init = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $this->actingAs($sender)->postJson("/api/payments/{$init->json('data.payment_uuid')}/verify", ['status' => 'PAID']);

        // Set known OTP hash
        $unlock = ContactUnlock::where('rishta_request_id', $request->id)->first();
        $unlock->update([
            'sender_phone' => '+923001234567',
            'sender_otp_hash' => Hash::make('654321'),
            'sender_otp_sent_at' => now(),
            'sender_otp_expires_at' => now()->addMinutes(10),
            'sender_otp_attempts' => 0,
        ]);

        // 5 wrong attempts
        for ($i = 1; $i <= 5; $i++) {
            $resp = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/verify", [
                'otp' => '000000',
            ]);
            $resp->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // 6th attempt -> 429 Too Many Requests
        $sixth = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/verify", [
            'otp' => '654321', // even with correct OTP now
        ]);

        $sixth->assertStatus(Response::HTTP_TOO_MANY_REQUESTS)
            ->assertJson([
                'success' => false,
                'error_code' => 'MAX_ATTEMPTS_EXCEEDED',
            ]);
    }

    public function test_full_mutual_otp_flow_unlocks_contact_and_sends_emails(): void
    {
        Notification::fake();

        $sender = $this->createVerifiedUser(['name' => 'Sender User']);
        $senderProfile = $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser(['name' => 'Receiver User']);
        $receiverProfile = $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        // 1. Sender pays fee
        $init = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $this->actingAs($sender)->postJson("/api/payments/{$init->json('data.payment_uuid')}/verify", ['status' => 'PAID']);

        // 2. Setup mock OTPs for both
        $unlock = ContactUnlock::where('rishta_request_id', $request->id)->first();
        $unlock->update([
            'sender_phone' => '+923001111111',
            'sender_otp_hash' => Hash::make('111111'),
            'sender_otp_sent_at' => now(),
            'sender_otp_expires_at' => now()->addMinutes(10),

            'receiver_phone' => '+923002222222',
            'receiver_otp_hash' => Hash::make('222222'),
            'receiver_otp_sent_at' => now(),
            'receiver_otp_expires_at' => now()->addMinutes(10),
        ]);

        // Contact info cannot be viewed before unlock
        $this->actingAs($sender)->getJson("/api/requests/{$request->request_code}/contact")
            ->assertStatus(Response::HTTP_FORBIDDEN)
            ->assertJson(['error_code' => 'CONTACTS_NOT_UNLOCKED']);

        // 3. Sender verifies OTP
        $senderVerify = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/verify", [
            'otp' => '111111',
        ]);

        $senderVerify->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'verified' => true,
                    'is_unlocked' => false,
                ],
            ]);

        // Still not unlocked, no email dispatched yet
        Notification::assertNothingSent();

        // 4. Receiver verifies OTP
        $receiverVerify = $this->actingAs($receiver)->postJson("/api/requests/{$request->request_code}/otp/verify", [
            'otp' => '222222',
        ]);

        $receiverVerify->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'verified' => true,
                    'is_unlocked' => true,
                ],
            ]);

        // Both candidates receive unlock notification
        Notification::assertSentTo($sender, ContactDetailsUnlockedNotification::class);
        Notification::assertSentTo($receiver, ContactDetailsUnlockedNotification::class);

        // 5. Contact Access Verification (Least-Privilege Role Separation)
        // Sender views contact -> Gets receiver's details
        $senderContact = $this->actingAs($sender)->getJson("/api/requests/{$request->request_code}/contact");
        $senderContact->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'profile_code' => $receiverProfile->profile_code,
                    'name' => $receiver->name,
                    'phone' => '+923002222222',
                    'email' => $receiver->email,
                    'whatsapp_url' => 'https://wa.me/923002222222',
                ],
            ]);

        // Receiver views contact -> Gets sender's details
        $receiverContact = $this->actingAs($receiver)->getJson("/api/requests/{$request->request_code}/contact");
        $receiverContact->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'profile_code' => $senderProfile->profile_code,
                    'name' => $sender->name,
                    'phone' => '+923001111111',
                    'email' => $sender->email,
                    'whatsapp_url' => 'https://wa.me/923001111111',
                ],
            ]);

        // Third party denied
        $thirdParty = $this->createVerifiedUser();
        $this->actingAs($thirdParty)->getJson("/api/requests/{$request->request_code}/contact")
            ->assertStatus(Response::HTTP_FORBIDDEN)
            ->assertJson(['error_code' => 'UNAUTHORIZED_REQUEST_ACCESS']);
    }

    // =========================================================================
    // 4. SECURITY & CONCURRENCY AUDIT VERIFICATION TESTS
    // =========================================================================

    public function test_user_cannot_verify_another_users_payment(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);
        $attacker = $this->createVerifiedUser();

        $request = $this->createAcceptedRequest($sender, $receiver);

        // Sender creates payment
        $init = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $paymentUuid = $init->json('data.payment_uuid');

        // Attacker attempts to verify sender's payment
        $attackRes = $this->actingAs($attacker)->postJson("/api/payments/{$paymentUuid}/verify", [
            'status' => 'PAID',
        ]);

        $attackRes->assertStatus(Response::HTTP_FORBIDDEN)
            ->assertJson([
                'success' => false,
                'error_code' => 'UNAUTHORIZED_PAYMENT_ACCESS',
            ]);
    }

    public function test_payment_uuid_cannot_be_used_to_fulfill_another_request(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver1 = $this->createVerifiedUser();
        $this->createActiveProfile($receiver1, ['gender' => 'female']);
        $receiver2 = $this->createVerifiedUser();
        $this->createActiveProfile($receiver2, ['gender' => 'female']);

        $request1 = $this->createAcceptedRequest($sender, $receiver1);
        $request2 = $this->createAcceptedRequest($sender, $receiver2);

        $init = $this->actingAs($sender)->postJson("/api/requests/{$request1->request_code}/payment/initiate");
        $paymentUuid = $init->json('data.payment_uuid');

        // Verify payment
        $this->actingAs($sender)->postJson("/api/payments/{$paymentUuid}/verify", ['status' => 'PAID'])
            ->assertStatus(Response::HTTP_OK);

        // Request 1 has contact unlock
        $this->assertDatabaseHas('contact_unlocks', ['rishta_request_id' => $request1->id]);

        // Request 2 has NOT been unlocked or paid
        $this->assertDatabaseMissing('contact_unlocks', ['rishta_request_id' => $request2->id]);
        $this->actingAs($sender)->postJson("/api/requests/{$request2->request_code}/otp/send", ['phone' => '03001234567'])
            ->assertStatus(Response::HTTP_FORBIDDEN)
            ->assertJson(['error_code' => 'PAYMENT_REQUIRED']);
    }

    public function test_client_cannot_impersonate_roles_in_otp_operations(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $init = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $this->actingAs($sender)->postJson("/api/payments/{$init->json('data.payment_uuid')}/verify", ['status' => 'PAID']);

        // Sender tries to submit payload pretending to be receiver
        $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/send", [
            'phone' => '03009999999',
            'role' => 'receiver',
            'user_id' => $receiver->id,
        ]);

        $unlock = ContactUnlock::where('rishta_request_id', $request->id)->first();
        // Server MUST have mapped it to sender_phone, NOT receiver_phone
        $this->assertEquals('+923009999999', $unlock->sender_phone);
        $this->assertNull($unlock->receiver_phone);
    }

    public function test_resending_otp_invalidates_previous_otp_code(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $init = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $this->actingAs($sender)->postJson("/api/payments/{$init->json('data.payment_uuid')}/verify", ['status' => 'PAID']);

        // First OTP
        $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/send", ['phone' => '03001234567']);
        $unlock = ContactUnlock::where('rishta_request_id', $request->id)->first();
        $oldHash = $unlock->sender_otp_hash;

        // Advance past 60s cooldown
        $this->travel(65)->seconds();

        // Resend OTP
        $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/send", ['phone' => '03001234567']);
        $unlock->refresh();
        $newHash = $unlock->sender_otp_hash;

        $this->assertNotEquals($oldHash, $newHash);
    }

    public function test_otp_hashes_are_never_leaked_in_api_responses(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $init = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $this->actingAs($sender)->postJson("/api/payments/{$init->json('data.payment_uuid')}/verify", ['status' => 'PAID']);

        $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/send", ['phone' => '03001234567']);

        // Check status endpoint response
        $statusRes = $this->actingAs($sender)->getJson("/api/requests/{$request->request_code}/unlock/status");
        $statusJson = $statusRes->getContent();

        $this->assertStringNotContainsString('otp_hash', $statusJson);
        $this->assertStringNotContainsString('sender_otp_hash', $statusJson);
        $this->assertStringNotContainsString('receiver_otp_hash', $statusJson);

        // Check model serialization
        $unlock = ContactUnlock::where('rishta_request_id', $request->id)->first();
        $serialized = json_encode($unlock->toArray());
        $this->assertStringNotContainsString('sender_otp_hash', $serialized);
        $this->assertStringNotContainsString('receiver_otp_hash', $serialized);
    }

    public function test_used_otp_cannot_be_reused(): void
    {
        $sender = $this->createVerifiedUser();
        $this->createActiveProfile($sender, ['gender' => 'male']);
        $receiver = $this->createVerifiedUser();
        $this->createActiveProfile($receiver, ['gender' => 'female']);

        $request = $this->createAcceptedRequest($sender, $receiver);

        $init = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/payment/initiate");
        $this->actingAs($sender)->postJson("/api/payments/{$init->json('data.payment_uuid')}/verify", ['status' => 'PAID']);

        $unlock = ContactUnlock::where('rishta_request_id', $request->id)->first();
        $unlock->update([
            'sender_phone' => '+923001234567',
            'sender_otp_hash' => Hash::make('444444'),
            'sender_otp_sent_at' => now(),
            'sender_otp_expires_at' => now()->addMinutes(10),
        ]);

        // First verification succeeds
        $res1 = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/verify", [
            'otp' => '444444',
        ]);
        $res1->assertStatus(Response::HTTP_OK);

        // Reusing same OTP immediately -> ALREADY_VERIFIED
        $res2 = $this->actingAs($sender)->postJson("/api/requests/{$request->request_code}/otp/verify", [
            'otp' => '444444',
        ]);
        $res2->assertStatus(Response::HTTP_BAD_REQUEST)
            ->assertJson(['error_code' => 'ALREADY_VERIFIED']);
    }
}

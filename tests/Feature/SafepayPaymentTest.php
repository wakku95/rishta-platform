<?php

namespace Tests\Feature;

use App\Models\ContactUnlock;
use App\Models\Payment;
use App\Models\Profile;
use App\Models\RishtaRequest;
use App\Models\User;
use App\Services\Payments\SafepayPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class SafepayPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'payment.default' => 'safepay',
            'payment.gateways.safepay.public_key' => 'sec_test_public_key',
            'payment.gateways.safepay.secret_key' => 'secret_test_key_1234567890',
            'payment.gateways.safepay.webhook_secret' => 'secret_test_key_1234567890',
            'payment.gateways.safepay.environment' => 'sandbox',
            'payment.gateways.safepay.base_url' => 'https://sandbox.api.getsafepay.com',
            'payment.gateways.safepay.checkout_url' => 'https://sandbox.api.getsafepay.com/checkout/pay',
        ]);
    }

    protected function createVerifiedUser(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'status' => 'active',
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

    public function test_safepay_service_initiates_payment_and_returns_checkout_url(): void
    {
        $mockTracker = 'track_test_123456abcdef';

        Http::fake([
            'https://sandbox.api.getsafepay.com/order/v1/init' => Http::response([
                'data' => [
                    'token' => $mockTracker,
                    'amount' => 300,
                    'currency' => 'PKR',
                    'state' => 'TRACKER_STARTED',
                ],
                'status' => ['message' => 'success'],
            ], 200),
        ]);

        $service = new SafepayPaymentService();
        $response = $service->initiatePayment('payment-uuid-123', 300.0, 'PKR', [
            'request_code' => 'REQ-ABC',
        ]);

        $this->assertEquals($mockTracker, $response['transaction_reference']);
        $this->assertEquals('safepay', $response['provider']);
        $this->assertStringContainsString('https://sandbox.api.getsafepay.com/checkout/pay', $response['redirect_url']);
        $this->assertStringContainsString("beacon={$mockTracker}", $response['redirect_url']);
        $this->assertStringContainsString('order_id=payment-uuid-123', $response['redirect_url']);
    }

    public function test_api_initiates_safepay_payment_for_accepted_request(): void
    {
        $mockTracker = 'track_api_test_789';

        Http::fake([
            'https://sandbox.api.getsafepay.com/order/v1/init' => Http::response([
                'data' => [
                    'token' => $mockTracker,
                    'amount' => 300,
                    'currency' => 'PKR',
                    'state' => 'TRACKER_STARTED',
                ],
                'status' => ['message' => 'success'],
            ], 200),
        ]);

        $sender = $this->createVerifiedUser();
        $receiver = $this->createVerifiedUser();
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
                    'gateway' => 'safepay',
                    'transaction_reference' => $mockTracker,
                ],
            ]);

        $this->assertDatabaseHas('payments', [
            'rishta_request_id' => $request->id,
            'user_id' => $sender->id,
            'transaction_reference' => $mockTracker,
            'gateway' => 'safepay',
            'status' => 'pending',
        ]);
    }

    public function test_safepay_webhook_verifies_signature_and_marks_payment_paid(): void
    {
        $sender = $this->createVerifiedUser();
        $receiver = $this->createVerifiedUser();
        $request = $this->createAcceptedRequest($sender, $receiver);

        $payment = Payment::create([
            'rishta_request_id' => $request->id,
            'user_id' => $sender->id,
            'amount' => 300.00,
            'currency' => 'PKR',
            'status' => Payment::STATUS_PENDING,
            'gateway' => 'safepay',
            'transaction_reference' => 'track_webhook_test_111',
        ]);

        $tracker = 'track_webhook_test_111';
        $signature = hash_hmac('sha256', $tracker, 'secret_test_key_1234567890');

        $response = $this->postJson('/api/payments/safepay/webhook', [
            'tracker' => $tracker,
            'sig' => $signature,
            'order_id' => $payment->payment_uuid,
        ]);

        $response->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'status' => 'success',
            ]);

        $payment->refresh();
        $this->assertTrue($payment->isPaid());
        $this->assertNotNull($payment->paid_at);

        $this->assertDatabaseHas('contact_unlocks', [
            'rishta_request_id' => $request->id,
            'payment_id' => $payment->id,
        ]);
    }

    public function test_safepay_webhook_rejects_invalid_signature(): void
    {
        $sender = $this->createVerifiedUser();
        $receiver = $this->createVerifiedUser();
        $request = $this->createAcceptedRequest($sender, $receiver);

        $payment = Payment::create([
            'rishta_request_id' => $request->id,
            'user_id' => $sender->id,
            'amount' => 300.00,
            'currency' => 'PKR',
            'status' => Payment::STATUS_PENDING,
            'gateway' => 'safepay',
            'transaction_reference' => 'track_bad_sig_222',
        ]);

        // Fake direct status query to return failure as well
        Http::fake([
            'https://sandbox.api.getsafepay.com/order/v1/*' => Http::response([
                'data' => ['state' => 'TRACKER_STARTED'],
            ], 200),
        ]);

        $response = $this->postJson('/api/payments/safepay/webhook', [
            'tracker' => 'track_bad_sig_222',
            'sig' => 'invalid_forged_signature',
            'order_id' => $payment->payment_uuid,
        ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);

        $payment->refresh();
        $this->assertEquals(Payment::STATUS_FAILED, $payment->status);
    }

    public function test_safepay_browser_callback_verifies_and_redirects_to_dashboard(): void
    {
        $sender = $this->createVerifiedUser();
        $receiver = $this->createVerifiedUser();
        $request = $this->createAcceptedRequest($sender, $receiver);

        $payment = Payment::create([
            'rishta_request_id' => $request->id,
            'user_id' => $sender->id,
            'amount' => 300.00,
            'currency' => 'PKR',
            'status' => Payment::STATUS_PENDING,
            'gateway' => 'safepay',
            'transaction_reference' => 'track_callback_333',
        ]);

        $tracker = 'track_callback_333';
        $signature = hash_hmac('sha256', $tracker, 'secret_test_key_1234567890');

        $response = $this->get("/payments/{$payment->payment_uuid}/safepay/callback?tracker={$tracker}&sig={$signature}");

        $response->assertRedirect();
        $this->assertStringContainsString('payment=success', $response->headers->get('Location'));
        $this->assertStringContainsString("request={$request->request_code}", $response->headers->get('Location'));

        $payment->refresh();
        $this->assertTrue($payment->isPaid());
    }

    public function test_safepay_query_status_verifies_payment_when_state_is_tracker_ended(): void
    {
        $mockTracker = 'track_completed_444';

        Http::fake([
            "https://sandbox.api.getsafepay.com/order/v1/{$mockTracker}" => Http::response([
                'data' => [
                    'token' => $mockTracker,
                    'amount' => 300,
                    'currency' => 'PKR',
                    'state' => 'TRACKER_ENDED',
                ],
                'status' => ['message' => 'success'],
            ], 200),
        ]);

        $service = new SafepayPaymentService();
        $result = $service->queryPaymentStatus($mockTracker);

        $this->assertTrue($result->isSuccessful);
        $this->assertEquals('PAID', $result->gatewayStatus);
        $this->assertEquals($mockTracker, $result->transactionReference);
    }
}

<?php

namespace Tests\Feature;

use App\Models\ContactUnlock;
use App\Models\Payment;
use App\Models\Profile;
use App\Models\RishtaRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class ManualPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected User $sender;
    protected User $receiver;
    protected User $admin;
    protected RishtaRequest $rishtaRequest;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->sender = User::factory()->create([
            'email_verified_at' => now(),
            'status' => 'active',
            'role' => 'user',
        ]);

        $this->receiver = User::factory()->create([
            'email_verified_at' => now(),
            'status' => 'active',
            'role' => 'user',
        ]);

        $this->admin = User::factory()->create([
            'email_verified_at' => now(),
            'status' => 'active',
            'role' => 'admin',
        ]);

        Profile::create([
            'user_id' => $this->sender->id,
            'gender' => 'male',
            'date_of_birth' => '1995-05-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => 'Masters',
            'profession' => 'Engineer',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'self',
            'profile_status' => 'active',
        ]);

        Profile::create([
            'user_id' => $this->receiver->id,
            'gender' => 'female',
            'date_of_birth' => '1998-05-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Karachi',
            'education' => 'Bachelors',
            'profession' => 'Doctor',
            'marital_status' => 'never_married',
            'height' => 165,
            'managed_by' => 'self',
            'profile_status' => 'active',
        ]);

        $this->rishtaRequest = RishtaRequest::create([
            'request_code' => RishtaRequest::generateUniqueRequestCode(),
            'sender_id' => $this->sender->id,
            'receiver_id' => $this->receiver->id,
            'status' => RishtaRequest::STATUS_ACCEPTED,
            'accepted_at' => now(),
            'expires_at' => now()->addDays(14),
            'active_pair_hash' => min($this->sender->id, $this->receiver->id) . '_' . max($this->sender->id, $this->receiver->id),
        ]);
    }

    public function test_sender_can_submit_valid_jazzcash_payment_proof(): void
    {
        $file = UploadedFile::fake()->create('receipt.jpg', 1500, 'image/jpeg');

        $response = $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '012345678901',
                'receipt' => $file,
            ]);

        $response->assertStatus(Response::HTTP_CREATED)
            ->assertJson([
                'success' => true,
                'data' => [
                    'gateway' => 'jazzcash_qr',
                    'status' => Payment::STATUS_PENDING,
                    'transaction_reference' => '012345678901',
                ],
            ]);

        $this->assertDatabaseHas('payments', [
            'rishta_request_id' => $this->rishtaRequest->id,
            'user_id' => $this->sender->id,
            'gateway' => 'jazzcash_qr',
            'status' => Payment::STATUS_PENDING,
            'transaction_reference' => '012345678901',
        ]);

        $payment = Payment::first();
        Storage::disk('local')->assertExists($payment->receipt_path);
    }

    public function test_receiver_cannot_submit_payment_proof(): void
    {
        $file = UploadedFile::fake()->create('receipt.jpg', 500, 'image/jpeg');

        $response = $this->actingAs($this->receiver)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '012345678901',
                'receipt' => $file,
            ]);

        $response->assertStatus(Response::HTTP_FORBIDDEN);
    }

    public function test_invalid_tid_format_is_rejected(): void
    {
        $file = UploadedFile::fake()->create('receipt.jpg', 500, 'image/jpeg');

        // Letters in TID
        $res1 = $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => 'INVALID_TID',
                'receipt' => $file,
            ]);
        $res1->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);

        // Less than 10 digits
        $res2 = $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '12345',
                'receipt' => $file,
            ]);
        $res2->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public function test_duplicate_tid_submission_is_rejected(): void
    {
        $file1 = UploadedFile::fake()->create('receipt1.jpg', 500, 'image/jpeg');
        $file2 = UploadedFile::fake()->create('receipt2.jpg', 500, 'image/jpeg');

        $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '012345678901',
                'receipt' => $file1,
            ]);

        // Second submission with same TID
        $response = $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '012345678901',
                'receipt' => $file2,
            ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public function test_unlock_status_reflects_pending_manual_payment(): void
    {
        $file = UploadedFile::fake()->create('receipt.jpg', 500, 'image/jpeg');
        $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '012345678901',
                'receipt' => $file,
            ]);

        $statusRes = $this->actingAs($this->sender)
            ->getJson("/api/requests/{$this->rishtaRequest->request_code}/unlock/status");

        $statusRes->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'is_paid' => false,
                    'pending_payment' => [
                        'transaction_reference' => '012345678901',
                    ],
                ],
            ]);
    }

    public function test_admin_can_view_receipt_stream_and_non_admin_is_forbidden(): void
    {
        $file = UploadedFile::fake()->create('receipt.jpg', 500, 'image/jpeg');
        $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '012345678901',
                'receipt' => $file,
            ]);

        $payment = Payment::first();

        // Regular user access -> 403
        $this->actingAs($this->sender)
            ->get("/api/admin/payments/{$payment->id}/receipt")
            ->assertStatus(Response::HTTP_FORBIDDEN);

        // Admin access -> 200 Stream
        $adminRes = $this->actingAs($this->admin)
            ->get("/api/admin/payments/{$payment->id}/receipt");

        $adminRes->assertStatus(Response::HTTP_OK);
    }

    public function test_admin_can_approve_payment_and_unlock_phone_verification(): void
    {
        $file = UploadedFile::fake()->create('receipt.jpg', 500, 'image/jpeg');
        $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '012345678901',
                'receipt' => $file,
            ]);

        $payment = Payment::first();

        // Admin approves
        $approveRes = $this->actingAs($this->admin)
            ->postJson("/api/admin/payments/{$payment->id}/approve");

        $approveRes->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => Payment::STATUS_PAID,
                ],
            ]);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => Payment::STATUS_PAID,
            'reviewed_by' => $this->admin->id,
        ]);

        $this->assertDatabaseHas('contact_unlocks', [
            'rishta_request_id' => $this->rishtaRequest->id,
            'payment_id' => $payment->id,
        ]);

        // Status now reports is_paid = true
        $statusRes = $this->actingAs($this->sender)
            ->getJson("/api/requests/{$this->rishtaRequest->request_code}/unlock/status");

        $statusRes->assertJson([
            'data' => [
                'is_paid' => true,
                'pending_payment' => null,
            ],
        ]);
    }

    public function test_admin_can_reject_payment_with_reason(): void
    {
        $file = UploadedFile::fake()->create('receipt.jpg', 500, 'image/jpeg');
        $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '012345678901',
                'receipt' => $file,
            ]);

        $payment = Payment::first();

        // Admin rejects
        $rejectRes = $this->actingAs($this->admin)
            ->postJson("/api/admin/payments/{$payment->id}/reject", [
                'reason' => 'TID not found in JazzCash merchant statement.',
            ]);

        $rejectRes->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => Payment::STATUS_FAILED,
                    'admin_notes' => 'TID not found in JazzCash merchant statement.',
                ],
            ]);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => Payment::STATUS_FAILED,
            'admin_notes' => 'TID not found in JazzCash merchant statement.',
            'reviewed_by' => $this->admin->id,
        ]);

        // User can see rejected status & reason in unlock status
        $statusRes = $this->actingAs($this->sender)
            ->getJson("/api/requests/{$this->rishtaRequest->request_code}/unlock/status");

        $statusRes->assertJson([
            'data' => [
                'is_paid' => false,
                'rejected_payment' => [
                    'transaction_reference' => '012345678901',
                    'admin_notes' => 'TID not found in JazzCash merchant statement.',
                ],
            ],
        ]);
    }

    public function test_admin_cannot_delete_receipt_for_pending_payment(): void
    {
        $file = UploadedFile::fake()->create('receipt.jpg', 500, 'image/jpeg');
        $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '012345678901',
                'receipt' => $file,
            ]);

        $payment = Payment::first();
        $filePath = $payment->receipt_path;
        Storage::disk('local')->assertExists($filePath);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/payments/{$payment->id}/receipt");

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)
            ->assertJson([
                'success' => false,
                'error_code' => 'CANNOT_DELETE_PENDING_RECEIPT',
            ]);

        // File must NOT be deleted
        Storage::disk('local')->assertExists($filePath);
    }

    public function test_admin_can_delete_receipt_for_resolved_payment_and_free_storage(): void
    {
        $file = UploadedFile::fake()->create('receipt.jpg', 500, 'image/jpeg');
        $this->actingAs($this->sender)
            ->postJson("/api/requests/{$this->rishtaRequest->request_code}/payment/submit-proof", [
                'transaction_reference' => '012345678901',
                'receipt' => $file,
            ]);

        $payment = Payment::first();
        $filePath = $payment->receipt_path;

        // First approve the payment
        $this->actingAs($this->admin)
            ->postJson("/api/admin/payments/{$payment->id}/approve");

        $payment->refresh();
        $this->assertEquals(Payment::STATUS_PAID, $payment->status);

        // Non-admin attempt is forbidden
        $this->actingAs($this->sender)
            ->deleteJson("/api/admin/payments/{$payment->id}/receipt")
            ->assertStatus(Response::HTTP_FORBIDDEN);

        // Admin deletes receipt to save disk space
        $deleteRes = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/payments/{$payment->id}/receipt");

        $deleteRes->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $payment->id,
                    'receipt_path' => null,
                ],
            ]);

        $payment->refresh();
        // Payment status & transaction reference must remain completely intact
        $this->assertEquals(Payment::STATUS_PAID, $payment->status);
        $this->assertEquals('012345678901', $payment->transaction_reference);
        $this->assertNull($payment->receipt_path);

        // Physical file must be removed from storage
        Storage::disk('local')->assertMissing($filePath);
    }
}

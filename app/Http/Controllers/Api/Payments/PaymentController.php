<?php

namespace App\Http\Controllers\Api\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Http\Controllers\Controller;
use App\Models\ContactUnlock;
use App\Models\Payment;
use App\Models\RishtaRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class PaymentController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PaymentGatewayInterface $gateway
    ) {}

    /**
     * Initiate contact unlock fee payment for an accepted Rishta Request.
     * Strictly restricted to the original request sender.
     */
    public function initiate(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::query()
            ->where('request_code', $request_code)
            ->first();

        if (!$rishtaRequest) {
            return $this->errorResponse(
                'The requested Rishta connection was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'REQUEST_NOT_FOUND'
            );
        }

        // Must be in ACCEPTED state
        if ($rishtaRequest->status !== RishtaRequest::STATUS_ACCEPTED) {
            return $this->errorResponse(
                "Payment cannot be initiated for a request with status '{$rishtaRequest->status}'. Request must be accepted.",
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'REQUEST_NOT_ACCEPTED'
            );
        }

        // Strict Authorization: Sender only
        if ($user->id !== $rishtaRequest->sender_id) {
            return $this->errorResponse(
                'Only the original request sender is authorized to pay the contact unlock fee.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_PAYMENT_INITIATOR'
            );
        }

        // Check if already paid or unlocked
        $alreadyPaid = Payment::where('rishta_request_id', $rishtaRequest->id)
            ->where('status', Payment::STATUS_PAID)
            ->where(function ($q) {
                $q->whereNull('purpose')->orWhere('purpose', 'contact_unlock');
            })
            ->exists();

        if ($alreadyPaid || $rishtaRequest->contactUnlock?->unlocked_at) {
            return $this->errorResponse(
                'Contact unlock fee has already been paid for this connection.',
                [],
                Response::HTTP_BAD_REQUEST,
                'PAYMENT_ALREADY_COMPLETED'
            );
        }

        $fee = (float) config('payment.contact_unlock_fee', 2500.00);
        $currency = config('payment.currency', 'PKR');
        $gatewayName = config('payment.default', 'fake');

        // Create pending payment attempt
        $payment = Payment::create([
            'rishta_request_id' => $rishtaRequest->id,
            'user_id' => $user->id,
            'amount' => $fee,
            'currency' => $currency,
            'purpose' => 'contact_unlock',
            'status' => Payment::STATUS_PENDING,
            'gateway' => $gatewayName,
        ]);

        $gatewayResponse = $this->gateway->initiatePayment(
            $payment->payment_uuid,
            $fee,
            $currency,
            [
                'request_code' => $rishtaRequest->request_code,
                'user_id' => $user->id,
            ]
        );

        if (!empty($gatewayResponse['transaction_reference'])) {
            $payment->update([
                'transaction_reference' => $gatewayResponse['transaction_reference'],
            ]);
        }

        return $this->successResponse([
            'payment_uuid' => $payment->payment_uuid,
            'request_code' => $rishtaRequest->request_code,
            'amount' => $fee,
            'currency' => $currency,
            'status' => $payment->status,
            'gateway' => $gatewayName,
            'redirect_url' => $gatewayResponse['redirect_url'] ?? null,
            'transaction_reference' => $gatewayResponse['transaction_reference'] ?? null,
        ], 'Payment initiated successfully.', Response::HTTP_CREATED);
    }

    /**
     * Verify payment status with the gateway and confirm payment.
     * Idempotent: Can be called multiple times without duplicate side effects.
     */
    public function verify(Request $request, string $payment_uuid): JsonResponse
    {
        $user = $request->user();

        $payment = Payment::query()
            ->where('payment_uuid', $payment_uuid)
            ->with('rishtaRequest')
            ->first();

        if (!$payment) {
            return $this->errorResponse(
                'The specified payment was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'PAYMENT_NOT_FOUND'
            );
        }

        // Authorization: Payer must own this payment
        if ($user->id !== $payment->user_id) {
            return $this->errorResponse(
                'You are not authorized to verify this payment.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_PAYMENT_ACCESS'
            );
        }

        // 1. Idempotency check: If already paid, return success immediately
        if ($payment->isPaid()) {
            return $this->successResponse([
                'payment_uuid' => $payment->payment_uuid,
                'status' => Payment::STATUS_PAID,
                'is_paid' => true,
                'paid_at' => $payment->paid_at?->toIso8601String(),
                'already_verified' => true,
            ], 'Payment already verified and paid.');
        }

        // 2. Server-side Gateway Verification
        if (!$request->has('tracker') && !empty($payment->transaction_reference)) {
            $request->merge(['tracker' => $payment->transaction_reference]);
        }

        $result = $this->gateway->verifyWebhook($request);

        if (!$result->isSuccessful) {
            $payment->update([
                'status' => Payment::STATUS_FAILED,
                'gateway_response' => $result->rawResponse,
            ]);

            return $this->errorResponse(
                $result->errorMessage ?: 'Payment verification failed at gateway.',
                ['gateway_status' => $result->gatewayStatus],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'PAYMENT_VERIFICATION_FAILED'
            );
        }

        // 3. Payment-Success Invariants Enforcement
        $isPhotoPayment = ($payment->purpose === 'photo_unlock');
        $expectedFee = $isPhotoPayment 
            ? (float) ($payment->rishtaRequest?->photo_fee ?? 300.00)
            : (float) config('payment.contact_unlock_fee', 2500.00);

        if ((float) $payment->amount !== $expectedFee || $payment->currency !== 'PKR') {
            return $this->errorResponse(
                'Payment amount or currency mismatch.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_PAYMENT_AMOUNT'
            );
        }

        $rishtaRequest = $payment->rishtaRequest;
        if (!$rishtaRequest || $rishtaRequest->status !== RishtaRequest::STATUS_ACCEPTED) {
            return $this->errorResponse(
                'Payment request invariant validation failed.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_PAYMENT_TARGET'
            );
        }

        // 4. Atomic Transaction with Concurrency Locks:
        // Ensures no race condition where two simultaneous verify calls mark multiple payments paid
        $alreadyHandled = false;

        DB::transaction(function () use ($payment, $result, $isPhotoPayment, &$alreadyHandled) {
            // Lock payment record for update
            $lockedPayment = Payment::where('id', $payment->id)->lockForUpdate()->first();

            if ($lockedPayment->isPaid()) {
                $alreadyHandled = true;
                return;
            }

            // Lock request's payment to ensure atomic association
            $existingPaidForRequest = Payment::where('rishta_request_id', $lockedPayment->rishta_request_id)
                ->where('purpose', $lockedPayment->purpose ?? 'contact_unlock')
                ->where('status', Payment::STATUS_PAID)
                ->where('id', '!=', $lockedPayment->id)
                ->lockForUpdate()
                ->exists();

            if ($existingPaidForRequest) {
                // Another concurrent verification already succeeded for this request!
                $lockedPayment->update([
                    'status' => Payment::STATUS_FAILED,
                    'gateway_response' => array_merge($result->rawResponse, ['failure_reason' => 'DUPLICATE_PAYMENT_FOR_REQUEST']),
                ]);
                $alreadyHandled = 'duplicate_request_paid';
                return;
            }

            $lockedPayment->update([
                'status' => Payment::STATUS_PAID,
                'paid_at' => now(),
                'transaction_reference' => $result->transactionReference ?: $lockedPayment->transaction_reference,
                'gateway_response' => $result->rawResponse,
            ]);

            if ($isPhotoPayment) {
                $req = $lockedPayment->rishtaRequest;
                if ($req) {
                    $isSender = ($lockedPayment->user_id === $req->sender_id);
                    $req->update([
                        'photo_paid' => true,
                        'photo_paid_at' => now(),
                        'photo_paid_by' => $lockedPayment->user_id,
                        'sender_photo_paid' => $isSender ? true : $req->sender_photo_paid,
                        'sender_photo_paid_at' => $isSender ? now() : $req->sender_photo_paid_at,
                        'receiver_photo_paid' => !$isSender ? true : $req->receiver_photo_paid,
                        'receiver_photo_paid_at' => !$isSender ? now() : $req->receiver_photo_paid_at,
                    ]);
                }
            } else {
                // Update or create the ContactUnlock record pointing to this successful payment
                ContactUnlock::updateOrCreate(
                    ['rishta_request_id' => $lockedPayment->rishta_request_id],
                    ['payment_id' => $lockedPayment->id]
                );
            }
        });

        if ($alreadyHandled === 'duplicate_request_paid') {
            return $this->errorResponse(
                'A payment has already been completed for this Rishta request.',
                [],
                Response::HTTP_CONFLICT,
                'DUPLICATE_PAYMENT_FOR_REQUEST'
            );
        }

        $freshPayment = $payment->fresh();

        return $this->successResponse([
            'payment_uuid' => $freshPayment->payment_uuid,
            'status' => Payment::STATUS_PAID,
            'is_paid' => true,
            'paid_at' => $freshPayment->paid_at?->toIso8601String(),
            'already_verified' => (bool) $alreadyHandled,
        ], 'Payment successfully verified. You may now proceed to phone verification.');
    }

    /**
     * Safepay Webhook endpoint.
     * Receives asynchronous server-to-server notifications from Safepay.
     */
    public function safepayWebhook(Request $request): JsonResponse
    {
        $tracker = $request->input('tracker')
            ?? $request->input('beacon')
            ?? $request->input('token')
            ?? $request->input('data.token')
            ?? '';

        $orderId = $request->input('order_id')
            ?? $request->input('data.metadata.order_id')
            ?? '';

        $payment = null;
        if ($orderId) {
            $payment = Payment::where('payment_uuid', $orderId)->first();
        }
        if (!$payment && $tracker) {
            $payment = Payment::where('transaction_reference', $tracker)->first();
        }

        if (!$payment) {
            return $this->errorResponse('Payment record not found for webhook notification.', [], Response::HTTP_NOT_FOUND, 'PAYMENT_NOT_FOUND');
        }

        if ($payment->isPaid()) {
            return response()->json(['status' => 'success', 'message' => 'Payment already marked paid.']);
        }

        $result = $this->gateway->verifyWebhook($request);

        if (!$result->isSuccessful) {
            $payment->update([
                'status' => Payment::STATUS_FAILED,
                'gateway_response' => $result->rawResponse,
            ]);

            return $this->errorResponse('Safepay webhook signature or status verification failed.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'VERIFICATION_FAILED');
        }

        DB::transaction(function () use ($payment, $result) {
            $lockedPayment = Payment::where('id', $payment->id)->lockForUpdate()->first();
            if ($lockedPayment->isPaid()) {
                return;
            }

            $lockedPayment->update([
                'status' => Payment::STATUS_PAID,
                'paid_at' => now(),
                'transaction_reference' => $result->transactionReference ?: $lockedPayment->transaction_reference,
                'gateway_response' => $result->rawResponse,
            ]);

            ContactUnlock::updateOrCreate(
                ['rishta_request_id' => $lockedPayment->rishta_request_id],
                ['payment_id' => $lockedPayment->id]
            );
        });

        return response()->json(['status' => 'success', 'message' => 'Payment verified and marked paid via webhook.']);
    }

    /**
     * Safepay Browser Redirect Callback.
     * Safepay returns user to this web endpoint after checkout completion.
     */
    public function safepayCallback(Request $request, string $payment_uuid)
    {
        $payment = Payment::query()
            ->where('payment_uuid', $payment_uuid)
            ->with('rishtaRequest')
            ->first();

        $frontendUrl = rtrim(config('app.frontend_url', config('app.url', 'https://raabtanow.com')), '/');

        if (!$payment) {
            return redirect("{$frontendUrl}/requests?payment=not_found");
        }

        $requestCode = $payment->rishtaRequest?->request_code ?? '';

        if ($payment->isPaid()) {
            return redirect("{$frontendUrl}/requests?request={$requestCode}&payment=success");
        }

        if (!$request->has('tracker') && !empty($payment->transaction_reference)) {
            $request->merge(['tracker' => $payment->transaction_reference]);
        }

        $result = $this->gateway->verifyWebhook($request);

        if (!$result->isSuccessful) {
            $payment->update([
                'status' => Payment::STATUS_FAILED,
                'gateway_response' => $result->rawResponse,
            ]);

            return redirect("{$frontendUrl}/requests?request={$requestCode}&payment=failed");
        }

        DB::transaction(function () use ($payment, $result) {
            $lockedPayment = Payment::where('id', $payment->id)->lockForUpdate()->first();
            if ($lockedPayment->isPaid()) {
                return;
            }

            $lockedPayment->update([
                'status' => Payment::STATUS_PAID,
                'paid_at' => now(),
                'transaction_reference' => $result->transactionReference ?: $lockedPayment->transaction_reference,
                'gateway_response' => $result->rawResponse,
            ]);

            ContactUnlock::updateOrCreate(
                ['rishta_request_id' => $lockedPayment->rishta_request_id],
                ['payment_id' => $lockedPayment->id]
            );
        });

        return redirect("{$frontendUrl}/requests?request={$requestCode}&payment=success");
    }

    /**
     * Submit manual JazzCash payment proof (TID + Receipt) for admin verification.
     * Strictly restricted to the original request sender.
     */
    public function submitManualProof(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::query()
            ->where('request_code', $request_code)
            ->first();

        if (!$rishtaRequest) {
            return $this->errorResponse(
                'The requested Rishta connection was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'REQUEST_NOT_FOUND'
            );
        }

        // Must be in ACCEPTED state
        if ($rishtaRequest->status !== RishtaRequest::STATUS_ACCEPTED) {
            return $this->errorResponse(
                "Payment cannot be submitted for a request with status '{$rishtaRequest->status}'. Request must be accepted.",
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'REQUEST_NOT_ACCEPTED'
            );
        }

        // Strict Authorization: Sender only
        if ($user->id !== $rishtaRequest->sender_id) {
            return $this->errorResponse(
                'Only the original request sender is authorized to submit payment proof.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_PAYMENT_INITIATOR'
            );
        }

        // Check if already paid or unlocked
        $alreadyPaid = Payment::where('rishta_request_id', $rishtaRequest->id)
            ->where('status', Payment::STATUS_PAID)
            ->where(function ($q) {
                $q->whereNull('purpose')->orWhere('purpose', 'contact_unlock');
            })
            ->exists();

        if ($alreadyPaid || $rishtaRequest->contactUnlock?->unlocked_at) {
            return $this->errorResponse(
                'Contact unlock fee has already been paid for this connection.',
                [],
                Response::HTTP_BAD_REQUEST,
                'PAYMENT_ALREADY_COMPLETED'
            );
        }

        // Check if proof is already pending review
        $pendingPayment = Payment::where('rishta_request_id', $rishtaRequest->id)
            ->where('gateway', 'jazzcash_qr')
            ->where('status', Payment::STATUS_PENDING)
            ->where(function ($q) {
                $q->whereNull('purpose')->orWhere('purpose', 'contact_unlock');
            })
            ->first();

        if ($pendingPayment) {
            return $this->errorResponse(
                'A payment proof has already been submitted and is currently pending admin verification.',
                ['payment_uuid' => $pendingPayment->payment_uuid],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'PAYMENT_PROOF_ALREADY_PENDING'
            );
        }

        $request->validate([
            'transaction_reference' => [
                'required',
                'string',
                'min:6',
                'max:35',
                'regex:/^[A-Za-z0-9\-_]+$/',
            ],
            'receipt' => [
                'required',
                'file',
                'mimes:jpeg,png,jpg,webp,pdf',
                'max:5120', // 5MB
            ],
        ], [
            'transaction_reference.regex' => 'The Transaction Reference must contain only letters, numbers, hyphens, or underscores (6 to 35 characters).',
            'transaction_reference.min' => 'The Transaction Reference must be at least 6 characters.',
            'transaction_reference.max' => 'The Transaction Reference may not be greater than 35 characters.',
            'receipt.mimes' => 'Receipt must be an image (JPG, PNG, WebP) or PDF document.',
            'receipt.max' => 'Receipt file size must not exceed 5MB.',
        ]);

        $tid = trim($request->input('transaction_reference'));

        // Prevent reuse of existing active/paid transaction IDs
        $duplicateTid = Payment::where('transaction_reference', $tid)
            ->whereIn('status', [Payment::STATUS_PAID, Payment::STATUS_PENDING])
            ->exists();

        if ($duplicateTid) {
            return $this->errorResponse(
                'This Transaction ID has already been submitted or processed. Please provide a valid transaction reference.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'DUPLICATE_TRANSACTION_ID'
            );
        }

        // Securely store receipt in private storage disk
        $receiptPath = $request->file('receipt')->store('receipts', 'local');

        $fee = (float) config('payment.contact_unlock_fee', 2500.00);
        $currency = config('payment.currency', 'PKR');

        $payment = Payment::create([
            'rishta_request_id' => $rishtaRequest->id,
            'user_id' => $user->id,
            'amount' => $fee,
            'currency' => $currency,
            'purpose' => 'contact_unlock',
            'status' => Payment::STATUS_PENDING,
            'gateway' => 'jazzcash_qr',
            'transaction_reference' => $tid,
            'receipt_path' => $receiptPath,
        ]);

        return $this->successResponse([
            'payment_uuid' => $payment->payment_uuid,
            'request_code' => $rishtaRequest->request_code,
            'amount' => $fee,
            'currency' => $currency,
            'status' => $payment->status,
            'gateway' => 'jazzcash_qr',
            'transaction_reference' => $tid,
            'created_at' => $payment->created_at->toIso8601String(),
        ], 'Payment proof submitted successfully. Pending admin verification.', Response::HTTP_CREATED);
    }

    /**
     * Initiate private photo unlock payment for an accepted Rishta Request.
     * Candidate's photo must have been uploaded AND approved by administrator moderation.
     */
    public function initiatePhotoPayment(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::query()
            ->where('request_code', $request_code)
            ->first();

        if (!$rishtaRequest) {
            return $this->errorResponse('The requested Rishta connection was not found.', [], Response::HTTP_NOT_FOUND, 'REQUEST_NOT_FOUND');
        }

        if ($user->id !== $rishtaRequest->sender_id && $user->id !== $rishtaRequest->receiver_id) {
            return $this->errorResponse('Unauthorized.', [], Response::HTTP_FORBIDDEN, 'UNAUTHORIZED_ACTION');
        }

        // Verify candidate photo exists
        $candidatePhoto = ($user->id === $rishtaRequest->sender_id)
            ? $rishtaRequest->receiver_photo_path
            : $rishtaRequest->sender_photo_path;

        if (empty($candidatePhoto)) {
            return $this->errorResponse(
                'Candidate has not uploaded a photo yet.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'NO_PHOTO_UPLOADED'
            );
        }

        // Quality Moderation Gate: Admin must approve candidate photo first before user pays!
        $isSender = ($user->id === $rishtaRequest->sender_id);
        $candModStatus = $isSender 
            ? ($rishtaRequest->receiver_photo_moderation_status !== 'none' ? $rishtaRequest->receiver_photo_moderation_status : $rishtaRequest->photo_moderation_status)
            : ($rishtaRequest->sender_photo_moderation_status !== 'none' ? $rishtaRequest->sender_photo_moderation_status : $rishtaRequest->photo_moderation_status);

        if ($candModStatus !== 'approved') {
            return $this->errorResponse(
                'Candidate photo is undergoing administrative quality review. You will only be prompted to pay after an administrator verifies and approves the photo quality.',
                ['photo_moderation_status' => $candModStatus],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'PHOTO_PENDING_ADMIN_APPROVAL'
            );
        }

        // Check if this specific user has already paid
        $alreadyPaid = $isSender
            ? ($rishtaRequest->sender_photo_paid || ($rishtaRequest->photo_paid && $rishtaRequest->photo_paid_by === $user->id))
            : ($rishtaRequest->receiver_photo_paid || ($rishtaRequest->photo_paid && $rishtaRequest->photo_paid_by === $user->id));

        if ($alreadyPaid) {
            return $this->errorResponse(
                'Photo viewing fee has already been paid for this connection.',
                [],
                Response::HTTP_BAD_REQUEST,
                'PAYMENT_ALREADY_COMPLETED'
            );
        }

        $fee = (float) ($rishtaRequest->photo_fee ?? 300.00);
        $currency = 'PKR';
        $gatewayName = config('payment.default', 'fake');

        $payment = Payment::create([
            'rishta_request_id' => $rishtaRequest->id,
            'user_id' => $user->id,
            'amount' => $fee,
            'currency' => $currency,
            'purpose' => 'photo_unlock',
            'status' => Payment::STATUS_PENDING,
            'gateway' => $gatewayName,
        ]);

        $gatewayResponse = $this->gateway->initiatePayment(
            $payment->payment_uuid,
            $fee,
            $currency,
            [
                'request_code' => $rishtaRequest->request_code,
                'user_id' => $user->id,
                'purpose' => 'photo_unlock',
            ]
        );

        if (!empty($gatewayResponse['transaction_reference'])) {
            $payment->update([
                'transaction_reference' => $gatewayResponse['transaction_reference'],
            ]);
        }

        return $this->successResponse([
            'payment_uuid' => $payment->payment_uuid,
            'request_code' => $rishtaRequest->request_code,
            'amount' => $fee,
            'currency' => $currency,
            'status' => $payment->status,
            'purpose' => 'photo_unlock',
            'gateway' => $gatewayName,
            'redirect_url' => $gatewayResponse['redirect_url'] ?? null,
            'transaction_reference' => $gatewayResponse['transaction_reference'] ?? null,
        ], 'Photo unlock payment initiated successfully.', Response::HTTP_CREATED);
    }

    /**
     * Submit manual JazzCash/Easypaisa payment proof for photo unlock.
     */
    public function submitManualPhotoProof(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::query()
            ->where('request_code', $request_code)
            ->first();

        if (!$rishtaRequest) {
            return $this->errorResponse('The requested Rishta connection was not found.', [], Response::HTTP_NOT_FOUND, 'REQUEST_NOT_FOUND');
        }

        if ($user->id !== $rishtaRequest->sender_id && $user->id !== $rishtaRequest->receiver_id) {
            return $this->errorResponse('Unauthorized.', [], Response::HTTP_FORBIDDEN, 'UNAUTHORIZED_ACTION');
        }

        $isSender = ($user->id === $rishtaRequest->sender_id);
        $candModStatus = $isSender 
            ? ($rishtaRequest->receiver_photo_moderation_status !== 'none' ? $rishtaRequest->receiver_photo_moderation_status : $rishtaRequest->photo_moderation_status)
            : ($rishtaRequest->sender_photo_moderation_status !== 'none' ? $rishtaRequest->sender_photo_moderation_status : $rishtaRequest->photo_moderation_status);

        if ($candModStatus !== 'approved') {
            return $this->errorResponse(
                'Candidate photo must be approved by administration before submitting payment.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'PHOTO_NOT_APPROVED'
            );
        }

        $alreadyPaid = $isSender
            ? ($rishtaRequest->sender_photo_paid || ($rishtaRequest->photo_paid && $rishtaRequest->photo_paid_by === $user->id))
            : ($rishtaRequest->receiver_photo_paid || ($rishtaRequest->photo_paid && $rishtaRequest->photo_paid_by === $user->id));

        if ($alreadyPaid) {
            return $this->errorResponse('Photo viewing fee has already been paid for this connection.', [], Response::HTTP_BAD_REQUEST, 'PAYMENT_ALREADY_COMPLETED');
        }

        // Check if proof from this user is already pending review
        $pendingPayment = Payment::where('rishta_request_id', $rishtaRequest->id)
            ->where('user_id', $user->id)
            ->where('purpose', 'photo_unlock')
            ->where('status', Payment::STATUS_PENDING)
            ->first();

        if ($pendingPayment) {
            return $this->errorResponse(
                'A photo payment proof has already been submitted and is currently pending admin verification.',
                ['payment_uuid' => $pendingPayment->payment_uuid],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'PAYMENT_PROOF_ALREADY_PENDING'
            );
        }

        $request->validate([
            'transaction_reference' => ['required', 'string', 'min:6', 'max:35', 'regex:/^[A-Za-z0-9\-_]+$/'],
            'receipt' => ['required', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:5120'],
        ], [
            'transaction_reference.regex' => 'The Transaction Reference must contain only letters, numbers, hyphens, or underscores (6 to 35 characters).',
            'receipt.mimes' => 'Receipt must be an image (JPG, PNG, WebP) or PDF document.',
            'receipt.max' => 'Receipt file size must not exceed 5MB.',
        ]);

        $tid = trim($request->input('transaction_reference'));

        $duplicateTid = Payment::where('transaction_reference', $tid)
            ->whereIn('status', [Payment::STATUS_PAID, Payment::STATUS_PENDING])
            ->exists();

        if ($duplicateTid) {
            return $this->errorResponse('This Transaction ID has already been submitted or processed.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'DUPLICATE_TRANSACTION_ID');
        }

        $receiptPath = $request->file('receipt')->store('receipts', 'local');
        $fee = (float) ($rishtaRequest->photo_fee ?? 300.00);

        $payment = Payment::create([
            'rishta_request_id' => $rishtaRequest->id,
            'user_id' => $user->id,
            'amount' => $fee,
            'currency' => 'PKR',
            'purpose' => 'photo_unlock',
            'status' => Payment::STATUS_PENDING,
            'gateway' => 'jazzcash_qr',
            'transaction_reference' => $tid,
            'receipt_path' => $receiptPath,
        ]);

        return $this->successResponse([
            'payment_uuid' => $payment->payment_uuid,
            'request_code' => $rishtaRequest->request_code,
            'amount' => $fee,
            'currency' => 'PKR',
            'purpose' => 'photo_unlock',
            'status' => $payment->status,
            'gateway' => 'jazzcash_qr',
            'transaction_reference' => $tid,
            'created_at' => $payment->created_at->toIso8601String(),
        ], 'Photo payment proof submitted successfully. Pending admin verification.', Response::HTTP_CREATED);
    }
}

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
            ->exists();

        if ($alreadyPaid || $rishtaRequest->contactUnlock?->unlocked_at) {
            return $this->errorResponse(
                'Contact unlock fee has already been paid for this connection.',
                [],
                Response::HTTP_BAD_REQUEST,
                'PAYMENT_ALREADY_COMPLETED'
            );
        }

        $fee = (float) config('payment.contact_unlock_fee', 300.00);
        $currency = config('payment.currency', 'PKR');
        $gatewayName = config('payment.default', 'fake');

        // Create pending payment attempt
        $payment = Payment::create([
            'rishta_request_id' => $rishtaRequest->id,
            'user_id' => $user->id,
            'amount' => $fee,
            'currency' => $currency,
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
        $expectedFee = (float) config('payment.contact_unlock_fee', 300.00);
        if ((float) $payment->amount !== $expectedFee || $payment->currency !== 'PKR') {
            return $this->errorResponse(
                'Payment amount or currency mismatch.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_PAYMENT_AMOUNT'
            );
        }

        $rishtaRequest = $payment->rishtaRequest;
        if (!$rishtaRequest || $rishtaRequest->status !== RishtaRequest::STATUS_ACCEPTED || $rishtaRequest->sender_id !== $payment->user_id) {
            return $this->errorResponse(
                'Payment request invariant validation failed.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_PAYMENT_TARGET'
            );
        }

        // 4. Atomic Transaction with Concurrency Locks:
        // Ensures no race condition where two simultaneous verify calls mark multiple payments paid
        // or create duplicate contact_unlocks.
        $alreadyHandled = false;

        DB::transaction(function () use ($payment, $result, &$alreadyHandled) {
            // Lock payment record for update
            $lockedPayment = Payment::where('id', $payment->id)->lockForUpdate()->first();

            if ($lockedPayment->isPaid()) {
                $alreadyHandled = true;
                return;
            }

            // Lock request's contact_unlock to ensure atomic association
            $existingPaidForRequest = Payment::where('rishta_request_id', $lockedPayment->rishta_request_id)
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

            // Update or create the ContactUnlock record pointing to this successful payment
            ContactUnlock::updateOrCreate(
                ['rishta_request_id' => $lockedPayment->rishta_request_id],
                ['payment_id' => $lockedPayment->id]
            );
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
            return redirect("{$frontendUrl}/dashboard/requests?payment=not_found");
        }

        $requestCode = $payment->rishtaRequest?->request_code ?? '';

        if ($payment->isPaid()) {
            return redirect("{$frontendUrl}/dashboard/requests?request={$requestCode}&payment=success");
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

            return redirect("{$frontendUrl}/dashboard/requests?request={$requestCode}&payment=failed");
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

        return redirect("{$frontendUrl}/dashboard/requests?request={$requestCode}&payment=success");
    }
}

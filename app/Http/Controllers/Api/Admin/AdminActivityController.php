<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactUnlock;
use App\Models\Payment;
use App\Models\RishtaRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class AdminActivityController extends Controller
{
    use ApiResponse;

    /**
     * List all rishta requests with filters.
     */
    public function requests(Request $request): JsonResponse
    {
        $query = RishtaRequest::query()
            ->with([
                'sender:id,name,email',
                'receiver:id,name,email',
                'sender.profile:id,user_id,profile_code,gender,city',
                'receiver.profile:id,user_id,profile_code,gender,city',
                'successfulPayment:id,rishta_request_id,payment_uuid,amount,status,paid_at',
            ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('request_code', 'like', "%{$search}%")
                  ->orWhereHas('sender', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('receiver', function ($rq) use ($search) {
                      $rq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->input('status')) {
            if (in_array($status, [
                RishtaRequest::STATUS_PENDING,
                RishtaRequest::STATUS_ACCEPTED,
                RishtaRequest::STATUS_DECLINED,
                RishtaRequest::STATUS_CANCELLED,
                RishtaRequest::STATUS_EXPIRED,
            ])) {
                $query->where('status', $status);
            }
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $requests = $query->latest()->paginate($perPage);

        return $this->successResponse($requests, 'Rishta requests retrieved.');
    }

    /**
     * Administrative intervention to cancel a request.
     */
    public function cancelRequest(int $id): JsonResponse
    {
        $rishtaRequest = RishtaRequest::find($id);

        if (!$rishtaRequest) {
            return $this->errorResponse('Request not found.', [], Response::HTTP_NOT_FOUND, 'REQUEST_NOT_FOUND');
        }

        $rishtaRequest->update([
            'status' => RishtaRequest::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'active_pair_hash' => null,
        ]);

        return $this->successResponse([
            'id' => $rishtaRequest->id,
            'request_code' => $rishtaRequest->request_code,
            'status' => $rishtaRequest->status,
        ], "Request [{$rishtaRequest->request_code}] cancelled by administrator.");
    }

    /**
     * Financial transactions audit log.
     */
    public function payments(Request $request): JsonResponse
    {
        $query = Payment::query()->with([
            'user:id,name,email',
            'rishtaRequest:id,request_code,sender_id,receiver_id',
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('payment_uuid', 'like', "%{$search}%")
                  ->orWhere('transaction_reference', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->input('status')) {
            if (in_array($status, [Payment::STATUS_PENDING, Payment::STATUS_PAID, Payment::STATUS_FAILED, Payment::STATUS_CANCELLED])) {
                $query->where('status', $status);
            }
        }

        if ($gateway = $request->input('gateway')) {
            $query->where('gateway', $gateway);
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $payments = $query->latest()->paginate($perPage);

        return $this->successResponse($payments, 'Payment transactions retrieved.');
    }

    /**
     * Approve manual payment (e.g. JazzCash QR) and link to ContactUnlock.
     */
    public function approvePayment(Request $request, int $id): JsonResponse
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return $this->errorResponse('Payment record not found.', [], Response::HTTP_NOT_FOUND, 'PAYMENT_NOT_FOUND');
        }

        if ($payment->status !== Payment::STATUS_PENDING) {
            return $this->errorResponse(
                "Cannot approve payment with status '{$payment->status}'. Only pending payments can be approved.",
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_PAYMENT_STATUS'
            );
        }

        $adminId = $request->user()->id;

        DB::transaction(function () use ($payment, $adminId) {
            $lockedPayment = Payment::where('id', $payment->id)->lockForUpdate()->first();

            if ($lockedPayment->isPaid()) {
                return;
            }

            $lockedPayment->update([
                'status' => Payment::STATUS_PAID,
                'paid_at' => now(),
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
            ]);

            ContactUnlock::updateOrCreate(
                ['rishta_request_id' => $lockedPayment->rishta_request_id],
                ['payment_id' => $lockedPayment->id]
            );
        });

        $payment->refresh();

        return $this->successResponse([
            'id' => $payment->id,
            'payment_uuid' => $payment->payment_uuid,
            'status' => $payment->status,
            'paid_at' => $payment->paid_at?->toIso8601String(),
            'reviewed_at' => $payment->reviewed_at?->toIso8601String(),
        ], 'Payment successfully approved and marked as paid.');
    }

    /**
     * Reject manual payment with admin reason.
     */
    public function rejectPayment(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ], [
            'reason.required' => 'Please provide a reason explaining why the payment proof was rejected.',
            'reason.min' => 'Rejection reason must be at least 3 characters.',
        ]);

        $payment = Payment::find($id);

        if (!$payment) {
            return $this->errorResponse('Payment record not found.', [], Response::HTTP_NOT_FOUND, 'PAYMENT_NOT_FOUND');
        }

        if ($payment->status !== Payment::STATUS_PENDING) {
            return $this->errorResponse(
                "Cannot reject payment with status '{$payment->status}'. Only pending payments can be rejected.",
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_PAYMENT_STATUS'
            );
        }

        $adminId = $request->user()->id;

        $payment->update([
            'status' => Payment::STATUS_FAILED,
            'admin_notes' => trim($request->input('reason')),
            'reviewed_by' => $adminId,
            'reviewed_at' => now(),
        ]);

        return $this->successResponse([
            'id' => $payment->id,
            'payment_uuid' => $payment->payment_uuid,
            'status' => $payment->status,
            'admin_notes' => $payment->admin_notes,
            'reviewed_at' => $payment->reviewed_at?->toIso8601String(),
        ], 'Payment has been rejected.');
    }

    /**
     * Stream the privately stored payment proof receipt to authenticated admin.
     */
    public function viewReceipt(int $id)
    {
        $payment = Payment::find($id);

        if (!$payment || empty($payment->receipt_path)) {
            return response()->json([
                'success' => false,
                'message' => 'Payment receipt not found.',
                'error_code' => 'RECEIPT_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }

        if (!Storage::disk('local')->exists($payment->receipt_path)) {
            return response()->json([
                'success' => false,
                'message' => 'Receipt file not found on disk or has been removed.',
                'error_code' => 'FILE_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }

        $mimeType = Storage::disk('local')->mimeType($payment->receipt_path) ?: 'application/octet-stream';

        return Storage::disk('local')->response($payment->receipt_path, null, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
        ]);
    }

    /**
     * Delete/Purge the stored receipt image for an approved or rejected payment to free server storage.
     */
    public function deleteReceipt(int $id): JsonResponse
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return $this->errorResponse('Payment record not found.', [], Response::HTTP_NOT_FOUND, 'PAYMENT_NOT_FOUND');
        }

        if (empty($payment->receipt_path)) {
            return $this->errorResponse('No receipt file found for this payment.', [], Response::HTTP_NOT_FOUND, 'RECEIPT_NOT_FOUND');
        }

        if ($payment->status === Payment::STATUS_PENDING) {
            return $this->errorResponse(
                'Cannot delete receipt while payment is pending review. Please approve or reject first.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'CANNOT_DELETE_PENDING_RECEIPT'
            );
        }

        if (Storage::disk('local')->exists($payment->receipt_path)) {
            Storage::disk('local')->delete($payment->receipt_path);
        }

        $payment->update([
            'receipt_path' => null,
        ]);

        return $this->successResponse([
            'id' => $payment->id,
            'payment_uuid' => $payment->payment_uuid,
            'receipt_path' => null,
        ], 'Receipt file deleted successfully from server storage.');
    }

    /**
     * Contact unlock logs.
     */
    public function unlocks(Request $request): JsonResponse
    {
        $query = ContactUnlock::query()->with([
            'rishtaRequest.sender:id,name,email',
            'rishtaRequest.receiver:id,name,email',
            'payment:id,payment_uuid,amount,status',
        ]);

        $perPage = min((int) $request->input('per_page', 15), 50);
        $unlocks = $query->latest()->paginate($perPage);

        // Transform slightly to avoid leaking raw phone numbers unmasked
        $unlocks->getCollection()->transform(function ($unlock) {
            return [
                'id' => $unlock->id,
                'rishta_request_id' => $unlock->rishta_request_id,
                'request_code' => $unlock->rishtaRequest?->request_code,
                'sender' => $unlock->rishtaRequest?->sender?->only(['id', 'name', 'email']),
                'receiver' => $unlock->rishtaRequest?->receiver?->only(['id', 'name', 'email']),
                'sender_phone_masked' => $unlock->sender_phone ? substr($unlock->sender_phone, 0, 4) . '****' . substr($unlock->sender_phone, -3) : null,
                'receiver_phone_masked' => $unlock->receiver_phone ? substr($unlock->receiver_phone, 0, 4) . '****' . substr($unlock->receiver_phone, -3) : null,
                'sender_verified' => $unlock->isSenderVerified(),
                'receiver_verified' => $unlock->isReceiverVerified(),
                'unlocked' => $unlock->isUnlocked(),
                'unlocked_at' => $unlock->unlocked_at?->toIso8601String(),
                'created_at' => $unlock->created_at?->toIso8601String(),
            ];
        });

        return $this->successResponse($unlocks, 'Contact unlocks log retrieved.');
    }
}

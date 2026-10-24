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
    /**
     * List all rishta requests with filters.
     */
    public function requests(Request $request): JsonResponse
    {
        $query = RishtaRequest::query()
            ->with([
                'sender:id,name,email,phone',
                'receiver:id,name,email,phone',
                'sender.profile',
                'receiver.profile',
                'reviewer:id,name,email',
                'successfulPayment:id,rishta_request_id,payment_uuid,amount,status,paid_at',
            ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('request_code', 'like', "%{$search}%")
                  ->orWhere('sender_intro', 'like', "%{$search}%")
                  ->orWhere('sender_questions', 'like', "%{$search}%")
                  ->orWhere('receiver_intro', 'like', "%{$search}%")
                  ->orWhere('receiver_answers', 'like', "%{$search}%")
                  ->orWhere('receiver_questions', 'like', "%{$search}%")
                  ->orWhere('sender_answers', 'like', "%{$search}%")
                  ->orWhereHas('sender', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  })
                  ->orWhereHas('receiver', function ($rq) use ($search) {
                      $rq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // Quick Pending Filter tabs
        if ($quickFilter = $request->input('quick_filter')) {
            switch ($quickFilter) {
                case 'pending_proposals':
                    $query->where('admin_status', RishtaRequest::ADMIN_STATUS_PENDING);
                    break;
                case 'pending_photos':
                    $query->where('photo_moderation_status', 'pending_review');
                    break;
                case 'needs_revision':
                    $query->where('admin_status', RishtaRequest::ADMIN_STATUS_NEEDS_REVISION);
                    break;
                case 'all_pending':
                    $query->where(function ($q) {
                        $q->where('admin_status', RishtaRequest::ADMIN_STATUS_PENDING)
                          ->orWhere('photo_moderation_status', 'pending_review');
                    });
                    break;
            }
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

        if ($adminStatus = $request->input('admin_status')) {
            if (in_array($adminStatus, [
                RishtaRequest::ADMIN_STATUS_PENDING,
                RishtaRequest::ADMIN_STATUS_APPROVED,
                RishtaRequest::ADMIN_STATUS_REJECTED,
                RishtaRequest::ADMIN_STATUS_NEEDS_REVISION,
            ])) {
                $query->where('admin_status', $adminStatus);
            }
        }

        if ($photoStatus = $request->input('photo_status')) {
            if ($photoStatus === 'none') {
                $query->whereNull('photo_moderation_status')
                      ->whereNull('sender_photo_moderation_status')
                      ->whereNull('receiver_photo_moderation_status');
            } elseif (in_array($photoStatus, ['pending_review', 'approved', 'rejected'])) {
                $query->where(function ($q) use ($photoStatus) {
                    $q->where('photo_moderation_status', $photoStatus)
                      ->orWhere('sender_photo_moderation_status', $photoStatus)
                      ->orWhere('receiver_photo_moderation_status', $photoStatus);
                });
            }
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $paginated = $query->latest()->paginate($perPage);
        $paginated->appends($request->query());

        $result = $paginated->toArray();
        $result['counts'] = [
            'all' => RishtaRequest::count(),
            'pending_proposals' => RishtaRequest::where('admin_status', RishtaRequest::ADMIN_STATUS_PENDING)->count(),
            'pending_photos' => RishtaRequest::where(function ($q) {
                $q->where('photo_moderation_status', 'pending_review')
                  ->orWhere('sender_photo_moderation_status', 'pending_review')
                  ->orWhere('receiver_photo_moderation_status', 'pending_review');
            })->count(),
            'needs_revision' => RishtaRequest::where('admin_status', RishtaRequest::ADMIN_STATUS_NEEDS_REVISION)->count(),
            'all_pending' => RishtaRequest::where(function ($q) {
                $q->where('admin_status', RishtaRequest::ADMIN_STATUS_PENDING)
                  ->orWhere('photo_moderation_status', 'pending_review')
                  ->orWhere('sender_photo_moderation_status', 'pending_review')
                  ->orWhere('receiver_photo_moderation_status', 'pending_review');
            })->count(),
        ];

        return $this->successResponse($result, 'Rishta requests retrieved.');
    }

    /**
     * Approve a proposal for candidate delivery (1-Click Admin Moderation).
     */
    public function approveProposal(Request $request, int $id): JsonResponse
    {
        $rishtaRequest = RishtaRequest::with(['sender.profile', 'receiver.profile'])->find($id);

        if (!$rishtaRequest) {
            return $this->errorResponse('Request not found.', [], Response::HTTP_NOT_FOUND, 'REQUEST_NOT_FOUND');
        }

        $isResponseApproval = ($rishtaRequest->status === RishtaRequest::STATUS_ACCEPTED && empty($rishtaRequest->sender_answers));
        $isSenderAnswerApproval = ($rishtaRequest->status === RishtaRequest::STATUS_ACCEPTED && !empty($rishtaRequest->sender_answers));

        $rishtaRequest->update([
            'admin_status' => RishtaRequest::ADMIN_STATUS_APPROVED,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        if ($isSenderAnswerApproval) {
            try {
                $rishtaRequest->receiver->notify(new \App\Notifications\NewRishtaRequestNotification($rishtaRequest));
                \App\Models\Announcement::sendToUser(
                    $rishtaRequest->receiver_id,
                    'Counter-Questions Answered',
                    "Candidate " . ($rishtaRequest->sender?->profile?->profile_code ?? 'Sender') . " has answered your questions on proposal [{$rishtaRequest->request_code}].",
                    'info',
                    '/requests',
                    'View Answers'
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to notify receiver of sender answers: {$e->getMessage()}");
            }
            $message = "Sender's answers [{$rishtaRequest->request_code}] approved and delivered to candidate.";
        } elseif ($isResponseApproval) {
            try {
                $rishtaRequest->sender->notify(new \App\Notifications\RishtaRequestAcceptedNotification($rishtaRequest));
                \App\Models\Announcement::sendToUser(
                    $rishtaRequest->sender_id,
                    'Proposal Accepted 🎉',
                    "Candidate " . ($rishtaRequest->receiver?->profile?->profile_code ?? 'Candidate') . " has accepted your rishta proposal [{$rishtaRequest->request_code}]!",
                    'success',
                    '/requests',
                    'View Response'
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to notify sender of accepted proposal: {$e->getMessage()}");
            }
            $message = "Proposal response [{$rishtaRequest->request_code}] approved and delivered to sender.";
        } else {
            try {
                $rishtaRequest->receiver->notify(new \App\Notifications\NewRishtaRequestNotification($rishtaRequest));
                \App\Models\Announcement::sendToUser(
                    $rishtaRequest->receiver_id,
                    'New Proposal Received 💌',
                    "You have received a new matrimonial proposal from candidate " . ($rishtaRequest->sender?->profile?->profile_code ?? 'Candidate') . " [{$rishtaRequest->request_code}].",
                    'info',
                    '/requests',
                    'Review Proposal'
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to notify receiver of approved proposal: {$e->getMessage()}");
            }
            $message = "Proposal [{$rishtaRequest->request_code}] approved and delivered to candidate.";
        }

        return $this->successResponse([
            'id' => $rishtaRequest->id,
            'request_code' => $rishtaRequest->request_code,
            'admin_status' => $rishtaRequest->admin_status,
            'status' => $rishtaRequest->status,
        ], $message);
    }

    /**
     * Reject a proposal during admin moderation.
     */
    public function rejectProposal(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $rishtaRequest = RishtaRequest::find($id);

        if (!$rishtaRequest) {
            return $this->errorResponse('Request not found.', [], Response::HTTP_NOT_FOUND, 'REQUEST_NOT_FOUND');
        }

        $rishtaRequest->update([
            'admin_status' => RishtaRequest::ADMIN_STATUS_REJECTED,
            'admin_notes' => $request->input('admin_notes'),
            'status' => RishtaRequest::STATUS_DECLINED,
            'declined_at' => now(),
            'active_pair_hash' => null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return $this->successResponse([
            'id' => $rishtaRequest->id,
            'request_code' => $rishtaRequest->request_code,
            'admin_status' => $rishtaRequest->admin_status,
            'status' => $rishtaRequest->status,
        ], "Proposal [{$rishtaRequest->request_code}] has been rejected.");
    }

    /**
     * Request correction / revision from user without rejecting or killing the proposal.
     */
    public function requestRevisionProposal(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'admin_notes' => ['required', 'string', 'min:3', 'max:1000'],
        ], [
            'admin_notes.required' => 'Please provide instructions or reason for the requested revision.',
        ]);

        $rishtaRequest = RishtaRequest::find($id);

        if (!$rishtaRequest) {
            return $this->errorResponse('Request not found.', [], Response::HTTP_NOT_FOUND, 'REQUEST_NOT_FOUND');
        }

        $rishtaRequest->update([
            'admin_status' => RishtaRequest::ADMIN_STATUS_NEEDS_REVISION,
            'admin_notes' => $request->input('admin_notes'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // Determine WHO submitted the content that requires revision:
        // 1. If proposal is accepted and sender has NOT yet replied, it's the receiver's response being moderated.
        // 2. If sender has replied, it's the sender's answer being moderated.
        // 3. If proposal is pending, it's the sender's initial proposal.
        $isResponseRevision = ($rishtaRequest->status === RishtaRequest::STATUS_ACCEPTED && empty($rishtaRequest->sender_answers));
        $targetUserId = $isResponseRevision ? $rishtaRequest->receiver_id : $rishtaRequest->sender_id;
        $notificationTitle = $isResponseRevision ? 'Proposal Response Needs Revision ⚠️' : 'Proposal Needs Revision ⚠️';
        $buttonLabel = $isResponseRevision ? 'Edit Response' : 'Edit Proposal';

        try {
            \App\Models\Announcement::sendToUser(
                $targetUserId,
                $notificationTitle,
                "Admin requested a revision on proposal [{$rishtaRequest->request_code}]: " . $request->input('admin_notes'),
                'warning',
                '/requests',
                $buttonLabel
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to send revision notification: {$e->getMessage()}");
        }

        return $this->successResponse([
            'id' => $rishtaRequest->id,
            'request_code' => $rishtaRequest->request_code,
            'admin_status' => $rishtaRequest->admin_status,
            'status' => $rishtaRequest->status,
            'admin_notes' => $rishtaRequest->admin_notes,
            'target_user_id' => $targetUserId,
        ], "Revision requested for proposal [{$rishtaRequest->request_code}]. The candidate can now edit their answers without permanent decline.");
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

            if ($lockedPayment->purpose === 'photo_unlock') {
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
                ContactUnlock::updateOrCreate(
                    ['rishta_request_id' => $lockedPayment->rishta_request_id],
                    ['payment_id' => $lockedPayment->id]
                );
            }
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
    public function deleteReceipt(Request $request, int $id): JsonResponse
    {
        if (!$request->user()?->isAdmin()) {
            return $this->errorResponse('Only Super Admin can delete receipts.', [], Response::HTTP_FORBIDDEN);
        }

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

    /**
     * Approve uploaded candidate photo after quality audit.
     */
    public function approvePhoto(Request $request, int $id): JsonResponse
    {
        $rishtaRequest = RishtaRequest::find($id);

        if (!$rishtaRequest) {
            return $this->errorResponse('Request not found.', [], Response::HTTP_NOT_FOUND, 'REQUEST_NOT_FOUND');
        }

        if (empty($rishtaRequest->sender_photo_path) && empty($rishtaRequest->receiver_photo_path)) {
            return $this->errorResponse('No candidate photo has been uploaded for this proposal.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'NO_PHOTO_UPLOADED');
        }

        $watermarkLevel = $request->input('watermark_level', 'medium');
        if (!in_array($watermarkLevel, ['standard', 'medium', 'dark'])) {
            $watermarkLevel = 'medium';
        }

        $watermarkText = $request->input('watermark_text');
        if (is_string($watermarkText)) {
            $watermarkText = mb_substr(trim($watermarkText), 0, 255);
            if ($watermarkText === '') {
                $watermarkText = null;
            }
        } else {
            $watermarkText = null;
        }

        $side = $request->input('side');
        if (!$side) {
            if (!empty($rishtaRequest->receiver_photo_path) && $rishtaRequest->receiver_photo_moderation_status === 'pending_review') {
                $side = 'receiver';
            } elseif (!empty($rishtaRequest->sender_photo_path) && $rishtaRequest->sender_photo_moderation_status === 'pending_review') {
                $side = 'sender';
            } else {
                $side = !empty($rishtaRequest->receiver_photo_path) ? 'receiver' : 'sender';
            }
        }

        $updates = [
            'photo_moderation_status' => 'approved',
            'photo_watermark_level' => $watermarkLevel,
            'photo_watermark_text' => $watermarkText,
            'photo_rejection_notes' => null,
        ];

        if ($side === 'sender') {
            $updates['sender_photo_moderation_status'] = 'approved';
            $updates['sender_photo_watermark_level'] = $watermarkLevel;
            $updates['sender_photo_watermark_text'] = $watermarkText;
            $updates['sender_photo_rejection_notes'] = null;
        } else {
            $updates['receiver_photo_moderation_status'] = 'approved';
            $updates['receiver_photo_watermark_level'] = $watermarkLevel;
            $updates['receiver_photo_watermark_text'] = $watermarkText;
            $updates['receiver_photo_rejection_notes'] = null;
        }

        $rishtaRequest->update($updates);

        return $this->successResponse([
            'id' => $rishtaRequest->id,
            'request_code' => $rishtaRequest->request_code,
            'side' => $side,
            'photo_moderation_status' => 'approved',
            'photo_watermark_level' => $watermarkLevel,
            'photo_watermark_text' => $watermarkText,
        ], "Photo ({$side}) for proposal [{$rishtaRequest->request_code}] approved with [{$watermarkLevel}] watermark level.");
    }

    /**
     * Reject poor / improper candidate photo with feedback notes.
     */
    public function rejectPhoto(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ], [
            'reason.required' => 'Please provide a reason explaining why the photo was rejected (e.g. face not clear, scenery/object photo, sunglasses).',
        ]);

        $rishtaRequest = RishtaRequest::find($id);

        if (!$rishtaRequest) {
            return $this->errorResponse('Request not found.', [], Response::HTTP_NOT_FOUND, 'REQUEST_NOT_FOUND');
        }

        $reason = trim($request->input('reason'));
        $side = $request->input('side');
        if (!$side) {
            if (!empty($rishtaRequest->receiver_photo_path) && $rishtaRequest->receiver_photo_moderation_status === 'pending_review') {
                $side = 'receiver';
            } elseif (!empty($rishtaRequest->sender_photo_path) && $rishtaRequest->sender_photo_moderation_status === 'pending_review') {
                $side = 'sender';
            } else {
                $side = !empty($rishtaRequest->receiver_photo_path) ? 'receiver' : 'sender';
            }
        }

        $updates = [
            'photo_moderation_status' => 'rejected',
            'photo_rejection_notes' => $reason,
            'photo_request_status' => 'requested',
        ];

        if ($side === 'sender') {
            $updates['sender_photo_moderation_status'] = 'rejected';
            $updates['sender_photo_rejection_notes'] = $reason;
            $updates['sender_photo_path'] = null;
        } else {
            $updates['receiver_photo_moderation_status'] = 'rejected';
            $updates['receiver_photo_rejection_notes'] = $reason;
            $updates['receiver_photo_path'] = null;
        }

        $rishtaRequest->update($updates);

        return $this->successResponse([
            'id' => $rishtaRequest->id,
            'request_code' => $rishtaRequest->request_code,
            'side' => $side,
            'photo_moderation_status' => 'rejected',
            'photo_rejection_notes' => $reason,
        ], "Photo ({$side}) rejected with feedback. Candidate has been notified to upload a clearer photo.");
    }

    /**
     * Admin direct inspection of candidate photo for quality audit.
     */
    public function viewCandidatePhoto(Request $request, int $id)
    {
        $rishtaRequest = RishtaRequest::find($id);

        $side = $request->query('side');
        if ($side === 'sender') {
            $photoPath = $rishtaRequest->sender_photo_path;
        } elseif ($side === 'receiver') {
            $photoPath = $rishtaRequest->receiver_photo_path;
        } else {
            if (!empty($rishtaRequest->receiver_photo_path) && $rishtaRequest->receiver_photo_moderation_status === 'pending_review') {
                $photoPath = $rishtaRequest->receiver_photo_path;
            } elseif (!empty($rishtaRequest->sender_photo_path) && $rishtaRequest->sender_photo_moderation_status === 'pending_review') {
                $photoPath = $rishtaRequest->sender_photo_path;
            } else {
                $photoPath = $rishtaRequest->receiver_photo_path ?: $rishtaRequest->sender_photo_path;
            }
        }

        if (empty($photoPath)) {
            abort(404, 'No photo uploaded.');
        }

        if (Storage::disk('local')->exists($photoPath)) {
            $mimeType = Storage::disk('local')->mimeType($photoPath) ?: 'image/jpeg';
            return Storage::disk('local')->response($photoPath, null, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline',
                'Cache-Control' => 'no-store, no-cache, private',
            ]);
        }

        $fallbacks = [
            storage_path('app/private/' . $photoPath),
            storage_path('app/' . $photoPath),
        ];

        foreach ($fallbacks as $fallback) {
            if (file_exists($fallback)) {
                return response()->file($fallback, [
                    'Content-Type' => mime_content_type($fallback) ?: 'image/jpeg',
                    'Content-Disposition' => 'inline',
                    'Cache-Control' => 'no-store, no-cache, private',
                ]);
            }
        }

        abort(404, 'Photo file not found on server.');
    }
}

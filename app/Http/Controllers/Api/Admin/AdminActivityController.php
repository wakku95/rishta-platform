<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactUnlock;
use App\Models\Payment;
use App\Models\RishtaRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $perPage = min((int) $request->input('per_page', 15), 50);
        $payments = $query->latest()->paginate($perPage);

        return $this->successResponse($payments, 'Payment transactions retrieved.');
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

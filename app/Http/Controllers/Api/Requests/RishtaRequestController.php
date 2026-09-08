<?php

namespace App\Http\Controllers\Api\Requests;

use App\Events\RishtaRequestAccepted;
use App\Events\RishtaRequestCancelled;
use App\Events\RishtaRequestDeclined;
use App\Events\RishtaRequestSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\RishtaRequest\CreateRishtaRequestRequest;
use App\Http\Resources\RishtaRequestResource;
use App\Models\Profile;
use App\Models\RishtaRequest;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class RishtaRequestController extends Controller
{
    use ApiResponse;

    /**
     * Send a new Rishta request to a candidate profile.
     */
    public function store(CreateRishtaRequestRequest $request): JsonResponse
    {
        $sender = $request->user();
        $senderProfile = $sender->profile;

        // 1. Sender must have an active profile
        if (!$senderProfile || $senderProfile->profile_status !== 'active') {
            return $this->errorResponse(
                'You must have an active profile before sending a Rishta request.',
                ['profile' => ['Only active profile holders can initiate connection requests.']],
                Response::HTTP_FORBIDDEN,
                'ACTIVE_PROFILE_REQUIRED'
            );
        }

        // 2. Find target profile and ensure it is active and verified
        $targetProfile = Profile::query()
            ->where('profile_code', $request->input('profile_code'))
            ->where('profile_status', 'active')
            ->whereHas('user', function ($q) {
                $q->where('status', '!=', 'suspended')
                    ->whereNotNull('email_verified_at');
            })
            ->first();

        if (!$targetProfile) {
            return $this->errorResponse(
                'The requested candidate profile was not found or is no longer active.',
                [],
                Response::HTTP_NOT_FOUND,
                'PROFILE_NOT_FOUND'
            );
        }

        $receiver = $targetProfile->user;

        // 3. Cannot send request to own profile
        if ($sender->id === $receiver->id) {
            return $this->errorResponse(
                'You cannot send a Rishta request to your own profile.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'CANNOT_REQUEST_SELF'
            );
        }

        // 4. Directional Permanent Decline Check:
        // Has receiver previously declined this sender?
        $previouslyDeclined = RishtaRequest::where('sender_id', $sender->id)
            ->where('receiver_id', $receiver->id)
            ->where('status', RishtaRequest::STATUS_DECLINED)
            ->exists();

        if ($previouslyDeclined) {
            return $this->errorResponse(
                'This candidate previously declined your request. Re-requesting is not permitted.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'REQUEST_PREVIOUSLY_DECLINED'
            );
        }

        $activePairHash = RishtaRequest::generateActivePairHash($sender->id, $receiver->id);

        // 5. Database transaction with concurrency lock and lazy expiration cleanup
        try {
            $rishtaRequest = DB::transaction(function () use ($sender, $receiver, $activePairHash) {
                // Check if an active request exists with this hash
                $existing = RishtaRequest::where('active_pair_hash', $activePairHash)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    // Check lazy expiration
                    if ($existing->status === RishtaRequest::STATUS_PENDING && $existing->expires_at->isPast()) {
                        $existing->update([
                            'status' => RishtaRequest::STATUS_EXPIRED,
                            'active_pair_hash' => null,
                        ]);
                    } else {
                        // Request is currently active
                        if ($existing->status === RishtaRequest::STATUS_ACCEPTED) {
                            abort(Response::HTTP_CONFLICT, 'ACTIVE_REQUEST_EXISTS:A connection is already active between both candidates.');
                        } else {
                            abort(Response::HTTP_CONFLICT, 'ACTIVE_REQUEST_EXISTS:A pending request already exists between both candidates.');
                        }
                    }
                }

                // Create new request
                $created = RishtaRequest::create([
                    'request_code' => RishtaRequest::generateUniqueRequestCode(),
                    'sender_id' => $sender->id,
                    'receiver_id' => $receiver->id,
                    'status' => RishtaRequest::STATUS_PENDING,
                    'active_pair_hash' => $activePairHash,
                    'expires_at' => Carbon::now()->addDays(RishtaRequest::EXPIRATION_DAYS),
                ]);

                return $created;
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $parts = explode(':', $e->getMessage(), 2);
            $errCode = $parts[0] ?? 'CONFLICT';
            $errMsg = $parts[1] ?? $e->getMessage();
            return $this->errorResponse($errMsg, [], $e->getStatusCode(), $errCode);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return $this->errorResponse(
                'A request is already in progress between both candidates.',
                [],
                Response::HTTP_CONFLICT,
                'ACTIVE_REQUEST_EXISTS'
            );
        }

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);
        event(new RishtaRequestSent($rishtaRequest));

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Rishta request sent successfully.',
            Response::HTTP_CREATED
        );
    }

    /**
     * Get paginated list of received requests.
     */
    public function received(Request $request): JsonResponse
    {
        $user = $request->user();

        $perPage = $request->integer('per_page', 12);
        if ($perPage < 1 || $perPage > 50) {
            $perPage = 12;
        }

        $query = RishtaRequest::query()
            ->where('receiver_id', $user->id)
            ->with(['sender.profile', 'receiver.profile']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $paginator = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Apply lazy expiration on any pending items in collection
        foreach ($paginator->items() as $item) {
            $item->checkAndApplyLazyExpiration();
        }

        return response()->json([
            'success' => true,
            'message' => 'Received requests retrieved successfully.',
            'data' => RishtaRequestResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Get paginated list of sent requests.
     */
    public function sent(Request $request): JsonResponse
    {
        $user = $request->user();

        $perPage = $request->integer('per_page', 12);
        if ($perPage < 1 || $perPage > 50) {
            $perPage = 12;
        }

        $query = RishtaRequest::query()
            ->where('sender_id', $user->id)
            ->with(['sender.profile', 'receiver.profile']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $paginator = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Apply lazy expiration on any pending items in collection
        foreach ($paginator->items() as $item) {
            $item->checkAndApplyLazyExpiration();
        }

        return response()->json([
            'success' => true,
            'message' => 'Sent requests retrieved successfully.',
            'data' => RishtaRequestResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * View a single request by its public request_code.
     */
    public function show(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::query()
            ->where('request_code', $request_code)
            ->with(['sender.profile', 'receiver.profile'])
            ->first();

        if (!$rishtaRequest) {
            return $this->errorResponse(
                'The requested Rishta request was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'REQUEST_NOT_FOUND'
            );
        }

        // Must be sender or receiver
        if ($user->id !== $rishtaRequest->sender_id && $user->id !== $rishtaRequest->receiver_id) {
            return $this->errorResponse(
                'You are not authorized to view this request.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_REQUEST_ACCESS'
            );
        }

        $rishtaRequest->checkAndApplyLazyExpiration();

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Rishta request details retrieved successfully.'
        );
    }

    /**
     * Accept a pending request (Recipient only).
     */
    public function accept(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::where('request_code', $request_code)->first();

        if (!$rishtaRequest) {
            return $this->errorResponse(
                'The requested Rishta request was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'REQUEST_NOT_FOUND'
            );
        }

        // Recipient authorization check
        if ($user->id !== $rishtaRequest->receiver_id) {
            return $this->errorResponse(
                'Only the recipient can accept a Rishta request.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_ACTION'
            );
        }

        // Lazy expiration check
        $rishtaRequest->checkAndApplyLazyExpiration();

        // State validation: only pending can be accepted
        if ($rishtaRequest->status !== RishtaRequest::STATUS_PENDING) {
            return $this->errorResponse(
                "Cannot accept request with status '{$rishtaRequest->status}'.",
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_TRANSITION'
            );
        }

        $rishtaRequest->update([
            'status' => RishtaRequest::STATUS_ACCEPTED,
            'accepted_at' => Carbon::now(),
            // active_pair_hash remains intact to prevent concurrent requests while accepted
        ]);

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);
        event(new RishtaRequestAccepted($rishtaRequest));

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Rishta request accepted successfully.'
        );
    }

    /**
     * Decline a pending request (Recipient only).
     */
    public function decline(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::where('request_code', $request_code)->first();

        if (!$rishtaRequest) {
            return $this->errorResponse(
                'The requested Rishta request was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'REQUEST_NOT_FOUND'
            );
        }

        // Recipient authorization check
        if ($user->id !== $rishtaRequest->receiver_id) {
            return $this->errorResponse(
                'Only the recipient can decline a Rishta request.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_ACTION'
            );
        }

        // Lazy expiration check
        $rishtaRequest->checkAndApplyLazyExpiration();

        // State validation: only pending can be declined
        if ($rishtaRequest->status !== RishtaRequest::STATUS_PENDING) {
            return $this->errorResponse(
                "Cannot decline request with status '{$rishtaRequest->status}'.",
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_TRANSITION'
            );
        }

        $rishtaRequest->update([
            'status' => RishtaRequest::STATUS_DECLINED,
            'active_pair_hash' => null, // Free active pair slot
            'declined_at' => Carbon::now(),
        ]);

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);
        event(new RishtaRequestDeclined($rishtaRequest));

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Rishta request declined.'
        );
    }

    /**
     * Cancel a pending request (Sender only).
     */
    public function cancel(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::where('request_code', $request_code)->first();

        if (!$rishtaRequest) {
            return $this->errorResponse(
                'The requested Rishta request was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'REQUEST_NOT_FOUND'
            );
        }

        // Sender authorization check
        if ($user->id !== $rishtaRequest->sender_id) {
            return $this->errorResponse(
                'Only the sender can cancel a Rishta request.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_ACTION'
            );
        }

        // Lazy expiration check
        $rishtaRequest->checkAndApplyLazyExpiration();

        // State validation: only pending can be cancelled
        if ($rishtaRequest->status !== RishtaRequest::STATUS_PENDING) {
            return $this->errorResponse(
                "Cannot cancel request with status '{$rishtaRequest->status}'.",
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_TRANSITION'
            );
        }

        $rishtaRequest->update([
            'status' => RishtaRequest::STATUS_CANCELLED,
            'active_pair_hash' => null, // Free active pair slot
            'cancelled_at' => Carbon::now(),
        ]);

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);
        event(new RishtaRequestCancelled($rishtaRequest));

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Rishta request cancelled successfully.'
        );
    }
}

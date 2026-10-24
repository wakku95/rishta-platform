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
use Illuminate\Support\Facades\Storage;
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

        // 1b. Identity Verification Gate: Sender must be verified (CNIC + Live Selfie)
        if (!$sender->isIdentityVerified()) {
            $verification = $sender->latestIdentityVerification();
            return $this->errorResponse(
                'Identity verification (CNIC + Live Selfie) is required before sending a Rishta request.',
                [
                    'identity_verified' => false,
                    'verification_status' => $verification ? $verification->status : 'none',
                    'rejection_reason' => $verification ? $verification->rejection_reason : null,
                ],
                Response::HTTP_FORBIDDEN,
                'IDENTITY_VERIFICATION_REQUIRED'
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

        // 5. Daily Request Limit: Maximum 3 requests per calendar day
        $todayRequestsCount = RishtaRequest::where('sender_id', $sender->id)
            ->where('created_at', '>=', Carbon::now()->startOfDay())
            ->count();

        if ($todayRequestsCount >= 3) {
            return $this->errorResponse(
                'You have reached your daily limit of 3 Rishta requests. Your limit will reset at midnight.',
                [],
                Response::HTTP_TOO_MANY_REQUESTS,
                'DAILY_REQUEST_LIMIT_REACHED'
            );
        }

        $activePairHash = RishtaRequest::generateActivePairHash($sender->id, $receiver->id);

        // 6. Database transaction with concurrency lock and lazy expiration cleanup
        try {
            $rishtaRequest = DB::transaction(function () use ($request, $sender, $receiver, $activePairHash) {
                // Check if an active request exists between both candidates
                $existing = RishtaRequest::where(function ($q) use ($sender, $receiver, $activePairHash) {
                    $q->where('active_pair_hash', $activePairHash)
                      ->orWhere(function ($sub) use ($sender, $receiver) {
                          $sub->where('sender_id', $sender->id)->where('receiver_id', $receiver->id);
                      })
                      ->orWhere(function ($sub) use ($sender, $receiver) {
                          $sub->where('sender_id', $receiver->id)->where('receiver_id', $sender->id);
                      });
                })
                ->whereIn('status', [RishtaRequest::STATUS_PENDING, RishtaRequest::STATUS_ACCEPTED])
                ->lockForUpdate()
                ->first();

                if ($existing) {
                    // Check lazy expiration
                    if ($existing->status === RishtaRequest::STATUS_PENDING && $existing->expires_at && $existing->expires_at->isPast()) {
                        $existing->update([
                            'status' => RishtaRequest::STATUS_EXPIRED,
                            'active_pair_hash' => null,
                        ]);
                    } else {
                        // Request is currently active
                        if ($existing->status === RishtaRequest::STATUS_ACCEPTED) {
                            abort(Response::HTTP_CONFLICT, 'ACTIVE_REQUEST_EXISTS:A rishta connection is already accepted and active between both candidates.');
                        } elseif ($existing->sender_id === $receiver->id) {
                            abort(Response::HTTP_CONFLICT, 'ACTIVE_REQUEST_EXISTS:This candidate has already sent you a formal Rishta proposal. Please check your Proposals tab to view and respond to their proposal.');
                        } else {
                            abort(Response::HTTP_CONFLICT, 'ACTIVE_REQUEST_EXISTS:You already have a pending proposal with this candidate. Please check your Proposals tab.');
                        }
                    }
                }

                // Create new request with proposal questions and pending admin review
                $created = RishtaRequest::create([
                    'request_code' => RishtaRequest::generateUniqueRequestCode(),
                    'sender_id' => $sender->id,
                    'receiver_id' => $receiver->id,
                    'status' => RishtaRequest::STATUS_PENDING,
                    'sender_intro' => $request->input('sender_intro'),
                    'sender_questions' => $request->input('sender_questions'),
                    'admin_status' => RishtaRequest::ADMIN_STATUS_PENDING,
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

        // Note: Recipient will receive formal notification once admin reviews and approves the proposal.

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Rishta proposal submitted successfully. It will be delivered to the candidate once reviewed by our moderation team.',
            Response::HTTP_CREATED
        );
    }

    /**
     * Get aggregate badge and proposal counts for the current user.
     */
    public function counts(Request $request): JsonResponse
    {
        $user = $request->user();

        // Pending received proposals that need user's action
        $pendingReceived = RishtaRequest::where('receiver_id', $user->id)
            ->where('status', RishtaRequest::STATUS_PENDING)
            ->where('admin_status', RishtaRequest::ADMIN_STATUS_APPROVED)
            ->count();

        // Total received proposals
        $totalReceived = RishtaRequest::where('receiver_id', $user->id)
            ->where(function ($q) {
                $q->where(function ($sub) {
                    $sub->where('status', RishtaRequest::STATUS_PENDING)
                        ->where('admin_status', RishtaRequest::ADMIN_STATUS_APPROVED);
                })->orWhere('status', '!=', RishtaRequest::STATUS_PENDING);
            })
            ->count();

        // Sent proposals count
        $sent = RishtaRequest::where('sender_id', $user->id)->count();

        // Assisted inquiries count
        $assistedInquiries = \App\Models\AssistedListingInterest::where('user_id', $user->id)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'pending_received' => $pendingReceived,
                'received' => $totalReceived,
                'sent' => $sent,
                'assisted_inquiries' => $assistedInquiries,
            ],
        ]);
    }

    /**
     * Get paginated list of all requests (or filtered by type=sent|received).
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->input('type');
        if ($type === 'received') {
            return $this->received($request);
        }
        if ($type === 'sent') {
            return $this->sent($request);
        }

        $user = $request->user();
        $perPage = $request->integer('per_page', 20);
        if ($perPage < 1 || $perPage > 50) {
            $perPage = 20;
        }

        $query = RishtaRequest::query()
            ->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere(function ($recv) use ($user) {
                      $recv->where('receiver_id', $user->id)
                           ->where(function ($sub) {
                               $sub->where(function ($p) {
                                   $p->where('status', RishtaRequest::STATUS_PENDING)
                                     ->where('admin_status', RishtaRequest::ADMIN_STATUS_APPROVED);
                               })
                               ->orWhere('status', '!=', RishtaRequest::STATUS_PENDING);
                           });
                  });
            })
            ->with(['sender.profile', 'receiver.profile']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $paginator = $query->orderBy('created_at', 'desc')->paginate($perPage);

        foreach ($paginator->items() as $item) {
            $item->checkAndApplyLazyExpiration();
        }

        return response()->json([
            'success' => true,
            'message' => 'Proposals retrieved successfully.',
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
            ->where(function ($q) {
                // Initial proposals must be approved before candidate sees them
                $q->where(function ($sub) {
                    $sub->where('status', RishtaRequest::STATUS_PENDING)
                        ->where('admin_status', RishtaRequest::ADMIN_STATUS_APPROVED);
                })
                // Once accepted or interacted with, keep visible even if pending_review or needs_revision
                ->orWhere('status', '!=', RishtaRequest::STATUS_PENDING);
            })
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

        $todayRequestsCount = RishtaRequest::where('sender_id', $user->id)
            ->where('created_at', '>=', Carbon::now()->startOfDay())
            ->count();

        return response()->json([
            'success' => true,
            'message' => 'Sent requests retrieved successfully.',
            'data' => RishtaRequestResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'daily_limit' => 3,
                'daily_requests_remaining' => max(0, 3 - $todayRequestsCount),
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

        // Identity Verification Gate: Recipient must be verified (CNIC + Live Selfie) before accepting
        if (!$user->isIdentityVerified()) {
            $verification = $user->latestIdentityVerification();
            return $this->errorResponse(
                'Identity verification (CNIC + Live Selfie) is required before accepting a Rishta request.',
                [
                    'identity_verified' => false,
                    'verification_status' => $verification ? $verification->status : 'none',
                    'rejection_reason' => $verification ? $verification->rejection_reason : null,
                ],
                Response::HTTP_FORBIDDEN,
                'IDENTITY_VERIFICATION_REQUIRED'
            );
        }

        // Lazy expiration check
        $rishtaRequest->checkAndApplyLazyExpiration();

        // Moderation check: proposal must be approved by admin before initial acceptance
        if ($rishtaRequest->status === RishtaRequest::STATUS_PENDING && $rishtaRequest->admin_status === RishtaRequest::ADMIN_STATUS_PENDING) {
            return $this->errorResponse(
                'This proposal is currently awaiting administrative approval before it can be accepted.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'PROPOSAL_PENDING_APPROVAL'
            );
        }

        $request->validate([
            'receiver_intro' => ['nullable', 'string', 'max:2500'],
            'receiver_answers' => ['nullable', 'string', 'max:2500'],
            'receiver_questions' => ['nullable', 'string', 'max:2500'],
        ]);

        $rishtaRequest->update([
            'status' => RishtaRequest::STATUS_ACCEPTED,
            'admin_status' => RishtaRequest::ADMIN_STATUS_PENDING,
            'admin_notes' => null,
            'receiver_intro' => $request->input('receiver_intro'),
            'receiver_answers' => $request->input('receiver_answers'),
            'receiver_questions' => $request->input('receiver_questions'),
            'accepted_at' => $rishtaRequest->accepted_at ?? Carbon::now(),
            // active_pair_hash remains intact to prevent concurrent requests while accepted
        ]);

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);
        event(new RishtaRequestAccepted($rishtaRequest));

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Proposal accepted and your response has been submitted for moderation review. It will be delivered to the candidate upon approval.'
        );
    }

    /**
     * Sender replies to receiver's counter-questions.
     */
    public function reply(Request $request, string $request_code): JsonResponse
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

        // Only original sender can answer candidate's counter-questions
        if ($user->id !== $rishtaRequest->sender_id) {
            return $this->errorResponse(
                'Only the sender can answer candidate counter-questions.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_ACTION'
            );
        }

        if ($rishtaRequest->status !== RishtaRequest::STATUS_ACCEPTED) {
            return $this->errorResponse(
                'You can only answer counter-questions for accepted proposals.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_REQUEST_STATUS'
            );
        }

        $request->validate([
            'sender_answers' => ['required', 'string', 'min:3', 'max:2500'],
        ], [
            'sender_answers.required' => 'Please write your answers to the candidate\'s questions.',
            'sender_answers.min' => 'Answers must be at least 3 characters.',
        ]);

        $rishtaRequest->update([
            'sender_answers' => $request->input('sender_answers'),
            'admin_status' => RishtaRequest::ADMIN_STATUS_PENDING,
            'admin_notes' => null,
        ]);

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Your answers have been submitted for moderation review. They will be delivered to the candidate once approved by admin.'
        );
    }

    /**
     * Edit initial proposal intro and questions if admin requested revision.
     */
    public function editProposal(Request $request, string $request_code): JsonResponse
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

        if ($user->id !== $rishtaRequest->sender_id) {
            return $this->errorResponse(
                'Only the sender can edit this proposal.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_ACTION'
            );
        }

        $request->validate([
            'sender_intro' => ['nullable', 'string', 'max:2500'],
            'sender_questions' => ['nullable', 'string', 'max:2500'],
        ]);

        $rishtaRequest->update([
            'sender_intro' => $request->input('sender_intro'),
            'sender_questions' => $request->input('sender_questions'),
            'admin_status' => RishtaRequest::ADMIN_STATUS_PENDING,
            'admin_notes' => null,
        ]);

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Your proposal has been updated and resubmitted for admin review.'
        );
    }

    /**
     * Mutual trust gate: Request photo or CNIC verification before paying contact unlock fee.
     */
    public function requestVerification(Request $request, string $request_code): JsonResponse
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

        if ($user->id !== $rishtaRequest->sender_id && $user->id !== $rishtaRequest->receiver_id) {
            return $this->errorResponse(
                'Unauthorized to request verification for this proposal.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_ACTION'
            );
        }

        $request->validate([
            'type' => ['required', 'string', 'in:photo,nic'],
        ]);

        $type = $request->input('type');
        if ($type === 'photo') {
            $isSender = ($user->id === $rishtaRequest->sender_id);
            if ($isSender) {
                $rishtaRequest->update([
                    'sender_requested_photo' => true,
                    'photo_request_status' => 'requested',
                    'photo_requested_by' => $user->id,
                ]);
            } else {
                $rishtaRequest->update([
                    'receiver_requested_photo' => true,
                    'photo_request_status' => 'requested',
                    'photo_requested_by' => $user->id,
                ]);
            }
            $msg = 'Photo exchange requested. The candidate will be notified to review and exchange photos.';
        } else {
            $rishtaRequest->update([
                'nic_request_status' => 'requested',
                'nic_requested_by' => $user->id,
            ]);
            $msg = 'CNIC verification requested. The candidate has been requested to share their verification status.';
        }

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            $msg
        );
    }

    /**
     * Upload and share private photo for a proposal.
     */
    public function uploadPhoto(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::where('request_code', $request_code)->first();

        if (!$rishtaRequest) {
            return $this->errorResponse('The requested Rishta request was not found.', [], Response::HTTP_NOT_FOUND, 'REQUEST_NOT_FOUND');
        }

        if ($user->id !== $rishtaRequest->sender_id && $user->id !== $rishtaRequest->receiver_id) {
            return $this->errorResponse('Unauthorized to share photo for this proposal.', [], Response::HTTP_FORBIDDEN, 'UNAUTHORIZED_ACTION');
        }

        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ], [
            'photo.required' => 'Please select a photo to upload.',
            'photo.image' => 'The file must be an image (JPEG, PNG, WEBP).',
            'photo.max' => 'Photo size must not exceed 5MB.',
        ]);

        $file = $request->file('photo');
        $filename = 'proposal_photo_' . $rishtaRequest->request_code . '_' . ($user->id === $rishtaRequest->sender_id ? 'sender' : 'receiver') . '_' . time() . '.' . $file->getClientOriginalExtension();
        $storedPath = $file->storeAs('private/proposal_photos', $filename, 'local');

        if ($user->id === $rishtaRequest->sender_id) {
            $rishtaRequest->update([
                'sender_photo_path' => $storedPath,
                'sender_photo_moderation_status' => 'pending_review',
                'sender_photo_rejection_notes' => null,
                'photo_request_status' => !empty($rishtaRequest->receiver_photo_path) ? 'both_shared' : 'sender_shared',
                'photo_moderation_status' => 'pending_review',
            ]);
        } else {
            $rishtaRequest->update([
                'receiver_photo_path' => $storedPath,
                'receiver_photo_moderation_status' => 'pending_review',
                'receiver_photo_rejection_notes' => null,
                'photo_request_status' => !empty($rishtaRequest->sender_photo_path) ? 'both_shared' : 'receiver_shared',
                'photo_moderation_status' => 'pending_review',
            ]);
        }

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Your photo has been securely uploaded and submitted for administrator quality review. Once approved, the candidate can view it.'
        );
    }

    /**
     * View candidate's shared private photo securely (Moderated & Paid).
     */
    public function viewPhoto(Request $request, string $request_code)
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::where('request_code', $request_code)->first();

        if (!$rishtaRequest) {
            abort(404, 'Proposal not found.');
        }

        if ($user->id !== $rishtaRequest->sender_id && $user->id !== $rishtaRequest->receiver_id && !$user->isAdmin()) {
            abort(403, 'Unauthorized to view photo for this proposal.');
        }

        // If current user is sender, they view receiver's photo; if receiver, they view sender's photo
        $isSender = ($user->id === $rishtaRequest->sender_id);
        $photoPath = $isSender
            ? $rishtaRequest->receiver_photo_path
            : $rishtaRequest->sender_photo_path;

        if (empty($photoPath)) {
            abort(404, 'Candidate has not shared a photo yet.');
        }

        // Access enforcement: Non-admins must wait for admin approval and pay photo fee
        if (!$user->isAdmin()) {
            $candModStatus = $isSender 
                ? ($rishtaRequest->receiver_photo_moderation_status !== 'none' ? $rishtaRequest->receiver_photo_moderation_status : $rishtaRequest->photo_moderation_status)
                : ($rishtaRequest->sender_photo_moderation_status !== 'none' ? $rishtaRequest->sender_photo_moderation_status : $rishtaRequest->photo_moderation_status);

            if ($candModStatus !== 'approved') {
                abort(403, 'Candidate photo is currently undergoing administrator quality review.');
            }

            $userPaid = $isSender
                ? ($rishtaRequest->sender_photo_paid || ($rishtaRequest->photo_paid && $rishtaRequest->photo_paid_by === $user->id))
                : ($rishtaRequest->receiver_photo_paid || ($rishtaRequest->photo_paid && $rishtaRequest->photo_paid_by === $user->id));

            if (!$userPaid) {
                abort(403, 'Photo viewing fee has not been paid yet.');
            }
        }

        $fallbacks = [
            storage_path('app/private/' . $photoPath),
            storage_path('app/' . $photoPath),
        ];

        // Format base64 support for mobile React Native clients
        if ($request->query('format') === 'base64') {
            $bytes = null;
            $mime = 'image/jpeg';
            if (Storage::disk('local')->exists($photoPath)) {
                $bytes = Storage::disk('local')->get($photoPath);
                $mime = Storage::disk('local')->mimeType($photoPath) ?: 'image/jpeg';
            } else {
                foreach ($fallbacks as $fallback) {
                    if (file_exists($fallback)) {
                        $bytes = file_get_contents($fallback);
                        $mime = mime_content_type($fallback) ?: 'image/jpeg';
                        break;
                    }
                }
            }
            if ($bytes) {
                return response()->json([
                    'success' => true,
                    'mime_type' => $mime,
                    'base64' => 'data:' . $mime . ';base64,' . base64_encode($bytes),
                ]);
            }
            abort(404, 'Candidate photo file not found.');
        }

        if (Storage::disk('local')->exists($photoPath)) {
            $mimeType = Storage::disk('local')->mimeType($photoPath) ?: 'image/jpeg';
            return Storage::disk('local')->response($photoPath, null, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline',
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
            ]);
        }

        foreach ($fallbacks as $fallback) {
            if (file_exists($fallback)) {
                return response()->file($fallback, [
                    'Content-Type' => mime_content_type($fallback) ?: 'image/jpeg',
                    'Content-Disposition' => 'inline',
                    'X-Content-Type-Options' => 'nosniff',
                    'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
                ]);
            }
        }

        abort(404, 'Candidate photo file not found.');
    }

    /**
     * View user's own uploaded photo.
     */
    public function viewMyPhoto(Request $request, string $request_code)
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::where('request_code', $request_code)->first();

        if (!$rishtaRequest) {
            abort(404, 'Proposal not found.');
        }

        if ($user->id !== $rishtaRequest->sender_id && $user->id !== $rishtaRequest->receiver_id) {
            abort(403, 'Unauthorized.');
        }

        $photoPath = ($user->id === $rishtaRequest->sender_id)
            ? $rishtaRequest->sender_photo_path
            : $rishtaRequest->receiver_photo_path;

        if (empty($photoPath)) {
            abort(404, 'You have not uploaded a photo yet.');
        }

        if (Storage::disk('local')->exists($photoPath)) {
            $mimeType = Storage::disk('local')->mimeType($photoPath) ?: 'image/jpeg';
            return Storage::disk('local')->response($photoPath, null, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline',
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
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
                    'X-Content-Type-Options' => 'nosniff',
                    'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
                ]);
            }
        }

        abort(404, 'Your photo file could not be found.');
    }

    /**
     * Share verified CNIC badge & verification status with candidate.
     */
    public function shareNic(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::where('request_code', $request_code)->first();

        if (!$rishtaRequest) {
            return $this->errorResponse('The requested Rishta request was not found.', [], Response::HTTP_NOT_FOUND, 'REQUEST_NOT_FOUND');
        }

        if ($user->id !== $rishtaRequest->sender_id && $user->id !== $rishtaRequest->receiver_id) {
            return $this->errorResponse('Unauthorized.', [], Response::HTTP_FORBIDDEN, 'UNAUTHORIZED_ACTION');
        }

        if ($user->id === $rishtaRequest->sender_id) {
            $rishtaRequest->update([
                'nic_shared_by_sender' => true,
                'nic_request_status' => 'shared',
            ]);
        } else {
            $rishtaRequest->update([
                'nic_shared_by_receiver' => true,
                'nic_request_status' => 'shared',
            ]);
        }

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);

        return $this->successResponse(
            new RishtaRequestResource($rishtaRequest),
            'Your verified CNIC status has been shared with the candidate.'
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

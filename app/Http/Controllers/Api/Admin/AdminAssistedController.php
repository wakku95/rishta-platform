<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateAssistedProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Http\Resources\PublicProfileResource;
use App\Http\Resources\RishtaRequestResource;
use App\Models\Profile;
use App\Models\ProfilePreference;
use App\Models\RishtaRequest;
use App\Models\User;
use App\Notifications\AssistedProfileConfirmationNotification;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AdminAssistedController extends Controller
{
    use ApiResponse;

    /**
     * Admin creates a user + profile on behalf of a person.
     */
    public function createProfile(CreateAssistedProfileRequest $request): JsonResponse
    {
        $admin = $request->user();
        $data = $request->validated();

        $token = Str::random(64);

        $profile = DB::transaction(function () use ($data, $admin, $token) {
            // 1. Create User (password empty until confirmed)
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => '', // They will set this themselves
                'role' => 'user',
                'status' => 'active',
                'email_verified_at' => null, // Not verified until confirmed
            ]);

            // 2. Create Profile
            $profileData = collect($data)->only([
                'gender', 'date_of_birth', 'religion', 'sect', 'city',
                'education', 'profession', 'marital_status', 'height',
                'about', 'family_background', 'managed_by'
            ])->toArray();

            $profileData['user_id'] = $user->id;
            $profileData['profile_status'] = 'assisted_pending';
            $profileData['created_by_admin_id'] = $admin->id;
            $profileData['confirmation_token'] = $token;
            $profileData['confirmation_expires_at'] = Carbon::now()->addDays(7);

            $profile = Profile::create($profileData);

            // 3. Create Preferences (if provided)
            $prefData = collect($data)->only([
                'preferred_gender', 'min_age', 'max_age', 'preferred_cities',
                'preferred_religion', 'preferred_sect', 'min_height', 'max_height',
                'preferred_education', 'preferred_marital_status'
            ])->filter(fn($val) => $val !== null)->toArray();

            if (!empty($prefData)) {
                $profile->preferences()->create($prefData);
            }

            return $profile;
        });

        $profile->load(['user', 'preferences']);

        // 4. Send Confirmation Notification
        try {
            $profile->user->notify(new AssistedProfileConfirmationNotification($profile, $token));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to send assisted confirmation email: {$e->getMessage()}");
        }

        return $this->successResponse(
            new ProfileResource($profile),
            'Assisted profile created successfully. Confirmation email sent to the user.',
            Response::HTTP_CREATED
        );
    }

    /**
     * List all admin-created profiles with filters.
     */
    public function listAssistedProfiles(Request $request): JsonResponse
    {
        $query = Profile::query()
            ->whereNotNull('created_by_admin_id')
            ->with(['user:id,name,email', 'createdByAdmin:id,name']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('profile_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->input('status')) {
            if (in_array($status, ['assisted_pending', 'active', 'suspended', 'hidden'])) {
                $query->where('profile_status', $status);
            }
        }

        if ($request->has('is_confirmed')) {
            $isConfirmed = filter_var($request->input('is_confirmed'), FILTER_VALIDATE_BOOLEAN);
            if ($isConfirmed) {
                $query->whereNotNull('confirmed_at');
            } else {
                $query->whereNull('confirmed_at');
            }
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $profiles = $query->latest()->paginate($perPage);

        return $this->successResponse($profiles, 'Assisted profiles retrieved.');
    }

    /**
     * View specific assisted profile detail.
     */
    public function showAssistedProfile(int $id): JsonResponse
    {
        $profile = Profile::with(['user', 'preferences', 'createdByAdmin'])->find($id);

        if (!$profile || !$profile->isAssistedProfile()) {
            return $this->errorResponse('Assisted profile not found.', [], Response::HTTP_NOT_FOUND, 'PROFILE_NOT_FOUND');
        }

        return $this->successResponse(new ProfileResource($profile), 'Assisted profile details retrieved.');
    }

    /**
     * Admin edits an assisted profile (with audit logging).
     */
    public function updateAssistedProfile(Request $request, int $id): JsonResponse
    {
        $profile = Profile::find($id);

        if (!$profile || !$profile->isAssistedProfile()) {
            return $this->errorResponse('Assisted profile not found.', [], Response::HTTP_NOT_FOUND, 'PROFILE_NOT_FOUND');
        }

        $data = $request->except(['user_id', 'profile_code', 'created_by_admin_id', 'confirmation_token', 'confirmed_at', 'confirmation_expires_at']);
        
        $changes = [];
        foreach ($data as $key => $value) {
            if (in_array($key, $profile->getFillable()) && $profile->{$key} !== $value) {
                $changes[$key] = [
                    'old' => $profile->{$key},
                    'new' => $value
                ];
                $profile->{$key} = $value;
            }
        }

        if (!empty($changes)) {
            $profile->save();
            \Illuminate\Support\Facades\Log::info("[Admin] Assisted Profile #{$profile->profile_code} modified by admin user #{$request->user()->id}. Changes: " . json_encode($changes));
        }

        return $this->successResponse(new ProfileResource($profile), 'Assisted profile updated successfully.');
    }

    /**
     * Resend confirmation email (generates new token).
     */
    public function resendConfirmation(Request $request, int $id): JsonResponse
    {
        $profile = Profile::find($id);

        if (!$profile || !$profile->isAssistedProfile()) {
            return $this->errorResponse('Assisted profile not found.', [], Response::HTTP_NOT_FOUND, 'PROFILE_NOT_FOUND');
        }

        if ($profile->isConfirmed()) {
            return $this->errorResponse('Profile has already been confirmed.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'ALREADY_CONFIRMED');
        }

        $token = Str::random(64);
        $profile->update([
            'confirmation_token' => $token,
            'confirmation_expires_at' => Carbon::now()->addDays(7),
        ]);

        try {
            $profile->user->notify(new AssistedProfileConfirmationNotification($profile, $token));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to resend assisted confirmation email: {$e->getMessage()}");
            return $this->errorResponse('Failed to send email. Please check server logs.', [], Response::HTTP_INTERNAL_SERVER_ERROR, 'EMAIL_FAILED');
        }

        return $this->successResponse(null, 'Confirmation email resent successfully.');
    }

    /**
     * Admin searches compatible profiles for an assisted user.
     */
    public function searchMatches(Request $request, int $id): JsonResponse
    {
        $profile = Profile::with('preferences')->find($id);

        if (!$profile || !$profile->isAssistedProfile()) {
            return $this->errorResponse('Assisted profile not found.', [], Response::HTTP_NOT_FOUND, 'PROFILE_NOT_FOUND');
        }

        // Use same basic discovery query logic as DiscoveryController, but configured from preferences
        $query = Profile::query()
            ->where('profile_status', 'active')
            ->where('id', '!=', $profile->id)
            ->whereHas('user', function ($q) {
                $q->where('status', '!=', 'suspended')
                  ->whereNotNull('email_verified_at');
            })
            // Exclude users who already have an active/past request with this assisted profile
            ->whereNotIn('user_id', function ($q) use ($profile) {
                $q->select('receiver_id')
                  ->from('rishta_requests')
                  ->where('sender_id', $profile->user_id);
            })
            ->whereNotIn('user_id', function ($q) use ($profile) {
                $q->select('sender_id')
                  ->from('rishta_requests')
                  ->where('receiver_id', $profile->user_id);
            });

        $prefs = $profile->preferences;
        if ($prefs) {
            if ($prefs->preferred_gender) {
                $query->where('gender', $prefs->preferred_gender);
            }
            if ($prefs->min_age) {
                // age = floor((now - dob)/365.25) >= min_age  ==> dob <= now - min_age years
                $query->whereDate('date_of_birth', '<=', now()->subYears($prefs->min_age));
            }
            if ($prefs->max_age) {
                // age <= max_age ==> dob > now - (max_age + 1) years
                $query->whereDate('date_of_birth', '>', now()->subYears($prefs->max_age + 1));
            }
            if (!empty($prefs->preferred_cities)) {
                $query->whereIn('city', $prefs->preferred_cities);
            }
            if ($prefs->preferred_religion) {
                $query->where('religion', $prefs->preferred_religion);
            }
        }

        $perPage = min((int) $request->input('per_page', 12), 50);
        $matches = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Matches retrieved successfully.',
            'data' => PublicProfileResource::collection($matches->items()),
            'meta' => [
                'current_page' => $matches->currentPage(),
                'last_page' => $matches->lastPage(),
                'per_page' => $matches->perPage(),
                'total' => $matches->total(),
            ],
        ]);
    }

    /**
     * Admin sends a rishta request on behalf of the assisted user.
     */
    public function sendProposal(Request $request, int $id): JsonResponse
    {
        $admin = $request->user();
        $senderProfile = Profile::find($id);

        if (!$senderProfile || !$senderProfile->isAssistedProfile()) {
            return $this->errorResponse('Assisted profile not found.', [], Response::HTTP_NOT_FOUND, 'PROFILE_NOT_FOUND');
        }

        if (!$senderProfile->isConfirmed() || $senderProfile->profile_status !== 'active') {
            return $this->errorResponse('Assisted profile must be confirmed and active to send proposals.', [], Response::HTTP_FORBIDDEN, 'PROFILE_NOT_READY');
        }

        $request->validate([
            'target_profile_code' => 'required|string|exists:profiles,profile_code'
        ]);

        $targetProfile = Profile::where('profile_code', $request->input('target_profile_code'))
            ->where('profile_status', 'active')
            ->whereHas('user', function ($q) {
                $q->where('status', '!=', 'suspended')->whereNotNull('email_verified_at');
            })->first();

        if (!$targetProfile) {
            return $this->errorResponse('Target profile not found or inactive.', [], Response::HTTP_NOT_FOUND, 'TARGET_NOT_FOUND');
        }

        if ($senderProfile->id === $targetProfile->id) {
            return $this->errorResponse('Cannot send proposal to self.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'CANNOT_REQUEST_SELF');
        }

        $sender = $senderProfile->user;
        $receiver = $targetProfile->user;

        // Check if receiver previously declined sender
        $previouslyDeclined = RishtaRequest::where('sender_id', $sender->id)
            ->where('receiver_id', $receiver->id)
            ->where('status', RishtaRequest::STATUS_DECLINED)
            ->exists();

        if ($previouslyDeclined) {
            return $this->errorResponse('This candidate previously declined this user. Re-requesting is not permitted.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'REQUEST_PREVIOUSLY_DECLINED');
        }

        // Profile Daily Limit (5 per day)
        $todayProfileRequests = RishtaRequest::where('sender_id', $sender->id)
            ->where('created_at', '>=', Carbon::now()->startOfDay())
            ->count();

        if ($todayProfileRequests >= 5) {
            return $this->errorResponse('This profile has reached its daily limit of 5 proposals.', [], Response::HTTP_TOO_MANY_REQUESTS, 'PROFILE_DAILY_LIMIT_REACHED');
        }

        $activePairHash = RishtaRequest::generateActivePairHash($sender->id, $receiver->id);

        try {
            $rishtaRequest = DB::transaction(function () use ($sender, $receiver, $activePairHash, $admin) {
                $existing = RishtaRequest::where('active_pair_hash', $activePairHash)->lockForUpdate()->first();

                if ($existing) {
                    if ($existing->status === RishtaRequest::STATUS_PENDING && $existing->expires_at->isPast()) {
                        $existing->update([
                            'status' => RishtaRequest::STATUS_EXPIRED,
                            'active_pair_hash' => null,
                        ]);
                    } else {
                        abort(Response::HTTP_CONFLICT, 'ACTIVE_REQUEST_EXISTS:A connection is already active between both candidates.');
                    }
                }

                return RishtaRequest::create([
                    'request_code' => RishtaRequest::generateUniqueRequestCode(),
                    'sender_id' => $sender->id,
                    'receiver_id' => $receiver->id,
                    'status' => RishtaRequest::STATUS_PENDING,
                    'active_pair_hash' => $activePairHash,
                    'expires_at' => Carbon::now()->addDays(RishtaRequest::EXPIRATION_DAYS),
                    'initiated_by_admin_id' => $admin->id,
                ]);
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $parts = explode(':', $e->getMessage(), 2);
            return $this->errorResponse($parts[1] ?? $e->getMessage(), [], $e->getStatusCode(), $parts[0] ?? 'CONFLICT');
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return $this->errorResponse('A request is already in progress between both candidates.', [], Response::HTTP_CONFLICT, 'ACTIVE_REQUEST_EXISTS');
        }

        $rishtaRequest->load(['sender.profile', 'receiver.profile']);
        event(new \App\Events\RishtaRequestSent($rishtaRequest));

        try {
            $receiver->notify(new \App\Notifications\NewRishtaRequestNotification($rishtaRequest));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to send new rishta request notification: {$e->getMessage()}");
        }

        return $this->successResponse(new RishtaRequestResource($rishtaRequest), 'Proposal sent successfully on behalf of user.', Response::HTTP_CREATED);
    }

    /**
     * List all proposals sent for an assisted user.
     */
    public function listProposals(Request $request, int $id): JsonResponse
    {
        $profile = Profile::find($id);

        if (!$profile || !$profile->isAssistedProfile()) {
            return $this->errorResponse('Assisted profile not found.', [], Response::HTTP_NOT_FOUND, 'PROFILE_NOT_FOUND');
        }

        $perPage = min((int) $request->input('per_page', 15), 50);

        $query = RishtaRequest::query()
            ->where('sender_id', $profile->user_id)
            ->with(['sender.profile', 'receiver.profile', 'initiatedByAdmin:id,name']);
            
        $paginator = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $mappedProposals = collect($paginator->items())->map(function ($item) {
            $item->checkAndApplyLazyExpiration();
            return [
                'request_code' => $item->request_code,
                'status' => $item->status,
                'created_at' => $item->created_at?->toIso8601String(),
                'receiver_profile_code' => $item->receiver->profile->profile_code ?? null,
                'receiver_name' => $item->receiver->name ?? null,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Proposals retrieved successfully.',
            'data' => $mappedProposals,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}

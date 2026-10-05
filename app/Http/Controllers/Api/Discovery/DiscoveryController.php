<?php

namespace App\Http\Controllers\Api\Discovery;

use App\Constants\ProfileOptions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\SearchProfilesRequest;
use App\Http\Resources\PublicProfileResource;
use App\Models\Profile;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DiscoveryController extends Controller
{
    use ApiResponse;

    /**
     * Search and filter active candidate profiles with server-side pagination.
     */
    public function index(SearchProfilesRequest $request): JsonResponse
    {
        $user = $request->user('sanctum');

        // 1. If authenticated, enforce email verification and active status
        if ($user) {
            if (!$user->hasVerifiedEmail()) {
                return $this->errorResponse(
                    'Your email address must be verified before accessing profile discovery.',
                    ['email' => ['Email verification is required to discover candidate profiles.']],
                    Response::HTTP_FORBIDDEN,
                    'EMAIL_NOT_VERIFIED'
                );
            }

            if ($user->status === 'suspended') {
                return $this->errorResponse(
                    'Your account has been suspended.',
                    [],
                    Response::HTTP_FORBIDDEN,
                    'ACCOUNT_SUSPENDED'
                );
            }
        }

        // 2. Base Query: Active profiles, excluding suspended/unverified users
        $query = Profile::query()
            ->with('user')
            ->where('profile_status', 'active')
            ->whereHas('user', function ($q) {
                $q->where('status', '!=', 'suspended')
                    ->whereNotNull('email_verified_at');
            });

        // Exclude current user's own profile and any hidden profiles if authenticated
        if ($user) {
            $query->where('user_id', '!=', $user->id);

            if ($user->profile) {
                $hiddenProfileIds = \App\Models\MatchExclusion::where('source_type', 'profile')
                    ->where('source_id', $user->profile->id)
                    ->where('target_type', 'profile')
                    ->pluck('target_id');

                if ($hiddenProfileIds->isNotEmpty()) {
                    $query->whereNotIn('id', $hiddenProfileIds);
                }
            }
        }

        // 3. Demographic & Code Filters
        if ($request->filled('profile_code')) {
            $code = trim($request->profile_code);
            $query->where('profile_code', 'like', "%{$code}%");
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        // Age boundaries (calculated against date_of_birth)
        if ($request->filled('min_age')) {
            $minAgeDate = now()->subYears($request->integer('min_age'))->toDateString();
            $query->where('date_of_birth', '<=', $minAgeDate);
        }

        if ($request->filled('max_age')) {
            $maxAgeDate = now()->subYears($request->integer('max_age') + 1)->addDay()->toDateString();
            $query->where('date_of_birth', '>=', $maxAgeDate);
        }

        // Faith Filters
        if ($request->filled('religion')) {
            $query->where('religion', $request->religion);
        }

        if ($request->filled('sect')) {
            $query->where('sect', $request->sect);
        }

        // Location & Education & Profession & Status Filters
        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        if ($request->filled('education')) {
            $qualifyingEducations = ProfileOptions::getEducationsAtOrAbove($request->education);
            $query->whereIn('education', $qualifyingEducations);
        }

        if ($request->filled('profession')) {
            $query->where('profession', $request->profession);
        }

        if ($request->filled('marital_status')) {
            $query->where('marital_status', $request->marital_status);
        }

        // Height Range (stored in cm)
        if ($request->filled('min_height')) {
            $query->where('height', '>=', $request->integer('min_height'));
        }

        if ($request->filled('max_height')) {
            $query->where('height', '<=', $request->integer('max_height'));
        }

        // 5. Default Ordering: Recently updated active profiles first
        $query->orderBy('updated_at', 'desc');

        // 6. Server-side Pagination
        $perPage = $request->integer('per_page', 12);
        if ($perPage < 1 || $perPage > 50) {
            $perPage = 12;
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Candidate profiles retrieved successfully.',
            'data' => PublicProfileResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * View an active public candidate profile by unique profile code.
     */
    public function show(Request $request, string $profile_code): JsonResponse
    {
        $user = $request->user('sanctum');

        // 1. If authenticated, enforce email verification and account status
        if ($user) {
            if (!$user->hasVerifiedEmail()) {
                return $this->errorResponse(
                    'Your email address must be verified before accessing profile details.',
                    ['email' => ['Email verification is required to view candidate profiles.']],
                    Response::HTTP_FORBIDDEN,
                    'EMAIL_NOT_VERIFIED'
                );
            }

            if ($user->status === 'suspended') {
                return $this->errorResponse(
                    'Your account has been suspended.',
                    [],
                    Response::HTTP_FORBIDDEN,
                    'ACCOUNT_SUSPENDED'
                );
            }
        }

        // 2. Retrieve active profile
        $profile = Profile::query()
            ->with('user')
            ->where('profile_code', $profile_code)
            ->where('profile_status', 'active')
            ->whereHas('user', function ($q) {
                $q->where('status', '!=', 'suspended')
                    ->whereNotNull('email_verified_at');
            })
            ->first();

        if (!$profile) {
            return $this->errorResponse(
                'The requested candidate profile was not found or is no longer active.',
                [],
                Response::HTTP_NOT_FOUND,
                'PROFILE_NOT_FOUND'
            );
        }

        $profileData = (new PublicProfileResource($profile))->toArray($request);

        // 3. Viewer context: If guest, mark requires_auth: true and provide empty viewer context
        if (!$user) {
            $profileData['viewer_context'] = [
                'is_guest' => true,
                'is_shortlisted' => false,
                'active_request' => null,
                'daily_requests_remaining' => 0,
            ];

            return $this->successResponse(
                $profileData,
                'Candidate profile teaser retrieved successfully.'
            );
        }

        // 4. Authenticated viewer context: shortlist status and active rishta request
        $isShortlisted = \App\Models\Shortlist::where('user_id', $user->id)
            ->where('profile_id', $profile->id)
            ->exists();

        $activePairHash = \App\Models\RishtaRequest::generateActivePairHash($user->id, $profile->user_id);
        $activeRequest = \App\Models\RishtaRequest::where('active_pair_hash', $activePairHash)->first();

        // If found, check lazy expiration
        if ($activeRequest) {
            $activeRequest->checkAndApplyLazyExpiration();
            if ($activeRequest->status === \App\Models\RishtaRequest::STATUS_EXPIRED) {
                $activeRequest = null;
            }
        }

        $activeRequestData = null;
        if ($activeRequest) {
            $activeRequestData = [
                'request_code' => $activeRequest->request_code,
                'status' => $activeRequest->status,
                'is_sender' => ($activeRequest->sender_id === $user->id),
                'expires_at' => $activeRequest->expires_at?->toIso8601String(),
                'created_at' => $activeRequest->created_at?->toIso8601String(),
            ];
        }

        $todayRequestsCount = \App\Models\RishtaRequest::where('sender_id', $user->id)
            ->where('created_at', '>=', \Illuminate\Support\Carbon::now()->startOfDay())
            ->count();

        $profileData['viewer_context'] = [
            'is_guest' => false,
            'is_shortlisted' => $isShortlisted,
            'active_request' => $activeRequestData,
            'daily_requests_remaining' => max(0, 3 - $todayRequestsCount),
        ];

        return $this->successResponse(
            $profileData,
            'Candidate profile retrieved successfully.'
        );
    }

    /**
     * Privately hide a candidate profile or assisted listing from discovery feed.
     */
    public function hideProfile(Request $request, string $profile_code): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->profile) {
            return $this->errorResponse('A completed profile is required to hide candidates.', [], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $targetProfile = Profile::where('profile_code', $profile_code)->first();
        if ($targetProfile) {
            \App\Models\MatchExclusion::firstOrCreate([
                'source_type' => 'profile',
                'source_id'   => $user->profile->id,
                'target_type' => 'profile',
                'target_id'   => $targetProfile->id,
            ], [
                'excluded_by_user_id' => $user->id,
                'reason'              => 'not_interested',
            ]);

            return $this->successResponse(null, 'Profile hidden from your discovery feed.');
        }

        $targetListing = \App\Models\AssistedListing::where('listing_code', $profile_code)->first();
        if ($targetListing) {
            \App\Models\MatchExclusion::firstOrCreate([
                'source_type' => 'profile',
                'source_id'   => $user->profile->id,
                'target_type' => 'assisted',
                'target_id'   => $targetListing->id,
            ], [
                'excluded_by_user_id' => $user->id,
                'reason'              => 'not_interested',
            ]);

            return $this->successResponse(null, 'Listing hidden from your discovery feed.');
        }

        return $this->errorResponse('Candidate profile or listing not found.', [], Response::HTTP_NOT_FOUND);
    }

    /**
     * Unhide a previously hidden candidate profile or assisted listing.
     */
    public function unhideProfile(Request $request, string $profile_code): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->profile) {
            return $this->errorResponse('A completed profile is required.', [], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $targetProfile = Profile::where('profile_code', $profile_code)->first();
        if ($targetProfile) {
            \App\Models\MatchExclusion::where('source_type', 'profile')
                ->where('source_id', $user->profile->id)
                ->where('target_type', 'profile')
                ->where('target_id', $targetProfile->id)
                ->delete();

            return $this->successResponse(null, 'Profile unhidden.');
        }

        $targetListing = \App\Models\AssistedListing::where('listing_code', $profile_code)->first();
        if ($targetListing) {
            \App\Models\MatchExclusion::where('source_type', 'profile')
                ->where('source_id', $user->profile->id)
                ->where('target_type', 'assisted')
                ->where('target_id', $targetListing->id)
                ->delete();

            return $this->successResponse(null, 'Listing unhidden.');
        }

        return $this->successResponse(null, 'No exclusion record found.');
    }

    /**
     * List all candidate profiles and listings hidden by the user.
     */
    public function hiddenProfiles(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->profile) {
            return $this->successResponse([], 'No hidden profiles.');
        }

        $exclusions = \App\Models\MatchExclusion::where('source_type', 'profile')
            ->where('source_id', $user->profile->id)
            ->latest()
            ->get();

        $items = [];
        foreach ($exclusions as $ex) {
            if ($ex->target_type === 'profile') {
                $p = Profile::find($ex->target_id);
                if ($p) {
                    $items[] = [
                        'code' => $p->profile_code,
                        'type' => 'registered',
                        'gender' => $p->gender,
                        'age' => $p->age,
                        'city' => $p->city,
                        'profession' => $p->profession,
                        'education' => $p->education,
                        'hidden_at' => $ex->created_at->toIso8601String(),
                    ];
                }
            } elseif ($ex->target_type === 'assisted') {
                $l = \App\Models\AssistedListing::find($ex->target_id);
                if ($l) {
                    $items[] = [
                        'code' => $l->listing_code,
                        'type' => 'assisted',
                        'gender' => $l->gender,
                        'age' => $l->age,
                        'city' => $l->city,
                        'profession' => $l->profession,
                        'education' => $l->education,
                        'hidden_at' => $ex->created_at->toIso8601String(),
                    ];
                }
            }
        }

        return $this->successResponse($items, 'Hidden profiles retrieved successfully.');
    }
}

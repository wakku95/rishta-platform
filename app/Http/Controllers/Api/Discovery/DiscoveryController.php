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
        $user = $request->user();

        // 1. Email verification enforcement
        if (!$user->hasVerifiedEmail()) {
            return $this->errorResponse(
                'Your email address must be verified before accessing profile discovery.',
                ['email' => ['Email verification is required to discover candidate profiles.']],
                Response::HTTP_FORBIDDEN,
                'EMAIL_NOT_VERIFIED'
            );
        }

        // 2. Account suspension enforcement
        if ($user->status === 'suspended') {
            return $this->errorResponse(
                'Your account has been suspended.',
                [],
                Response::HTTP_FORBIDDEN,
                'ACCOUNT_SUSPENDED'
            );
        }

        // 3. Base Query: Active profiles, excluding current user, excluding suspended/unverified users
        $query = Profile::query()
            ->with('user')
            ->where('profile_status', 'active')
            ->where('user_id', '!=', $user->id)
            ->whereHas('user', function ($q) {
                $q->where('status', '!=', 'suspended')
                    ->whereNotNull('email_verified_at');
            });

        // 4. Demographic Filters
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
        $user = $request->user();

        // 1. Email verification enforcement
        if (!$user->hasVerifiedEmail()) {
            return $this->errorResponse(
                'Your email address must be verified before accessing profile details.',
                ['email' => ['Email verification is required to view candidate profiles.']],
                Response::HTTP_FORBIDDEN,
                'EMAIL_NOT_VERIFIED'
            );
        }

        // 2. Account suspension enforcement
        if ($user->status === 'suspended') {
            return $this->errorResponse(
                'Your account has been suspended.',
                [],
                Response::HTTP_FORBIDDEN,
                'ACCOUNT_SUSPENDED'
            );
        }

        // 3. Retrieve active profile
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

        // Viewer context: shortlist status and active rishta request
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

        $profileData = (new PublicProfileResource($profile))->toArray($request);
        $profileData['viewer_context'] = [
            'is_shortlisted' => $isShortlisted,
            'active_request' => $activeRequestData,
            'daily_requests_remaining' => max(0, 3 - $todayRequestsCount),
        ];

        return $this->successResponse(
            $profileData,
            'Candidate profile retrieved successfully.'
        );
    }
}

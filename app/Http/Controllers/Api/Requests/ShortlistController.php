<?php

namespace App\Http\Controllers\Api\Requests;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shortlist\CreateShortlistRequest;
use App\Http\Resources\PublicProfileResource;
use App\Models\Profile;
use App\Models\Shortlist;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ShortlistController extends Controller
{
    use ApiResponse;

    /**
     * List user's shortlisted profiles with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $perPage = $request->integer('per_page', 12);
        if ($perPage < 1 || $perPage > 50) {
            $perPage = 12;
        }

        $paginator = Shortlist::query()
            ->where('user_id', $user->id)
            ->with(['profile.user'])
            ->whereHas('profile', function ($q) {
                $q->where('profile_status', 'active')
                    ->whereHas('user', function ($uq) {
                        $uq->where('status', '!=', 'suspended')
                            ->whereNotNull('email_verified_at');
                    });
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $profiles = $paginator->getCollection()->map(function ($item) {
            return new PublicProfileResource($item->profile);
        });

        return response()->json([
            'success' => true,
            'message' => 'Shortlisted profiles retrieved successfully.',
            'data' => $profiles,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Add a candidate profile to user's shortlist.
     */
    public function store(CreateShortlistRequest $request): JsonResponse
    {
        $user = $request->user();
        $profileCode = $request->input('profile_code');

        $profile = Profile::query()
            ->where('profile_code', $profileCode)
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

        // Cannot shortlist own profile
        if ($profile->user_id === $user->id) {
            return $this->errorResponse(
                'You cannot shortlist your own profile.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'CANNOT_SHORTLIST_SELF'
            );
        }

        // Idempotent firstOrCreate
        Shortlist::firstOrCreate([
            'user_id' => $user->id,
            'profile_id' => $profile->id,
        ]);

        return $this->successResponse(
            ['is_shortlisted' => true],
            'Profile added to your shortlist.',
            Response::HTTP_CREATED
        );
    }

    /**
     * Remove a candidate profile from user's shortlist by profile_code.
     */
    public function destroy(Request $request, string $profile_code): JsonResponse
    {
        $user = $request->user();

        $profile = Profile::where('profile_code', $profile_code)->first();

        if ($profile) {
            Shortlist::where('user_id', $user->id)
                ->where('profile_id', $profile->id)
                ->delete();
        }

        return $this->successResponse(
            ['is_shortlisted' => false],
            'Profile removed from your shortlist.'
        );
    }
}

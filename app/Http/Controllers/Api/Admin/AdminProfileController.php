<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminProfileController extends Controller
{
    use ApiResponse;

    /**
     * List candidate profiles with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Profile::query()->with('user:id,name,email,status');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('profile_code', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('profession', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($gender = $request->input('gender')) {
            if (in_array($gender, ['male', 'female'])) {
                $query->where('gender', $gender);
            }
        }

        if ($status = $request->input('status')) {
            if (in_array($status, ['active', 'draft', 'suspended'])) {
                $query->where('profile_status', $status);
            }
        }

        if ($city = $request->input('city')) {
            $query->where('city', 'like', "%{$city}%");
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $profiles = $query->latest()->paginate($perPage);

        return $this->successResponse($profiles, 'Candidate profiles retrieved.');
    }

    /**
     * Get specific candidate profile detail.
     */
    public function show(int $id): JsonResponse
    {
        $profile = Profile::with(['user', 'preferences'])->find($id);

        if (!$profile) {
            return $this->errorResponse('Profile not found.', [], Response::HTTP_NOT_FOUND, 'PROFILE_NOT_FOUND');
        }

        return $this->successResponse($profile, 'Profile details retrieved.');
    }

    /**
     * Update profile moderation status (active, draft, suspended).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'profile_status' => 'required|in:active,draft,suspended',
        ]);

        $profile = Profile::find($id);

        if (!$profile) {
            return $this->errorResponse('Profile not found.', [], Response::HTTP_NOT_FOUND, 'PROFILE_NOT_FOUND');
        }

        $newStatus = $request->input('profile_status');
        $profile->update(['profile_status' => $newStatus]);

        return $this->successResponse([
            'id' => $profile->id,
            'profile_code' => $profile->profile_code,
            'profile_status' => $profile->profile_status,
        ], "Profile status updated to [{$newStatus}].");
    }

    /**
     * Permanently delete profile.
     */
    public function destroy(int $id): JsonResponse
    {
        $profile = Profile::find($id);

        if (!$profile) {
            return $this->errorResponse('Profile not found.', [], Response::HTTP_NOT_FOUND, 'PROFILE_NOT_FOUND');
        }

        $code = $profile->profile_code;
        $profile->delete();

        return $this->successResponse(null, "Candidate profile [{$code}] has been permanently deleted.");
    }
}

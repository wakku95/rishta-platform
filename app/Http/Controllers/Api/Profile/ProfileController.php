<?php

namespace App\Http\Controllers\Api\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\StoreProfileRequest;
use App\Http\Requests\Profile\UpdatePreferencesRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\ProfilePreferenceResource;
use App\Http\Resources\ProfileResource;
use App\Models\Profile;
use App\Models\ProfilePreference;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProfileController extends Controller
{
    use ApiResponse;

    /**
     * Get the authenticated user's matrimonial profile with preferences.
     */
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->profile()->with('preferences')->first();

        if (!$profile) {
            return $this->successResponse(
                null,
                'No profile created yet.',
                Response::HTTP_OK
            );
        }

        return $this->successResponse(
            new ProfileResource($profile),
            'Profile retrieved successfully.'
        );
    }

    /**
     * Create or update the authenticated user's matrimonial profile.
     */
    public function storeOrUpdate(StoreProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validated();
        $isNew = false;

        $profile = $user->profile()->first();

        if (!$profile) {
            $isNew = true;
            $data['user_id'] = $user->id;
            $data['profile_status'] = 'draft';
            $profile = Profile::create($data);
        } else {
            $profile->update($data);
        }

        $profile->load('preferences');

        return $this->successResponse(
            new ProfileResource($profile),
            $isNew ? 'Profile created successfully as draft.' : 'Profile updated successfully.',
            $isNew ? Response::HTTP_CREATED : Response::HTTP_OK
        );
    }

    /**
     * Get the authenticated user's partner preferences.
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $profile = $request->user()->profile;

        if (!$profile) {
            return $this->errorResponse(
                'Please create your profile before managing partner preferences.',
                [],
                Response::HTTP_NOT_FOUND,
                'PROFILE_NOT_FOUND'
            );
        }

        $preferences = $profile->preferences;

        if (!$preferences) {
            return $this->successResponse(
                null,
                'No partner preferences set yet.'
            );
        }

        return $this->successResponse(
            new ProfilePreferenceResource($preferences),
            'Partner preferences retrieved successfully.'
        );
    }

    /**
     * Create or update the authenticated user's partner preferences.
     */
    public function updatePreferences(UpdatePreferencesRequest $request): JsonResponse
    {
        $profile = $request->user()->profile;

        if (!$profile) {
            return $this->errorResponse(
                'Please create your profile before setting partner preferences.',
                [],
                Response::HTTP_NOT_FOUND,
                'PROFILE_NOT_FOUND'
            );
        }

        $preferences = $profile->preferences()->updateOrCreate(
            ['profile_id' => $profile->id],
            $request->validated()
        );

        return $this->successResponse(
            new ProfilePreferenceResource($preferences),
            'Partner preferences saved successfully.'
        );
    }

    /**
     * Activate the user's matrimonial profile.
     * Enforces mandatory server-side email verification and mandatory core fields check.
     */
    public function activate(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Email verification check
        if (!$user->hasVerifiedEmail()) {
            return $this->errorResponse(
                'Your email address must be verified before activating your matrimonial profile.',
                ['email' => ['Email verification is required for profile activation.']],
                Response::HTTP_FORBIDDEN,
                'EMAIL_NOT_VERIFIED'
            );
        }

        // 2. Profile existence check
        $profile = $user->profile()->first();
        if (!$profile) {
            return $this->errorResponse(
                'Please create your profile before activating.',
                [],
                Response::HTTP_NOT_FOUND,
                'PROFILE_NOT_FOUND'
            );
        }

        // 3. Mandatory biodata completion check
        $mandatoryFields = [
            'gender',
            'date_of_birth',
            'religion',
            'city',
            'education',
            'profession',
            'marital_status',
            'height',
            'managed_by',
        ];

        foreach ($mandatoryFields as $field) {
            if (empty($profile->{$field})) {
                return $this->errorResponse(
                    "Cannot activate profile: The {$field} field is required.",
                    [$field => ["The {$field} field must be completed."]],
                    Response::HTTP_UNPROCESSABLE_ENTITY,
                    'INCOMPLETE_PROFILE'
                );
            }
        }

        $profile->profile_status = 'active';
        $profile->save();
        $profile->load('preferences');

        return $this->successResponse(
            new ProfileResource($profile),
            'Profile has been activated and is now discoverable.'
        );
    }

    /**
     * Hide the user's matrimonial profile.
     */
    public function hide(Request $request): JsonResponse
    {
        $profile = $request->user()->profile()->first();

        if (!$profile) {
            return $this->errorResponse(
                'Profile not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'PROFILE_NOT_FOUND'
            );
        }

        $profile->profile_status = 'hidden';
        $profile->save();
        $profile->load('preferences');

        return $this->successResponse(
            new ProfileResource($profile),
            'Profile has been hidden from discovery.'
        );
    }
}


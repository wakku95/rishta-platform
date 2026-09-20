<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicProfileResource;
use App\Models\Profile;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpFoundation\Response;

class AssistedConfirmationController extends Controller
{
    use ApiResponse;

    /**
     * Show profile summary for confirmation.
     */
    public function show(string $token): JsonResponse
    {
        $profile = Profile::with(['user'])->where('confirmation_token', $token)->first();

        if (!$profile) {
            return $this->errorResponse('Invalid or expired confirmation link.', [], Response::HTTP_NOT_FOUND, 'INVALID_TOKEN');
        }

        if ($profile->confirmation_expires_at && $profile->confirmation_expires_at->isPast()) {
            return $this->errorResponse('This confirmation link has expired. Please contact support or your admin for a new link.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'TOKEN_EXPIRED');
        }

        if ($profile->isConfirmed()) {
            return $this->errorResponse('Profile has already been confirmed.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'ALREADY_CONFIRMED');
        }

        return $this->successResponse([
            'profile' => new PublicProfileResource($profile),
            'email' => $profile->user->email,
        ], 'Profile found. Ready for confirmation.');
    }

    /**
     * Person sets password, confirms ownership & activates profile.
     */
    public function confirm(Request $request, string $token): JsonResponse
    {
        $profile = Profile::with(['user'])->where('confirmation_token', $token)->first();

        if (!$profile) {
            return $this->errorResponse('Invalid or expired confirmation link.', [], Response::HTTP_NOT_FOUND, 'INVALID_TOKEN');
        }

        if ($profile->confirmation_expires_at && $profile->confirmation_expires_at->isPast()) {
            return $this->errorResponse('This confirmation link has expired. Please contact support or your admin for a new link.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'TOKEN_EXPIRED');
        }

        if ($profile->isConfirmed()) {
            return $this->errorResponse('Profile has already been confirmed.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'ALREADY_CONFIRMED');
        }

        $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        DB::transaction(function () use ($profile, $request) {
            $user = $profile->user;
            
            // Set password and verify email (using forceFill since email_verified_at is not fillable)
            $user->forceFill([
                'password' => Hash::make($request->password),
                'email_verified_at' => Carbon::now(),
            ])->save();

            // Confirm profile and activate
            $profile->update([
                'confirmed_at' => Carbon::now(),
                'profile_status' => 'active',
                'confirmation_token' => null,
                'confirmation_expires_at' => null,
            ]);
        });

        // Optionally, log them in here and issue a Sanctum token if we want seamless UX
        // $token = $profile->user->createToken('auth_token')->plainTextToken;

        return $this->successResponse(
            null,
            'Account setup complete! Your profile is now active and you can log in.',
            Response::HTTP_OK
        );
    }
}

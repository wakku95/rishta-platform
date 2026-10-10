<?php

namespace App\Http\Controllers\Api\ProfileInquiry;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileInquiry\SubmitProfileInquiryRequest;
use App\Models\Profile;
use App\Models\ProfileInquiry;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ProfileInquiryController extends Controller
{
    use ApiResponse;

    /**
     * Submit an agent-assisted matchmaker inquiry for a candidate profile.
     */
    public function submit(SubmitProfileInquiryRequest $request, string $profile_code): JsonResponse
    {
        $profile = Profile::where('profile_code', $profile_code)
            ->where('profile_status', 'active')
            ->first();

        if (!$profile) {
            return $this->errorResponse(
                'Candidate profile not found or is currently not active.',
                [],
                Response::HTTP_NOT_FOUND,
                'PROFILE_NOT_FOUND'
            );
        }

        $user = $request->user('sanctum');

        // Prevent self-inquiry if logged in
        if ($user && $profile->user_id === $user->id) {
            return $this->errorResponse(
                'You cannot submit a matchmaker inquiry for your own profile.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'CANNOT_INQUIRE_OWN_PROFILE'
            );
        }

        $validated = $request->validated();

        // Anti-abuse: Check if identical contact submitted inquiry for this profile in past 24 hours
        $recentInquiry = ProfileInquiry::where('profile_id', $profile->id)
            ->where('submitter_contact', $validated['submitter_contact'])
            ->where('created_at', '>=', now()->subHours(24))
            ->exists();

        if ($recentInquiry) {
            return $this->errorResponse(
                'You have already submitted an inquiry for this candidate in the last 24 hours. Our matchmaker agent will reach out shortly.',
                [],
                Response::HTTP_TOO_MANY_REQUESTS,
                'INQUIRY_ALREADY_SUBMITTED'
            );
        }

        $inquiry = ProfileInquiry::create([
            'profile_id' => $profile->id,
            'user_id' => $user?->id,
            'submitter_name' => $validated['submitter_name'],
            'submitter_contact' => $validated['submitter_contact'],
            'submitter_email' => $validated['submitter_email'] ?? null,
            'family_details' => $validated['family_details'] ?? null,
            'questions' => $validated['questions'] ?? null,
            'status' => ProfileInquiry::STATUS_NEW,
        ]);

        return $this->successResponse(
            [
                'id' => $inquiry->id,
                'profile_code' => $profile->profile_code,
                'status' => $inquiry->status,
            ],
            'Your inquiry has been received. Our matchmaker agent will review your details and contact you on WhatsApp to facilitate the match.',
            Response::HTTP_CREATED
        );
    }
}

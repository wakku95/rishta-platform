<?php

namespace App\Http\Controllers\Api\Verification;

use App\Http\Controllers\Controller;
use App\Http\Resources\VerificationResource;
use App\Models\ProfileVerification;
use App\Services\Verification\VerificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response;

class VerificationController extends Controller
{
    use ApiResponse;

    protected VerificationService $service;

    public function __construct(VerificationService $service)
    {
        $this->service = $service;
    }

    /**
     * Get the authenticated user's verification overview and records.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $identity = $user->latestIdentityVerification();
        $education = $user->latestEducationVerification();

        return $this->successResponse([
            'summary' => [
                'email_verified' => $user->hasVerifiedEmail(),
                'identity_verified' => $user->isIdentityVerified(),
                'education_verified' => $user->isEducationVerified(),
            ],
            'identity' => $identity ? new VerificationResource($identity) : null,
            'education' => $education ? new VerificationResource($education) : null,
        ], 'Verification status retrieved.');
    }

    /**
     * Submit Identity Verification (CNIC front and back).
     */
    public function submitIdentity(Request $request): JsonResponse
    {
        $request->validate([
            'front' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
            'back' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ], [
            'front.required' => 'CNIC front document image or PDF is required.',
            'front.mimes' => 'CNIC front must be a valid image (JPG, PNG, WebP) or PDF document.',
            'front.max' => 'CNIC front file size may not exceed 5 MB.',
            'back.required' => 'CNIC back document image or PDF is required.',
            'back.mimes' => 'CNIC back must be a valid image (JPG, PNG, WebP) or PDF document.',
            'back.max' => 'CNIC back file size may not exceed 5 MB.',
        ]);

        try {
            $verification = $this->service->submitIdentity(
                $request->user(),
                $request->file('front'),
                $request->file('back')
            );

            return $this->successResponse(
                new VerificationResource($verification),
                'Identity verification submitted successfully. An administrator will review your documents.',
                Response::HTTP_CREATED
            );
        } catch (InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), [], Response::HTTP_UNPROCESSABLE_ENTITY, 'VERIFICATION_ERROR');
        }
    }

    /**
     * Submit Education Verification (Degree/Diploma/Transcript).
     */
    public function submitEducation(Request $request): JsonResponse
    {
        $request->validate([
            'document' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
            'label' => 'nullable|string|max:100',
        ], [
            'document.required' => 'Education certificate or degree document is required.',
            'document.mimes' => 'Education document must be a valid image (JPG, PNG, WebP) or PDF.',
            'document.max' => 'Education document file size may not exceed 5 MB.',
        ]);

        try {
            $verification = $this->service->submitEducation(
                $request->user(),
                $request->file('document'),
                $request->input('label')
            );

            return $this->successResponse(
                new VerificationResource($verification),
                'Education verification submitted successfully. An administrator will review your credential.',
                Response::HTTP_CREATED
            );
        } catch (InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), [], Response::HTTP_UNPROCESSABLE_ENTITY, 'VERIFICATION_ERROR');
        }
    }

    /**
     * Withdraw pending verification.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $deleted = $this->service->withdrawPending($request->user(), $id);

            if (!$deleted) {
                return $this->errorResponse('Verification request not found.', [], Response::HTTP_NOT_FOUND, 'VERIFICATION_NOT_FOUND');
            }

            return $this->successResponse(null, 'Pending verification request withdrawn.');
        } catch (InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), [], Response::HTTP_UNPROCESSABLE_ENTITY, 'WITHDRAW_FORBIDDEN');
        }
    }
}

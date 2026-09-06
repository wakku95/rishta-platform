<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EmailVerificationController extends Controller
{
    use ApiResponse;

    /**
     * Mark the authenticated user's email address as verified.
     */
    public function verify(Request $request, string $id, string $hash): JsonResponse|RedirectResponse
    {
        $user = User::findOrFail($id);

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            if ($request->wantsJson()) {
                return $this->errorResponse(
                    'Invalid verification link.',
                    [],
                    Response::HTTP_FORBIDDEN,
                    'INVALID_VERIFICATION_HASH'
                );
            }
            return redirect('/verify-email?error=invalid_hash');
        }

        if (!$request->hasValidSignature()) {
            if ($request->wantsJson()) {
                return $this->errorResponse(
                    'Verification link has expired or is invalid.',
                    [],
                    Response::HTTP_FORBIDDEN,
                    'EXPIRED_OR_INVALID_SIGNATURE'
                );
            }
            return redirect('/verify-email?error=expired');
        }

        if ($user->hasVerifiedEmail()) {
            if ($request->wantsJson()) {
                return $this->successResponse(
                    ['email_verified' => true],
                    'Email is already verified.'
                );
            }
            return redirect('/dashboard?verified=already');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        if ($request->wantsJson()) {
            return $this->successResponse(
                ['email_verified' => true],
                'Email verified successfully.'
            );
        }

        return redirect('/dashboard?verified=1');
    }

    /**
     * Resend the email verification notification.
     */
    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return $this->errorResponse(
                'Email already verified.',
                [],
                Response::HTTP_BAD_REQUEST,
                'EMAIL_ALREADY_VERIFIED'
            );
        }

        $user->sendEmailVerificationNotification();

        return $this->successResponse(
            null,
            'Verification email sent successfully.'
        );
    }
}

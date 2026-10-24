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

        // Multi-tier signature validation:
        // 1. Direct absolute signature check
        $hasValidSignature = $request->hasValidSignature();

        // 2. Relative signature check (immune to scheme/host proxy modifications)
        if (!$hasValidSignature) {
            $hasValidSignature = $request->hasValidSignature(false);
        }

        // 3. Scheme normalization check (http vs https reverse proxy mismatch)
        if (!$hasValidSignature) {
            $fullUrl = $request->fullUrl();
            $alternateUrl = str_starts_with($fullUrl, 'https://')
                ? 'http://' . substr($fullUrl, 8)
                : (str_starts_with($fullUrl, 'http://') ? 'https://' . substr($fullUrl, 7) : null);

            if ($alternateUrl) {
                $altRequest = Request::create($alternateUrl, 'GET', $request->query->all(), $request->cookies->all(), [], $request->server->all());
                $hasValidSignature = $altRequest->hasValidSignature();
            }
        }

        // 4. Host normalization check (www vs non-www)
        if (!$hasValidSignature) {
            $host = $request->getHost();
            $altHost = str_starts_with($host, 'www.')
                ? substr($host, 4)
                : 'www.' . $host;

            $altHostUrl = str_replace($host, $altHost, $request->fullUrl());
            $altHostRequest = Request::create($altHostUrl, 'GET', $request->query->all(), $request->cookies->all(), [], $request->server->all());
            $hasValidSignature = $altHostRequest->hasValidSignature();

            // Also check alternate scheme with alternate host
            if (!$hasValidSignature) {
                $altHostAndScheme = str_starts_with($altHostUrl, 'https://')
                    ? 'http://' . substr($altHostUrl, 8)
                    : (str_starts_with($altHostUrl, 'http://') ? 'https://' . substr($altHostUrl, 7) : null);
                if ($altHostAndScheme) {
                    $altBothRequest = Request::create($altHostAndScheme, 'GET', $request->query->all(), $request->cookies->all(), [], $request->server->all());
                    $hasValidSignature = $altBothRequest->hasValidSignature();
                }
            }
        }

        if (!$hasValidSignature) {
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
            $user->profile?->maybeAutoActivate();
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

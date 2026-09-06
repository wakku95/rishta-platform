<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Traits\ApiResponse;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class PasswordResetController extends Controller
{
    use ApiResponse;

    /**
     * Send a password reset link to the given user.
     */
    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_THROTTLED) {
            return $this->errorResponse(
                __($status),
                [],
                Response::HTTP_TOO_MANY_REQUESTS,
                'RESET_THROTTLED'
            );
        }

        // Always return generic success message to prevent user enumeration attacks
        return $this->successResponse(
            null,
            'If an account with that email exists, a password reset link has been sent.'
        );
    }

    /**
     * Reset the user's password.
     */
    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->successResponse(
                null,
                'Password has been reset successfully. You can now log in with your new password.'
            );
        }

        return $this->errorResponse(
            __($status),
            ['email' => [__($status)]],
            Response::HTTP_UNPROCESSABLE_ENTITY,
            'PASSWORD_RESET_FAILED'
        );
    }
}

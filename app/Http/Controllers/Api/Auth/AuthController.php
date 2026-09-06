<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Handle user registration.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make($request->validated('password')),
            'role' => 'user',
            'status' => 'active',
        ]);

        event(new Registered($user));

        Auth::guard('web')->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return $this->successResponse(
            new UserResource($user),
            'Registration successful. Please verify your email address.',
            Response::HTTP_CREATED
        );
    }

    /**
     * Handle user login.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (!Auth::guard('web')->attempt($credentials, $remember)) {
            return $this->errorResponse(
                'Invalid credentials.',
                ['email' => ['The provided credentials do not match our records.']],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'INVALID_CREDENTIALS'
            );
        }

        $user = Auth::guard('web')->user();

        if ($user->status === 'suspended') {
            Auth::guard('web')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return $this->errorResponse(
                'Your account has been suspended.',
                [],
                Response::HTTP_FORBIDDEN,
                'ACCOUNT_SUSPENDED'
            );
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return $this->successResponse(
            new UserResource($user),
            'Logged in successfully.'
        );
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        if (Auth::guard('sanctum')->check()) {
            Auth::guard('sanctum')->forgetUser();
        }

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->successResponse(null, 'Logged out successfully.');
    }

    /**
     * Get the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->successResponse(
            new UserResource($request->user()),
            'User profile retrieved.'
        );
    }
}

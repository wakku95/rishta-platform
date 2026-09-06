<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\EmailVerificationController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\HealthCheckController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('/health', HealthCheckController::class);

/*
|--------------------------------------------------------------------------
| Authentication Routes (/api/auth)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    // Guest authentication
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:3,15');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:5,1');

    // Email verification link (accessed from email)
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    // Authenticated session routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
            ->middleware('throttle:3,10');
    });
});

// Alias for standard Sanctum user endpoint
Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'me']);

/*
|--------------------------------------------------------------------------
| Profile & Partner Preferences Routes (/api/profile)
|--------------------------------------------------------------------------
*/
// Canonical profile options
Route::get('/profile/options', [\App\Http\Controllers\Api\Profile\ProfileController::class, 'getOptions']);

Route::middleware('auth:sanctum')->prefix('profile')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\Profile\ProfileController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\Profile\ProfileController::class, 'storeOrUpdate']);
    Route::put('/', [\App\Http\Controllers\Api\Profile\ProfileController::class, 'storeOrUpdate']);

    Route::get('/preview', [\App\Http\Controllers\Api\Profile\ProfileController::class, 'preview']);
    Route::get('/preferences', [\App\Http\Controllers\Api\Profile\ProfileController::class, 'getPreferences']);
    Route::put('/preferences', [\App\Http\Controllers\Api\Profile\ProfileController::class, 'updatePreferences']);

    Route::post('/activate', [\App\Http\Controllers\Api\Profile\ProfileController::class, 'activate']);
    Route::post('/hide', [\App\Http\Controllers\Api\Profile\ProfileController::class, 'hide']);
});


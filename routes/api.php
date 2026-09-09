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

/*
|--------------------------------------------------------------------------
| Discovery & Candidate Search Routes (/api/discovery)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('discovery')->group(function () {
    Route::get('/profiles', [\App\Http\Controllers\Api\Discovery\DiscoveryController::class, 'index']);
    Route::get('/profiles/{profile_code}', [\App\Http\Controllers\Api\Discovery\DiscoveryController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| Shortlists Routes (/api/shortlists)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('shortlists')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\Requests\ShortlistController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\Requests\ShortlistController::class, 'store']);
    Route::delete('/{profile_code}', [\App\Http\Controllers\Api\Requests\ShortlistController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Rishta Requests Routes (/api/requests)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('requests')->group(function () {
    Route::post('/', [\App\Http\Controllers\Api\Requests\RishtaRequestController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/sent', [\App\Http\Controllers\Api\Requests\RishtaRequestController::class, 'sent']);
    Route::get('/received', [\App\Http\Controllers\Api\Requests\RishtaRequestController::class, 'received']);
    Route::get('/{request_code}', [\App\Http\Controllers\Api\Requests\RishtaRequestController::class, 'show']);
    Route::post('/{request_code}/accept', [\App\Http\Controllers\Api\Requests\RishtaRequestController::class, 'accept']);
    Route::post('/{request_code}/decline', [\App\Http\Controllers\Api\Requests\RishtaRequestController::class, 'decline']);
    Route::post('/{request_code}/cancel', [\App\Http\Controllers\Api\Requests\RishtaRequestController::class, 'cancel']);

    // Phase 5: Payment (Rs. 300 initiator payment)
    Route::post('/{request_code}/payment/initiate', [\App\Http\Controllers\Api\Payments\PaymentController::class, 'initiate']);

    // Phase 5: Mutual OTP verification & Contact details unlock
    Route::get('/{request_code}/unlock/status', [\App\Http\Controllers\Api\Unlock\ContactUnlockController::class, 'status']);
    Route::post('/{request_code}/otp/send', [\App\Http\Controllers\Api\Unlock\ContactUnlockController::class, 'sendOtp']);
    Route::post('/{request_code}/otp/verify', [\App\Http\Controllers\Api\Unlock\ContactUnlockController::class, 'verifyOtp']);
    Route::get('/{request_code}/contact', [\App\Http\Controllers\Api\Unlock\ContactUnlockController::class, 'showContact']);
});

/*
|--------------------------------------------------------------------------
| Payment Verification Routes (/api/payments)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('payments')->group(function () {
    Route::post('/{payment_uuid}/verify', [\App\Http\Controllers\Api\Payments\PaymentController::class, 'verify']);
});

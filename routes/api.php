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

// Assisted Profile Confirmation (public, token-based)
Route::get('/assisted/confirm/{token}', [\App\Http\Controllers\Api\AssistedConfirmationController::class, 'show']);
Route::post('/assisted/confirm/{token}', [\App\Http\Controllers\Api\AssistedConfirmationController::class, 'confirm']);

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
Route::prefix('discovery')->group(function () {
    Route::get('/profiles', [\App\Http\Controllers\Api\Discovery\DiscoveryController::class, 'index'])
        ->middleware('throttle:60,1');
    Route::get('/profiles/{profile_code}', [\App\Http\Controllers\Api\Discovery\DiscoveryController::class, 'show'])
        ->middleware('throttle:60,1');
});

/*
|--------------------------------------------------------------------------
| Public Assisted Listings Routes (/api/listings)
|--------------------------------------------------------------------------
*/
Route::prefix('listings')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\Listings\AssistedListingController::class, 'index'])
        ->middleware('throttle:60,1');
    Route::get('/{listing_code}', [\App\Http\Controllers\Api\Listings\AssistedListingController::class, 'show'])
        ->middleware('throttle:60,1');
    Route::post('/{listing_code}/interest', [\App\Http\Controllers\Api\Listings\AssistedListingController::class, 'submitInterest'])
        ->middleware('throttle:5,1'); // Rate limited heavily for anti-abuse
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
    Route::post('/{request_code}/payment/submit-proof', [\App\Http\Controllers\Api\Payments\PaymentController::class, 'submitManualProof'])->middleware('throttle:10,1');

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

// Safepay Asynchronous Server Webhook
Route::post('/payments/safepay/webhook', [\App\Http\Controllers\Api\Payments\PaymentController::class, 'safepayWebhook']);

/*
|--------------------------------------------------------------------------
| User Verification Routes (/api/verifications)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('verifications')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\Verification\VerificationController::class, 'index']);
    Route::post('/identity', [\App\Http\Controllers\Api\Verification\VerificationController::class, 'submitIdentity'])->middleware('throttle:10,1');
    Route::post('/education', [\App\Http\Controllers\Api\Verification\VerificationController::class, 'submitEducation'])->middleware('throttle:10,1');
    Route::delete('/{id}', [\App\Http\Controllers\Api\Verification\VerificationController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Admin Portal Routes (/api/admin)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Analytics & Metrics
    Route::get('/metrics', [\App\Http\Controllers\Api\Admin\AdminDashboardController::class, 'metrics']);

    // User Management & Moderation
    Route::get('/users', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'index']);
    Route::get('/users/{id}', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'show']);
    Route::post('/users/{id}/suspend', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'suspend']);
    Route::post('/users/{id}/activate', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'activate']);
    Route::post('/users/{id}/role', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'updateRole']);
    Route::delete('/users/{id}', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'destroy']);

    // Profile Moderation
    Route::get('/profiles', [\App\Http\Controllers\Api\Admin\AdminProfileController::class, 'index']);
    Route::get('/profiles/{id}', [\App\Http\Controllers\Api\Admin\AdminProfileController::class, 'show']);
    Route::post('/profiles/{id}/status', [\App\Http\Controllers\Api\Admin\AdminProfileController::class, 'updateStatus']);
    Route::post('/profiles/{id}/gender', [\App\Http\Controllers\Api\Admin\AdminProfileController::class, 'updateGender']);
    Route::post('/profiles/{id}/field', [\App\Http\Controllers\Api\Admin\AdminProfileController::class, 'updateField']);
    Route::delete('/profiles/{id}', [\App\Http\Controllers\Api\Admin\AdminProfileController::class, 'destroy']);

    // Verification Review & Document Streaming
    Route::get('/verifications', [\App\Http\Controllers\Api\Admin\AdminVerificationController::class, 'index']);
    Route::get('/verifications/{id}', [\App\Http\Controllers\Api\Admin\AdminVerificationController::class, 'show']);
    Route::get('/verifications/{id}/document/{side?}', [\App\Http\Controllers\Api\Admin\AdminVerificationController::class, 'viewDocument']);
    Route::post('/verifications/{id}/approve', [\App\Http\Controllers\Api\Admin\AdminVerificationController::class, 'approve']);
    Route::post('/verifications/{id}/reject', [\App\Http\Controllers\Api\Admin\AdminVerificationController::class, 'reject']);
    Route::post('/verifications/purge', [\App\Http\Controllers\Api\Admin\AdminVerificationController::class, 'purge']);

    // Requests Oversight & Intervention
    Route::get('/requests', [\App\Http\Controllers\Api\Admin\AdminActivityController::class, 'requests']);
    Route::post('/requests/{id}/cancel', [\App\Http\Controllers\Api\Admin\AdminActivityController::class, 'cancelRequest']);

    // Financial & Contact Unlock Logs
    Route::get('/payments', [\App\Http\Controllers\Api\Admin\AdminActivityController::class, 'payments']);
    Route::post('/payments/{id}/approve', [\App\Http\Controllers\Api\Admin\AdminActivityController::class, 'approvePayment']);
    Route::post('/payments/{id}/reject', [\App\Http\Controllers\Api\Admin\AdminActivityController::class, 'rejectPayment']);
    Route::get('/payments/{id}/receipt', [\App\Http\Controllers\Api\Admin\AdminActivityController::class, 'viewReceipt']);
    Route::delete('/payments/{id}/receipt', [\App\Http\Controllers\Api\Admin\AdminActivityController::class, 'deleteReceipt']);
    Route::get('/unlocks', [\App\Http\Controllers\Api\Admin\AdminActivityController::class, 'unlocks']);

    // Assisted Matchmaking
    Route::prefix('assisted')->group(function () {
        Route::post('/create-profile', [\App\Http\Controllers\Api\Admin\AdminAssistedController::class, 'createProfile']);
        Route::get('/profiles', [\App\Http\Controllers\Api\Admin\AdminAssistedController::class, 'listAssistedProfiles']);
        Route::get('/profiles/{id}', [\App\Http\Controllers\Api\Admin\AdminAssistedController::class, 'showAssistedProfile']);
        Route::put('/profiles/{id}', [\App\Http\Controllers\Api\Admin\AdminAssistedController::class, 'updateAssistedProfile']);
        Route::post('/profiles/{id}/resend-confirmation', [\App\Http\Controllers\Api\Admin\AdminAssistedController::class, 'resendConfirmation']);
        Route::post('/profiles/{id}/search-matches', [\App\Http\Controllers\Api\Admin\AdminAssistedController::class, 'searchMatches']);
        Route::post('/profiles/{id}/send-proposal', [\App\Http\Controllers\Api\Admin\AdminAssistedController::class, 'sendProposal']);
        Route::get('/profiles/{id}/proposals', [\App\Http\Controllers\Api\Admin\AdminAssistedController::class, 'listProposals']);
    });

    // Admin Assisted Listings (New non-account profiles)
    Route::prefix('listings')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\AdminAssistedListingController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Admin\AdminAssistedListingController::class, 'store']);
        Route::get('/{assistedListing}', [\App\Http\Controllers\Api\Admin\AdminAssistedListingController::class, 'show']);
        Route::put('/{assistedListing}', [\App\Http\Controllers\Api\Admin\AdminAssistedListingController::class, 'update']);
        Route::delete('/{assistedListing}', [\App\Http\Controllers\Api\Admin\AdminAssistedListingController::class, 'destroy']);
        Route::post('/{assistedListing}/unpublish', [\App\Http\Controllers\Api\Admin\AdminAssistedListingController::class, 'unpublish']);
        Route::post('/{assistedListing}/otp/send', [\App\Http\Controllers\Api\Admin\AdminAssistedListingController::class, 'sendOtp']);
        Route::post('/{assistedListing}/otp/verify', [\App\Http\Controllers\Api\Admin\AdminAssistedListingController::class, 'verifyOtp']);
        Route::post('/{assistedListing}/convert', [\App\Http\Controllers\Api\Admin\AdminAssistedListingController::class, 'convert']);

        // Listing Interests
        Route::get('/{assistedListing}/interests', [\App\Http\Controllers\Api\Admin\AdminListingInterestController::class, 'index']);
        Route::get('/{assistedListing}/interests/{interest}', [\App\Http\Controllers\Api\Admin\AdminListingInterestController::class, 'show']);
        Route::post('/{assistedListing}/interests/{interest}/status', [\App\Http\Controllers\Api\Admin\AdminListingInterestController::class, 'updateStatus']);
        Route::post('/{assistedListing}/interests/{interest}/notes', [\App\Http\Controllers\Api\Admin\AdminListingInterestController::class, 'addNotes']);
        Route::delete('/{assistedListing}/interests/{interest}', [\App\Http\Controllers\Api\Admin\AdminListingInterestController::class, 'destroy']);
    });
});


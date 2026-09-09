<?php

namespace App\Http\Controllers\Api\Unlock;

use App\Contracts\SmsServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Unlock\SendOtpRequest;
use App\Http\Requests\Unlock\VerifyOtpRequest;
use App\Models\ContactUnlock;
use App\Models\RishtaRequest;
use App\Notifications\ContactDetailsUnlockedNotification;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ContactUnlockController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SmsServiceInterface $smsService
    ) {}

    /**
     * Helper to resolve the authenticated user's role on the request ('sender' or 'receiver').
     */
    protected function resolveUserRole(RishtaRequest $rishtaRequest, int $userId): ?string
    {
        if ($userId === $rishtaRequest->sender_id) {
            return 'sender';
        }
        if ($userId === $rishtaRequest->receiver_id) {
            return 'receiver';
        }
        return null;
    }

    /**
     * Get the current payment and mutual verification status for this connection.
     */
    public function status(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::query()
            ->where('request_code', $request_code)
            ->with(['contactUnlock.payment'])
            ->first();

        if (!$rishtaRequest) {
            return $this->errorResponse(
                'The requested Rishta connection was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'REQUEST_NOT_FOUND'
            );
        }

        $role = $this->resolveUserRole($rishtaRequest, $user->id);
        if (!$role) {
            return $this->errorResponse(
                'You are not authorized to view this connection.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_REQUEST_ACCESS'
            );
        }

        $unlock = $rishtaRequest->contactUnlock;
        $isPaid = (bool) $unlock?->payment?->isPaid();

        $cooldownSeconds = (int) config('rishta.otp.resend_cooldown_seconds', 60);
        $sentAt = $unlock?->{"{$role}_otp_sent_at"};
        $cooldownRemaining = 0;
        if ($sentAt && $sentAt->copy()->addSeconds($cooldownSeconds)->isFuture()) {
            $cooldownRemaining = (int) ceil(now()->diffInSeconds($sentAt->copy()->addSeconds($cooldownSeconds)));
        }

        $isSender = ($role === 'sender');
        $myVerified = $isSender ? (bool) $unlock?->isSenderVerified() : (bool) $unlock?->isReceiverVerified();
        $otherVerified = $isSender ? (bool) $unlock?->isReceiverVerified() : (bool) $unlock?->isSenderVerified();

        return $this->successResponse([
            'request_code' => $rishtaRequest->request_code,
            'status' => $rishtaRequest->status,
            'is_paid' => $isPaid,
            'my_role' => $role,
            'my_verified' => $myVerified,
            'other_verified' => $otherVerified,
            'is_unlocked' => (bool) $unlock?->isUnlocked(),
            'unlocked_at' => $unlock?->unlocked_at?->toIso8601String(),
            'my_phone' => $unlock?->{"{$role}_phone"},
            'cooldown_remaining' => $cooldownRemaining,
        ], 'Unlock status retrieved successfully.');
    }

    /**
     * Send 6-digit SMS OTP to candidate's mobile number.
     * Enforces payment prerequisite, 60s cooldown, and resets attempt counter.
     */
    public function sendOtp(SendOtpRequest $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::query()
            ->where('request_code', $request_code)
            ->with(['contactUnlock.payment'])
            ->first();

        if (!$rishtaRequest) {
            return $this->errorResponse(
                'The requested Rishta connection was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'REQUEST_NOT_FOUND'
            );
        }

        $role = $this->resolveUserRole($rishtaRequest, $user->id);
        if (!$role) {
            return $this->errorResponse(
                'You are not authorized to perform mobile verification on this request.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_REQUEST_ACCESS'
            );
        }

        // 1. Payment Prerequisite Check
        $unlock = $rishtaRequest->contactUnlock;
        if (!$unlock || !$unlock->payment?->isPaid()) {
            return $this->errorResponse(
                'The contact unlock fee must be paid before mobile verification can proceed.',
                [],
                Response::HTTP_FORBIDDEN,
                'PAYMENT_REQUIRED'
            );
        }

        // 2. Already verified check
        if ($unlock->{"{$role}_verified_at"}) {
            return $this->errorResponse(
                'Your mobile phone number has already been verified for this connection.',
                [],
                Response::HTTP_BAD_REQUEST,
                'ALREADY_VERIFIED'
            );
        }

        // 3. Resend Cooldown Check (60 seconds)
        $cooldownSeconds = (int) config('rishta.otp.resend_cooldown_seconds', 60);
        $sentAt = $unlock->{"{$role}_otp_sent_at"};
        if ($sentAt && $sentAt->copy()->addSeconds($cooldownSeconds)->isFuture()) {
            $remaining = (int) ceil(now()->diffInSeconds($sentAt->copy()->addSeconds($cooldownSeconds)));
            return $this->errorResponse(
                "Please wait {$remaining} seconds before requesting a new verification code.",
                ['cooldown_remaining' => $remaining],
                Response::HTTP_TOO_MANY_REQUESTS,
                'OTP_COOLDOWN_ACTIVE'
            );
        }

        // 4. Generate 6-digit numeric OTP and normalized phone
        $normalizedPhone = $request->normalizedPhoneNumber();
        $otp = sprintf('%06d', random_int(100000, 999999));
        $expiryMinutes = (int) config('rishta.otp.expiry_minutes', 10);

        // 5. Update Unlock State
        $unlock->update([
            "{$role}_phone" => $normalizedPhone,
            "{$role}_otp_hash" => Hash::make($otp),
            "{$role}_otp_sent_at" => now(),
            "{$role}_otp_expires_at" => now()->addMinutes($expiryMinutes),
            "{$role}_otp_attempts" => 0, // Fresh code resets attempts
        ]);

        // 6. Dispatch SMS
        $dispatched = $this->smsService->sendSms(
            $normalizedPhone,
            "Your RaabtaNow verification code is: {$otp}. Valid for {$expiryMinutes} minutes."
        );

        if (!$dispatched) {
            Log::warning("[SMS] Failed to send OTP to {$normalizedPhone} for request {$request_code}");
        }

        return $this->successResponse([
            'phone' => $normalizedPhone,
            'expires_in_minutes' => $expiryMinutes,
            'cooldown_seconds' => $cooldownSeconds,
        ], 'Verification code sent to your mobile phone.');
    }

    /**
     * Verify submitted 6-digit OTP code.
     * Enforces maximum 5 attempts, expiry, and performs transactional final unlock if both verified.
     */
    public function verifyOtp(VerifyOtpRequest $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::query()
            ->where('request_code', $request_code)
            ->with(['contactUnlock.payment', 'sender.profile', 'receiver.profile'])
            ->first();

        if (!$rishtaRequest) {
            return $this->errorResponse(
                'The requested Rishta connection was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'REQUEST_NOT_FOUND'
            );
        }

        $role = $this->resolveUserRole($rishtaRequest, $user->id);
        if (!$role) {
            return $this->errorResponse(
                'You are not authorized to verify an OTP for this request.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_REQUEST_ACCESS'
            );
        }

        $unlock = $rishtaRequest->contactUnlock;
        if (!$unlock || !$unlock->payment?->isPaid()) {
            return $this->errorResponse(
                'Payment required before verification.',
                [],
                Response::HTTP_FORBIDDEN,
                'PAYMENT_REQUIRED'
            );
        }

        // 1. Already verified check
        if ($unlock->{"{$role}_verified_at"}) {
            return $this->errorResponse(
                'Your mobile phone number is already verified.',
                [],
                Response::HTTP_BAD_REQUEST,
                'ALREADY_VERIFIED'
            );
        }

        // Concurrency-protected verification block:
        // Uses lockForUpdate() to guarantee:
        // 1. Concurrent OTP attempts cannot race past the 5-attempt limit.
        // 2. Nearly simultaneous verification by sender & receiver cannot corrupt unlocked_at or double dispatch emails.
        $newlyUnlocked = false;
        $maxAttempts = (int) config('rishta.otp.max_attempts', 5);
        $transactionResult = null;

        $transactionResult = DB::transaction(function () use ($unlock, $role, $request, $maxAttempts, &$newlyUnlocked) {
            $lockedUnlock = ContactUnlock::where('id', $unlock->id)->lockForUpdate()->first();

            // Check if already verified while waiting for lock
            if ($lockedUnlock->{"{$role}_verified_at"}) {
                return ['error' => 'ALREADY_VERIFIED', 'status' => Response::HTTP_BAD_REQUEST, 'message' => 'Your mobile phone number is already verified.'];
            }

            // Check if OTP hash exists
            if (!$lockedUnlock->{"{$role}_otp_hash"}) {
                return ['error' => 'OTP_NOT_REQUESTED', 'status' => Response::HTTP_BAD_REQUEST, 'message' => 'No verification code has been requested yet. Please request a code first.'];
            }

            // Check max attempts
            if ($lockedUnlock->{"{$role}_otp_attempts"} >= $maxAttempts) {
                return ['error' => 'MAX_ATTEMPTS_EXCEEDED', 'status' => Response::HTTP_TOO_MANY_REQUESTS, 'message' => 'Maximum verification attempts exceeded. Please request a new verification code.'];
            }

            // Increment attempts counter atomically under lock
            $lockedUnlock->increment("{$role}_otp_attempts");
            $attemptsMade = $lockedUnlock->{"{$role}_otp_attempts"};

            // Check expiry
            $expiresAt = $lockedUnlock->{"{$role}_otp_expires_at"};
            if (!$expiresAt || now()->greaterThan($expiresAt)) {
                return ['error' => 'OTP_EXPIRED', 'status' => Response::HTTP_UNPROCESSABLE_ENTITY, 'message' => 'Verification code has expired. Please request a fresh code.'];
            }

            // Cryptographic Hash Validation
            if (!Hash::check($request->input('otp'), $lockedUnlock->{"{$role}_otp_hash"})) {
                $remaining = max(0, $maxAttempts - $attemptsMade);
                return [
                    'error' => 'INVALID_OTP',
                    'status' => Response::HTTP_UNPROCESSABLE_ENTITY,
                    'message' => "Invalid verification code. You have {$remaining} attempt(s) remaining.",
                    'meta' => ['attempts_remaining' => $remaining],
                ];
            }

            // Valid OTP! Clear OTP hash and record verified timestamp
            $lockedUnlock->update([
                "{$role}_verified_at" => now(),
                "{$role}_otp_hash" => null,
            ]);

            // If BOTH parties are verified and unlocked_at is not set yet, atomically unlock
            if ($lockedUnlock->sender_verified_at && $lockedUnlock->receiver_verified_at && !$lockedUnlock->unlocked_at) {
                $lockedUnlock->update(['unlocked_at' => now()]);
                $newlyUnlocked = true;
            }

            return ['success' => true];
        });

        if (isset($transactionResult['error'])) {
            return $this->errorResponse(
                $transactionResult['message'],
                $transactionResult['meta'] ?? [],
                $transactionResult['status'],
                $transactionResult['error']
            );
        }

        // Email Confirmation Dispatch: ONLY after complete mutual unlock
        // Notification failure is captured and does NOT rollback the unlock
        if ($newlyUnlocked) {
            try {
                $senderProfileCode = $rishtaRequest->sender?->profile?->profile_code ?? 'Candidate';
                $receiverProfileCode = $rishtaRequest->receiver?->profile?->profile_code ?? 'Candidate';

                $rishtaRequest->sender->notify(new ContactDetailsUnlockedNotification($rishtaRequest, $receiverProfileCode));
                $rishtaRequest->receiver->notify(new ContactDetailsUnlockedNotification($rishtaRequest, $senderProfileCode));
            } catch (\Throwable $e) {
                Log::warning("[Notifications] Failed to dispatch contact unlocked notification: {$e->getMessage()}");
            }
        }

        $freshUnlock = $unlock->fresh();

        return $this->successResponse([
            'verified' => true,
            'is_unlocked' => $freshUnlock->isUnlocked(),
            'unlocked_at' => $freshUnlock->unlocked_at?->toIso8601String(),
        ], $freshUnlock->isUnlocked()
            ? 'Mobile verified! Mutual contact details are now officially unlocked.'
            : 'Mobile verified successfully. Awaiting other candidate mobile verification.'
        );
    }

    /**
     * Retrieve unlocked contact details strictly for authenticated sender or receiver.
     * Never returns contact info before unlocked_at is set.
     * Strictly returns only the OTHER candidate's details.
     */
    public function showContact(Request $request, string $request_code): JsonResponse
    {
        $user = $request->user();

        $rishtaRequest = RishtaRequest::query()
            ->where('request_code', $request_code)
            ->with(['contactUnlock.payment', 'sender.profile', 'receiver.profile'])
            ->first();

        if (!$rishtaRequest) {
            return $this->errorResponse(
                'The requested Rishta connection was not found.',
                [],
                Response::HTTP_NOT_FOUND,
                'REQUEST_NOT_FOUND'
            );
        }

        $role = $this->resolveUserRole($rishtaRequest, $user->id);
        if (!$role) {
            return $this->errorResponse(
                'You are not authorized to access contact information for this request.',
                [],
                Response::HTTP_FORBIDDEN,
                'UNAUTHORIZED_REQUEST_ACCESS'
            );
        }

        $unlock = $rishtaRequest->contactUnlock;

        // Strict Invariant: Must have non-null unlocked_at
        if (!$unlock || !$unlock->isUnlocked()) {
            return $this->errorResponse(
                'Contact details have not been unlocked yet. Mutual verification and payment are required.',
                [],
                Response::HTTP_FORBIDDEN,
                'CONTACTS_NOT_UNLOCKED'
            );
        }

        // Return strictly the other party's information
        if ($role === 'sender') {
            $otherUser = $rishtaRequest->receiver;
            $otherPhone = $unlock->receiver_phone;
            $otherProfile = $rishtaRequest->receiver?->profile;
        } else {
            $otherUser = $rishtaRequest->sender;
            $otherPhone = $unlock->sender_phone;
            $otherProfile = $rishtaRequest->sender?->profile;
        }

        $cleanPhoneForWhatsapp = ltrim($otherPhone, '+');

        return $this->successResponse([
            'profile_code' => $otherProfile?->profile_code ?? 'Candidate',
            'name' => $otherUser->name,
            'phone' => $otherPhone,
            'whatsapp_url' => "https://wa.me/{$cleanPhoneForWhatsapp}",
            'email' => $otherUser->email,
            'unlocked_at' => $unlock->unlocked_at->toIso8601String(),
        ], 'Contact details retrieved successfully.');
    }
}

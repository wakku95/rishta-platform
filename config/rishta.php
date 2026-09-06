<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Rishta Platform Business Rules Configuration
    |--------------------------------------------------------------------------
    */

    // Contact Unlock Fee (PKR) - Charged strictly to the original request sender
    'unlock_fee' => (float) env('RISHTA_UNLOCK_FEE', 300.00),
    'currency' => env('RISHTA_CURRENCY', 'PKR'),

    // OTP Configuration
    'otp' => [
        'length' => 6,
        'expiry_minutes' => (int) env('OTP_EXPIRY_MINUTES', 10),
        'max_attempts' => (int) env('OTP_MAX_ATTEMPTS', 5),
        'resend_cooldown_seconds' => (int) env('OTP_RESEND_COOLDOWN', 60),
        'max_resends_per_hour' => 3,
    ],

    // Rishta Request Configuration
    'request' => [
        'expiry_days' => 14,
        'max_active_requests' => 20,
    ],

    // Discovery & Search Configuration
    'search' => [
        'per_page' => 15,
        'max_per_page' => 30,
    ],
];

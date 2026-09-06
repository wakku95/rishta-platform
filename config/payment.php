<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Payment Gateway
    |--------------------------------------------------------------------------
    |
    | Supported: "payfast", "fake"
    |
    */
    'default' => env('PAYMENT_DEFAULT_GATEWAY', 'fake'),

    /*
    |--------------------------------------------------------------------------
    | Contact Unlock Fee
    |--------------------------------------------------------------------------
    |
    | The fee charged strictly to the original request initiator once
    | a Rishta Request is accepted.
    |
    */
    'contact_unlock_fee' => (float) env('PAYMENT_CONTACT_UNLOCK_FEE', 300.00),
    'currency' => env('PAYMENT_CURRENCY', 'PKR'),

    /*
    |--------------------------------------------------------------------------
    | Gateway Specific Configurations
    |--------------------------------------------------------------------------
    */
    'gateways' => [
        'payfast' => [
            'merchant_id' => env('PAYFAST_MERCHANT_ID', ''),
            'secured_key' => env('PAYFAST_SECURED_KEY', ''),
            'environment' => env('PAYFAST_ENV', 'sandbox'), // sandbox | live
            'base_url' => env('PAYFAST_BASE_URL', 'https://ipguat.apps.net.pk/Ecommerce/api/Transaction/'),
            'checkout_url' => env('PAYFAST_CHECKOUT_URL', 'https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken'),
        ],

        'fake' => [
            'auto_approve' => env('PAYMENT_FAKE_AUTO_APPROVE', true),
        ],
    ],
];

<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default SMS Provider
    |--------------------------------------------------------------------------
    |
    | Supported: "mock", "pakistan_sms"
    |
    */
    'default' => env('SMS_DEFAULT_PROVIDER', 'mock'),

    /*
    |--------------------------------------------------------------------------
    | SMS Provider Credentials
    |--------------------------------------------------------------------------
    */
    'providers' => [
        'pakistan_sms' => [
            'api_key' => env('SMS_API_KEY', ''),
            'sender_id' => env('SMS_SENDER_ID', 'RISHTA'),
            'endpoint' => env('SMS_ENDPOINT', ''),
        ],

        'mock' => [
            'log_channel' => 'stack',
        ],
    ],
];

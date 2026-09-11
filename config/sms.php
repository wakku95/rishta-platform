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
    'default' => env('SMS_DEFAULT_PROVIDER', env('SMS_DEFAULT_DRIVER', 'mock')),

    /*
    |--------------------------------------------------------------------------
    | SMS Provider Credentials
    |--------------------------------------------------------------------------
    */
    'providers' => [
        'veevotech' => [
            'api_key' => env('VEEVOTECH_API_KEY', ''),
            'sender_id' => env('VEEVOTECH_SENDER_ID', 'Default'),
            'endpoint' => env('VEEVOTECH_ENDPOINT', 'https://api.veevotech.com/v3/sendsms'),
        ],

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

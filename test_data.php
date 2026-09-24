<?php
$u = \App\Models\User::where('email','user@example.com')->first();
\App\Models\Profile::updateOrCreate(
    ['user_id' => $u->id],
    [
        'profile_code' => 'RN-9999',
        'gender' => 'male',
        'date_of_birth' => '1990-01-01',
        'city' => 'Karachi',
        'education' => "Bachelor's",
        'profession' => 'Software / IT',
        'marital_status' => 'never_married',
        'height' => 170,
        'religion' => 'Islam',
        'sect' => 'Sunni',
        'managed_by' => 'myself',
        'profile_status' => 'active'
    ]
);

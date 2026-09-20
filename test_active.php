<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$profiles = App\Models\Profile::where('gender', 'male')->where('profile_status', 'active')->get();
echo "Total active males: " . $profiles->count() . "\n";

foreach ($profiles as $profile) {
    echo "ID: " . $profile->id . " | User ID: " . $profile->user_id . " | DOB: " . $profile->date_of_birth . " | City: " . $profile->city . " | Religion: " . $profile->religion . "\n";
    $user = $profile->user;
    echo "User verified: " . ($user->email_verified_at ? 'YES' : 'NO') . "\n";
}

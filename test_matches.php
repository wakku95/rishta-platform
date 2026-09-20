<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$profile = App\Models\Profile::latest('id')->first();
echo "Testing for profile ID: " . $profile->id . " | Gender: " . $profile->gender . "\n";
echo "Preferences:\n";
print_r($profile->preferences->toArray());

$query = App\Models\Profile::query()
    ->where('profile_status', 'active')
    ->where('id', '!=', $profile->id)
    ->whereHas('user', function ($q) {
        $q->where('status', '!=', 'suspended')
          ->whereNotNull('email_verified_at');
    });

$prefs = $profile->preferences;
if ($prefs) {
    if ($prefs->preferred_gender) {
        $query->where('gender', $prefs->preferred_gender);
    }
    if ($prefs->min_age) {
        $query->whereDate('date_of_birth', '<=', now()->subYears($prefs->min_age));
    }
    if ($prefs->max_age) {
        $query->whereDate('date_of_birth', '>', now()->subYears($prefs->max_age + 1));
    }
    if (!empty($prefs->preferred_cities)) {
        $query->whereIn('city', $prefs->preferred_cities);
    }
    if ($prefs->preferred_religion) {
        $query->where('religion', $prefs->preferred_religion);
    }
}

echo "\nSQL: " . $query->toSql() . "\n";
echo "Bindings: " . json_encode($query->getBindings()) . "\n";

echo "Results count: " . $query->count() . "\n";

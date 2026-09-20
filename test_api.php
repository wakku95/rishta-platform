<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$profile = App\Models\Profile::latest('id')->first();
$matches = App\Models\Profile::where('gender', 'male')->paginate(10);
$resource = App\Http\Resources\PublicProfileResource::collection($matches->items());

$response = [
    'success' => true,
    'data' => $resource
];

echo json_encode($response, JSON_PRETTY_PRINT);

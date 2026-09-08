<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function (\Illuminate\Http\Request $request) {
    // If request expects JSON or is accessing the API host/root
    if ($request->expectsJson() || str_starts_with($request->getHost(), 'api.')) {
        return response()->json([
            'success' => true,
            'message' => 'RaabtaNow API is operational.',
            'version' => '1.0.0',
        ]);
    }

    // Default: If accessed from a web/frontend host where Blade/SPA is served
    return view('welcome');
});

Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '^(?!api).*$');


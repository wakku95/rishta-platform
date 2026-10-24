<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Dynamically locate Laravel application base directory (supports shared hosting ../rishta-platform and ../)
$possiblePaths = [
    __DIR__ . '/../rishta-platform',
    __DIR__ . '/..',
];

$basePath = null;
foreach ($possiblePaths as $path) {
    if (file_exists($path . '/bootstrap/app.php')) {
        $basePath = $path;
        break;
    }
}

if (!$basePath) {
    http_response_code(500);
    die('Unable to locate Laravel application bootstrap path. Please ensure rishta-platform is present in the parent directory.');
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = $basePath . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require $basePath . '/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once $basePath . '/bootstrap/app.php';

$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());

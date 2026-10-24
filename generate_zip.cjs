const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = __dirname;
const publicDir = path.join(projectRoot, 'public');
const tempDir = path.join(projectRoot, 'temp_public_html');
const zipFile = path.join(projectRoot, 'public_html.zip');
const deploymentDir = path.join(projectRoot, 'deployment', 'public_html');

console.log('1. Cleaning up old files...');
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
if (fs.existsSync(zipFile)) fs.rmSync(zipFile, { force: true });

console.log('2. Copying public folder into staging directory...');
fs.cpSync(publicDir, tempDir, { recursive: true });

console.log('3. Writing resilient shared-hosting index.php with dynamic path resolver...');
const sharedHostingIndexPhp = `<?php

use Illuminate\\Foundation\\Application;
use Illuminate\\Http\\Request;

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
`;

const indexPhpPath = path.join(tempDir, 'index.php');
fs.writeFileSync(indexPhpPath, sharedHostingIndexPhp);

console.log('4. Ensuring hot file is removed (forces production mode)...');
const hotFilePath = path.join(tempDir, 'hot');
if (fs.existsSync(hotFilePath)) fs.rmSync(hotFilePath, { force: true });

console.log('5. Syncing deployment/public_html directory...');
if (!fs.existsSync(deploymentDir)) fs.mkdirSync(deploymentDir, { recursive: true });
fs.cpSync(tempDir, deploymentDir, { recursive: true });

console.log('6. Packaging public_html.zip (root-level extraction for cPanel)...');
try {
  // Use PowerShell Push-Location so tar packages files directly at root without dot-prefix
  const cmd = `powershell -NoProfile -Command "Push-Location '${tempDir}'; tar.exe -a -cf '${zipFile}' * .htaccess; Pop-Location"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('Successfully created production public_html.zip!');
} catch (e) {
  console.error('Failed to create zip file:', e.message);
} finally {
  console.log('7. Cleaning up staging directory...');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
}

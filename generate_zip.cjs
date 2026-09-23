const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = __dirname;
const publicDir = path.join(projectRoot, 'public');
const tempDir = path.join(projectRoot, 'temp_public_html');
const zipFile = path.join(projectRoot, 'public_html.zip');

console.log('Cleaning up old files...');
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
if (fs.existsSync(zipFile)) fs.rmSync(zipFile, { force: true });

console.log('Copying public folder...');
fs.cpSync(publicDir, tempDir, { recursive: true });

console.log('Modifying index.php for shared hosting...');
const indexPhpPath = path.join(tempDir, 'index.php');
let indexPhp = fs.readFileSync(indexPhpPath, 'utf8');

indexPhp = indexPhp.replace(
  /__DIR__\.'\/\.\.\/storage\/framework\/maintenance\.php'/g,
  "__DIR__.'/../rishta-platform/storage/framework/maintenance.php'"
);
indexPhp = indexPhp.replace(
  /__DIR__\.'\/\.\.\/vendor\/autoload\.php'/g,
  "__DIR__.'/../rishta-platform/vendor/autoload.php'"
);
indexPhp = indexPhp.replace(
  /\$app = require_once __DIR__\.'\/\.\.\/bootstrap\/app\.php';/g,
  "$app = require_once __DIR__.'/../rishta-platform/bootstrap/app.php';\n\n// FIX FOR cPANEL SPLIT DIRECTORY: Tell Laravel that public_html is the public path\n$app->usePublicPath(__DIR__);"
);

fs.writeFileSync(indexPhpPath, indexPhp);

console.log('Ensuring hot file is removed (forces production mode)...');
const hotFilePath = path.join(tempDir, 'hot');
if (fs.existsSync(hotFilePath)) fs.rmSync(hotFilePath, { force: true });

console.log('Creating zip file...');
// Use PowerShell to zip the contents so it extracts directly into public_html without a parent folder
try {
  execSync(`powershell.exe -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipFile}' -Force"`, { stdio: 'inherit' });
  console.log('Successfully created public_html.zip!');
} catch (e) {
  console.error('Failed to create zip file:', e.message);
} finally {
  console.log('Cleaning up temporary folder...');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
}

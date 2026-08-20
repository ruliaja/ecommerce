<?php
/**
 * Direct API Test - Test forgot password endpoint directly
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load environment
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0 || strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

// Load database
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../libs/EmailHelper.php';
require_once __DIR__ . '/../modules/auth.php';

// Test forgot password function directly
$testEmail = 'ruligamerz6@gmail.com';

echo json_encode([
    'test' => 'Direct API Test',
    'email' => $testEmail,
    'action' => 'forgot_password',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'openssl_loaded' => extension_loaded('openssl') ? 'yes' : 'no',
    'env_check' => [
        'GMAIL_USERNAME' => getenv('GMAIL_USERNAME') ? 'set' : 'NOT SET',
        'GMAIL_PASSWORD' => getenv('GMAIL_PASSWORD') ? 'set (' . strlen(getenv('GMAIL_PASSWORD')) . ' chars)' : 'NOT SET',
    ]
], JSON_PRETTY_PRINT);

// If POST request, test forgot password
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    
    echo "\n\n=== Testing forgotPassword function ===\n\n";
    echo json_encode(forgotPassword($db, $input), JSON_PRETTY_PRINT);
}
?>

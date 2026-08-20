<?php
/**
 * Simple Error Logger - Lihat semua error yang terjadi
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log file
$logFile = __DIR__ . '/email_errors.log';

// Test 1: Check if EmailHelper can be loaded
echo "Test 1: Loading EmailHelper...\n";
try {
    if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
        throw new Exception("vendor/autoload.php not found");
    }
    require_once __DIR__ . '/vendor/autoload.php';
    echo "✅ Autoloader loaded\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] Autoloader Error: " . $e->getMessage() . "\n", FILE_APPEND);
    exit(1);
}

// Test 2: Load EmailHelper
echo "Test 2: Instantiating EmailHelper...\n";
try {
    require_once __DIR__ . '/libs/EmailHelper.php';
    $emailHelper = new EmailHelper();
    echo "✅ EmailHelper instantiated\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] EmailHelper Error: " . $e->getMessage() . "\n", FILE_APPEND);
    exit(1);
}

// Test 3: Send simple email
echo "Test 3: Sending test email...\n";
try {
    $result = $emailHelper->send(
        'rulisihombing244@gmail.com',
        'Test User',
        'Test from VPS',
        '<h1>Test</h1><p>Email test</p>'
    );
    
    echo "Result: " . json_encode($result) . "\n";
    file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] Email Result: " . json_encode($result) . "\n", FILE_APPEND);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] Send Error: " . $e->getMessage() . "\n", FILE_APPEND);
    exit(1);
}

echo "\n✅ All tests passed!\n";
echo "Check log file: " . $logFile . "\n";
?>

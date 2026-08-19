<?php
/**
 * Complete VPS Diagnostic & Setup Script
 * Upload dan akses di VPS untuk full diagnosis
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

$diagnostics = [];

echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>OutFitKita - VPS Diagnostic</title>";
echo "<style>";
echo "body{font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0;}";
echo ".container{max-width:1000px;margin:0 auto;background:white;padding:30px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}";
echo "h1{color:#7c3aed;margin-top:0;}h2{color:#2563eb;border-bottom:2px solid #e5e7eb;padding-bottom:10px;margin-top:30px;}";
echo ".section{margin:20px 0;padding:15px;border-radius:4px;}";
echo ".success{background:#d1fae5;border:1px solid #34d399;color:#065f46;padding:15px;border-radius:4px;margin:10px 0;}";
echo ".error{background:#fee2e2;border:1px solid #f87171;color:#991b1b;padding:15px;border-radius:4px;margin:10px 0;}";
echo ".warning{background:#fef3c7;border:1px solid #fcd34d;color:#92400e;padding:15px;border-radius:4px;margin:10px 0;}";
echo ".info{background:#dbeafe;border:1px solid #93c5fd;color:#1e40af;padding:15px;border-radius:4px;margin:10px 0;}";
echo "code{background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:monospace;}";
echo "table{width:100%;border-collapse:collapse;margin:10px 0;}";
echo "th,td{padding:10px;text-align:left;border-bottom:1px solid #e5e7eb;}";
echo "th{background:#f3f4f6;font-weight:bold;}";
echo ".green{color:#10b981;}span{font-weight:bold;}";
echo "</style></head><body><div class='container'>";

echo "<h1>🔧 OutFitKita - VPS Diagnostic & Setup</h1>";

// 1. Check PHP Version
echo "<h2>1️⃣ PHP Configuration</h2>";
echo "<table>";
echo "<tr><th>Setting</th><th>Value</th><th>Status</th></tr>";
echo "<tr><td>PHP Version</td><td>" . PHP_VERSION . "</td><td class='green'>✅</td></tr>";
echo "<tr><td>Script Path</td><td><code>" . __FILE__ . "</code></td><td class='green'>✅</td></tr>";
echo "</table>";

// 2. Check PHP Extensions
echo "<h2>2️⃣ Required PHP Extensions</h2>";
$requiredExt = ['openssl', 'sockets', 'curl', 'mbstring', 'json'];
$missingExt = [];
echo "<table>";
echo "<tr><th>Extension</th><th>Status</th></tr>";
foreach ($requiredExt as $ext) {
    if (extension_loaded($ext)) {
        echo "<tr><td>$ext</td><td class='green'>✅ Loaded</td></tr>";
    } else {
        echo "<tr><td>$ext</td><td><span style='color:#f87171;'>❌ NOT LOADED</span></td></tr>";
        $missingExt[] = $ext;
    }
}
echo "</table>";

if (!empty($missingExt)) {
    echo "<div class='error'>Missing extensions: " . implode(', ', $missingExt) . "<br>";
    echo "Contact VPS provider to enable them in php.ini</div>";
}

// 3. Check .env File
echo "<h2>3️⃣ Configuration Files</h2>";
$backendPath = dirname(__FILE__);
$envFile = $backendPath . '/.env';

if (file_exists($envFile)) {
    echo "<div class='success'>✅ .env file found</div>";
    
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $envVars = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0 || strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        putenv("$name=$value");
        $_ENV[$name] = $value;
        $envVars[$name] = $value;
    }
    
    echo "<table>";
    echo "<tr><th>Variable</th><th>Value</th><th>Status</th></tr>";
    $required_vars = ['GMAIL_USERNAME', 'GMAIL_PASSWORD', 'DB_HOST', 'DB_USER', 'DB_NAME'];
    foreach ($required_vars as $var) {
        $value = $envVars[$var] ?? '';
        $status = $value ? '<span class="green">✅ Set</span>' : '<span style="color:#f87171;">❌ Missing</span>';
        $display = ($var === 'GMAIL_PASSWORD') ? str_repeat('*', strlen($value)) : htmlspecialchars($value);
        echo "<tr><td>$var</td><td><code>$display</code></td><td>$status</td></tr>";
    }
    echo "</table>";
} else {
    echo "<div class='error'>❌ .env file NOT found at: " . htmlspecialchars($envFile) . "</div>";
    echo "<div class='info'>Create .env file with your Gmail credentials</div>";
}

// 4. Check PHPMailer
echo "<h2>4️⃣ PHPMailer Installation</h2>";
$vendorAutoload = $backendPath . '/vendor/autoload.php';
if (file_exists($vendorAutoload)) {
    echo "<div class='success'>✅ vendor/autoload.php found</div>";
    require_once $vendorAutoload;
    
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\SMTP;
    use PHPMailer\PHPMailer\Exception;
    
    echo "<div class='success'>✅ PHPMailer classes loaded successfully</div>";
} else {
    echo "<div class='error'>❌ vendor/autoload.php NOT found</div>";
    echo "<div class='info'>Run: <code>cd " . htmlspecialchars($backendPath) . " && composer install</code></div>";
}

// 5. Check Database Connection
echo "<h2>5️⃣ Database Connection</h2>";
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: '';

if (empty($db_name)) {
    echo "<div class='error'>❌ Database configuration missing</div>";
} else {
    $conn = @mysqli_connect($db_host, $db_user, $db_pass, $db_name);
    if ($conn) {
        echo "<div class='success'>✅ Database connection successful</div>";
        
        // Check reset_token columns
        echo "<h3>Checking table structure:</h3>";
        $result = mysqli_query($conn, "DESCRIBE users");
        $columns = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $columns[$row['Field']] = $row['Type'];
        }
        
        echo "<table>";
        echo "<tr><th>Column</th><th>Required</th><th>Status</th></tr>";
        $requiredCols = ['reset_token', 'reset_token_expiry'];
        foreach ($requiredCols as $col) {
            if (isset($columns[$col])) {
                echo "<tr><td>$col</td><td>Required</td><td class='green'>✅ Exists</td></tr>";
            } else {
                echo "<tr><td>$col</td><td>Required</td><td><span style='color:#f87171;'>❌ MISSING</span></td></tr>";
            }
        }
        echo "</table>";
        
        if (!isset($columns['reset_token']) || !isset($columns['reset_token_expiry'])) {
            echo "<div class='error'><strong>⚠️ Missing columns!</strong><br>";
            echo "Run this SQL in phpMyAdmin:<br>";
            echo "<code>ALTER TABLE users ADD COLUMN reset_token VARCHAR(64) NULL DEFAULT NULL AFTER password;<br>";
            echo "ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL DEFAULT NULL AFTER reset_token;</code></div>";
        }
        
        mysqli_close($conn);
    } else {
        echo "<div class='error'>❌ Database connection FAILED: " . mysqli_connect_error() . "</div>";
    }
}

// 6. Check EmailHelper
echo "<h2>6️⃣ EmailHelper Class</h2>";
$emailHelperFile = $backendPath . '/libs/EmailHelper.php';
if (file_exists($emailHelperFile)) {
    echo "<div class='success'>✅ EmailHelper.php found</div>";
    if (class_exists('EmailHelper')) {
        echo "<div class='success'>✅ EmailHelper class can be instantiated</div>";
    }
} else {
    echo "<div class='error'>❌ EmailHelper.php NOT found</div>";
}

// 7. Test Email Sending
echo "<h2>7️⃣ Send Test Email</h2>";
if (isset($_POST['send_test'])) {
    $to_email = $_POST['to_email'];
    
    if (!filter_var($to_email, FILTER_VALIDATE_EMAIL)) {
        echo "<div class='error'>❌ Invalid email address</div>";
    } else {
        try {
            require_once __DIR__ . '/libs/EmailHelper.php';
            $emailHelper = new EmailHelper();
            $result = $emailHelper->send(
                $to_email,
                'Test User',
                'VPS Diagnostic Test - OutFitKita',
                '<h1>✅ VPS Email Test</h1><p>If you receive this, Gmail SMTP is working on VPS!</p><p>Server: ' . gethostname() . '</p><p>Time: ' . date('Y-m-d H:i:s') . '</p>',
                'VPS Email Test Successful'
            );
            
            if ($result['status'] === 'success') {
                echo "<div class='success'>✅ Email sent successfully to: " . htmlspecialchars($to_email) . "<br>Check your inbox!</div>";
            } else {
                echo "<div class='error'>❌ Email failed: " . htmlspecialchars($result['message']) . "</div>";
            }
        } catch (Exception $e) {
            echo "<div class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
        }
    }
}

echo "<form method='POST'>";
echo "<input type='email' name='to_email' placeholder='your-email@gmail.com' required style='width:100%;padding:10px;border:1px solid #d1d5db;border-radius:4px;box-sizing:border-box;margin-bottom:10px;'>";
echo "<button type='submit' name='send_test' style='background:#7c3aed;color:white;padding:10px 20px;border:none;border-radius:4px;cursor:pointer;font-weight:bold;'>Send Test Email</button>";
echo "</form>";

// 8. Setup Instructions
echo "<h2>8️⃣ Next Steps</h2>";
echo "<div class='info'>";
echo "<h3>If everything is ✅:</h3>";
echo "1. Test forgot password flow at: <code>https://outfitkita.my.id/forgot-password</code><br>";
echo "2. Enter registered email<br>";
echo "3. Check inbox for reset password email<br>";
echo "4. Click link and reset password<br>";
echo "<br>";
echo "<h3>If something is ❌:</h3>";
echo "1. Add missing database columns (use SQL above)<br>";
echo "2. Enable missing PHP extensions<br>";
echo "3. Check .env file configuration<br>";
echo "4. Run: <code>cd " . htmlspecialchars($backendPath) . " && composer install</code><br>";
echo "</div>";

echo "</div></body></html>";
?>

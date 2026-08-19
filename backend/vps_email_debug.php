<?php
/**
 * VPS Email Test & Debug Script
 * Upload file ini ke VPS untuk debug masalah email
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>VPS Email Debug</title>";
echo "<style>body{font-family:monospace;background:#1e1e1e;color:#d4d4d4;padding:20px;margin:0;}";
echo ".container{max-width:900px;margin:0 auto;background:#252526;padding:20px;border-radius:8px;}";
echo "h1{color:#4ec9b0;}h2{color:#569cd6;margin-top:20px;border-bottom:1px solid #3e3e42;padding-bottom:10px;}";
echo ".success{background:#13a10e;color:white;padding:15px;border-radius:4px;margin:10px 0;}";
echo ".error{background:#f48771;color:#1e1e1e;padding:15px;border-radius:4px;margin:10px 0;}";
echo ".info{background:#0e639c;color:white;padding:15px;border-radius:4px;margin:10px 0;}";
echo ".config{background:#1e1e1e;padding:15px;border-radius:4px;margin:10px 0;border-left:3px solid #4ec9b0;}";
echo ".config div{margin:8px 0;}</style></head><body><div class='container'>";

echo "<h1>🔧 VPS Email Debug Console</h1>";

// Check if vendor/autoload.php exists
echo "<h2>1️⃣ Check PHPMailer Installation</h2>";
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo "<div class='success'>✅ PHPMailer vendor folder found</div>";
    require_once __DIR__ . '/vendor/autoload.php';
} else {
    echo "<div class='error'>❌ PHPMailer NOT installed</div>";
    echo "<div class='info'>Run: <code>cd /var/www/html/api/backend && composer install</code></div>";
    die("</div></body></html>");
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Check .env file
echo "<h2>2️⃣ Check .env File</h2>";
$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    echo "<div class='error'>❌ File .env NOT found at: $envFile</div>";
    echo "<div class='info'>Create .env file with Gmail credentials</div>";
    die("</div></body></html>");
}

echo "<div class='success'>✅ File .env found</div>";

// Load .env
$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0 || strpos($line, '=') === false) {
        continue;
    }
    list($name, $value) = explode('=', $line, 2);
    $name = trim($name);
    $value = trim($value);
    putenv("$name=$value");
    $_ENV[$name] = $value;
}

// Check configuration
echo "<h2>3️⃣ Configuration Check</h2>";
$username = getenv('GMAIL_USERNAME');
$password = getenv('GMAIL_PASSWORD');
$host = getenv('GMAIL_SMTP_HOST') ?: 'smtp.gmail.com';
$port = getenv('GMAIL_SMTP_PORT') ?: 587;

echo "<div class='config'>";
echo "<div>GMAIL_USERNAME: " . ($username ? '✅ ' . htmlspecialchars($username) : '❌ NOT SET') . "</div>";
echo "<div>GMAIL_PASSWORD: " . ($password ? '✅ ' . str_repeat('*', strlen($password)) . ' (' . strlen($password) . ' chars)' : '❌ NOT SET') . "</div>";
echo "<div>GMAIL_SMTP_HOST: " . htmlspecialchars($host) . "</div>";
echo "<div>GMAIL_SMTP_PORT: " . htmlspecialchars($port) . "</div>";
echo "</div>";

if (empty($username) || empty($password)) {
    echo "<div class='error'>❌ Gmail credentials not configured in .env</div>";
    die("</div></body></html>");
}

// Check PHP extensions
echo "<h2>4️⃣ PHP Extensions Check</h2>";
$extensions = ['openssl', 'sockets', 'mbstring'];
$missingExt = [];
foreach ($extensions as $ext) {
    if (extension_loaded($ext)) {
        echo "<div class='success'>✅ $ext extension loaded</div>";
    } else {
        echo "<div class='error'>❌ $ext extension NOT loaded</div>";
        $missingExt[] = $ext;
    }
}

if (!empty($missingExt)) {
    echo "<div class='info'>Enable missing extensions in php.ini: " . implode(', ', $missingExt) . "</div>";
}

// Check socket connection
echo "<h2>5️⃣ SMTP Connection Test</h2>";
echo "<div class='info'>Testing connection to $host:$port...</div>";

$socket = @fsockopen($host, $port, $errno, $errstr, 10);
if ($socket) {
    echo "<div class='success'>✅ Socket connection successful</div>";
    fclose($socket);
} else {
    echo "<div class='error'>❌ Socket connection FAILED: $errstr ($errno)</div>";
    echo "<div class='info'>Possible causes:<br>";
    echo "- VPS firewall blocking port $port<br>";
    echo "- ISP blocking SMTP ports<br>";
    echo "- Check with: telnet smtp.gmail.com $port</div>";
}

// Test PHPMailer
echo "<h2>6️⃣ PHPMailer SMTP Test</h2>";

if (isset($_POST['test_email'])) {
    $to_email = $_POST['to_email'];
    
    $mail = new PHPMailer(true);
    
    try {
        $mail->SMTPDebug = SMTP::DEBUG_OFF;
        $mail->isSMTP();
        $mail->Host = $host;
        $mail->SMTPAuth = true;
        $mail->Username = $username;
        $mail->Password = $password;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $port;
        
        // Timeout settings for VPS
        $mail->Timeout = 30;
        $mail->SMTPKeepAlive = true;
        
        $mail->setFrom($username, 'OutFitKita VPS Test');
        $mail->addAddress($to_email);
        $mail->isHTML(true);
        $mail->Subject = 'VPS Test Email - OutFitKita';
        $mail->Body = '<h1>✅ VPS Email Test Berhasil!</h1><p>Gmail SMTP di VPS sudah berfungsi.</p><p>Server: ' . gethostname() . '</p><p>Time: ' . date('Y-m-d H:i:s') . '</p>';
        $mail->AltBody = 'VPS Email Test Berhasil';
        
        $mail->send();
        
        echo "<div class='success'>✅ EMAIL SENT SUCCESSFULLY!</div>";
        echo "<div class='info'>Email dikirim ke: " . htmlspecialchars($to_email) . "<br>Check your inbox (or spam folder)</div>";
        
    } catch (Exception $e) {
        echo "<div class='error'>❌ EMAIL SEND FAILED</div>";
        echo "<div class='error'>Error: " . htmlspecialchars($e->getMessage()) . "</div>";
        
        echo "<div class='info'><strong>Troubleshooting Steps:</strong><br>";
        echo "1. Verify App Password is correct (16 digits, no spaces)<br>";
        echo "2. Check if port 587 is open: <code>telnet smtp.gmail.com 587</code><br>";
        echo "3. Try alternative port 465 (SSL) instead of 587 (TLS)<br>";
        echo "4. Contact VPS provider about SMTP restrictions<br>";
        echo "5. Check VPS firewall: <code>sudo ufw status</code></div>";
    }
}

echo "<form method='POST' style='margin-top:20px;'>";
echo "<input type='email' name='to_email' placeholder='your-email@gmail.com' required style='width:100%;padding:10px;background:#3c3c3c;color:#d4d4d4;border:1px solid #3e3e42;border-radius:4px;box-sizing:border-box;margin-bottom:10px;'>";
echo "<button type='submit' name='test_email' style='background:#007acc;color:white;padding:10px 20px;border:none;border-radius:4px;cursor:pointer;'>Send Test Email</button>";
echo "</form>";

// Server info
echo "<h2>7️⃣ Server Information</h2>";
echo "<div class='config'>";
echo "<div>PHP Version: " . PHP_VERSION . "</div>";
echo "<div>Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "</div>";
echo "<div>Hostname: " . gethostname() . "</div>";
echo "<div>Server IP: " . ($_SERVER['SERVER_ADDR'] ?? gethostbyname(gethostname())) . "</div>";
echo "<div>Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "</div>";
echo "<div>Script Path: " . __FILE__ . "</div>";
echo "</div>";

echo "</div></body></html>";
?>

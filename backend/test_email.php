<?php
/**
 * Test Gmail SMTP Configuration
 * 
 * Access this file via browser: http://localhost/ecommerce/backend/test_email.php
 * 
 * @author OutFitKita
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/libs/EmailHelper.php';

// Load environment
putenv('GMAIL_USERNAME=' . (getenv('GMAIL_USERNAME') ?: 'your-email@gmail.com'));
putenv('GMAIL_PASSWORD=' . (getenv('GMAIL_PASSWORD') ?: 'your-app-password'));
putenv('GMAIL_SMTP_HOST=' . (getenv('GMAIL_SMTP_HOST') ?: 'smtp.gmail.com'));
putenv('GMAIL_SMTP_PORT=' . (getenv('GMAIL_SMTP_PORT') ?: '587'));
putenv('GMAIL_ENCRYPTION=' . (getenv('GMAIL_ENCRYPTION') ?: 'tls'));

echo '<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Gmail SMTP - OutFitKita</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; margin: 0; }
        .container { max-width: 700px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #7c3aed; margin-top: 0; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
        input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { background: linear-gradient(to right, #7c3aed, #2563eb); color: #fff; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 16px; }
        button:hover { opacity: 0.9; }
        .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
        .success { background: #d1fae5; border: 1px solid #34d399; color: #065f46; }
        .error { background: #fee2e2; border: 1px solid #f87171; color: #991b1b; }
        .info { background: #e0f2fe; border: 1px solid #7dd3fc; color: #075985; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📧 Test Gmail SMTP Configuration</h1>
        
        <div class="info">
            <strong>Info:</strong> Pastikan file <code>backend/.env</code> sudah dikonfigurasi dengan Gmail App Password yang benar.
        </div>

        <form method="POST">
            <div class="form-group">
                <label for="to_email">To Email (Email Penerima)</label>
                <input type="email" id="to_email" name="to_email" value="' . (isset($_POST['to_email']) ? htmlspecialchars($_POST['to_email']) : '') . '" required>
            </div>

            <div class="form-group">
                <label for="to_name">Name (Nama Penerima)</label>
                <input type="text" id="to_name" name="to_name" value="' . (isset($_POST['to_name']) ? htmlspecialchars($_POST['to_name']) : 'User') . '" required>
            </div>

            <div class="form-group">
                <label for="test_type">Test Type</label>
                <select id="test_type" name="test_type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                    <option value="simple" ' . (isset($_POST['test_type']) && $_POST['test_type'] === 'simple' ? 'selected' : '') . '>Simple Test</option>
                    <option value="password_reset" ' . (isset($_POST['test_type']) && $_POST['test_type'] === 'password_reset' ? 'selected' : '') . '>Password Reset Email</option>
                </select>
            </div>

            <button type="submit" name="test_email">Send Test Email</button>
        </form>';

// Handle form submission
if (isset($_POST['test_email'])) {
    $to_email = $_POST['to_email'];
    $to_name = $_POST['to_name'];
    $test_type = $_POST['test_type'] ?? 'simple';

    $emailHelper = new EmailHelper();

    if ($test_type === 'password_reset') {
        // Generate random token for testing
        $test_token = bin2hex(random_bytes(16));
        $result = $emailHelper->sendPasswordResetEmail($to_email, $to_name, $test_token);
    } else {
        // Simple test email
        $subject = 'Test Email - OutFitKita';
        $body = '
            <html>
            <head>
                <style>body { font-family: Arial, sans-serif; padding: 20px; }</style>
            </head>
            <body>
                <h1>Test Email dari OutFitKita</h1>
                <p>Jika Anda menerima email ini, konfigurasi Gmail SMTP berhasil!</p>
                <p><strong>Waktu:</strong> ' . date('Y-m-d H:i:s') . '</p>
            </body>
            </html>
        ';
        $result = $emailHelper->send($to_email, $to_name, $subject, $body);
    }

    // Display result
    echo '<div class="result ' . ($result['status'] === 'success' ? 'success' : 'error') . '">';
    
    if ($result['status'] === 'success') {
        echo '
            <h2>✅ Email Berhasil Dikirim!</h2>
            <p>Email sudah dikirim ke <strong>' . htmlspecialchars($to_email) . '</strong></p>
            <p>Silakan cek inbox email Anda (atau folder spam jika tidak muncul).</p>
        ';
        
        if ($test_type === 'password_reset') {
            $test_token = bin2hex(random_bytes(16));
            echo '
                <h3>📋 Test Reset Password Link:</h3>
                <p>Link reset password (untuk testing):</p>
                <p><code>http://localhost:5173/reset-password?token=' . $test_token . '</code></p>
            ';
        }
    } else {
        echo '
            <h2>❌ Email Gagal Dikirim</h2>
            <p>Error: ' . htmlspecialchars($result['message']) . '</p>
            <h3>Pemecahan Masalah:</h3>
            <ol>
                <li>pastikan file <code>backend/.env</code> sudah dikonfigurasi</li>
                <li>pastikan <strong>GMAIL_USERNAME</strong> benar (email lengkap)</li>
                <li>pastikan <strong>GMAIL_PASSWORD</strong> adalah App Password (16 digit, tanpa spasi)</li>
                <li>pastikan 2-Step Verification sudah aktif di akun Gmail</li>
                <li>restart Apache/Nginx setelah update .env</li>
            </ol>
        ';
    }
    
    echo '</div>';
}

echo '</div></body></html>';
?>

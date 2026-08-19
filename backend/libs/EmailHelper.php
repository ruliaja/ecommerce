<?php
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailHelper {
    private $config;
    
    public function __construct() {
        // Load environment variables from .env file
        $this->loadEnv();
        
        $this->config = [
            'host' => getenv('GMAIL_SMTP_HOST') ?: 'smtp.gmail.com',
            'port' => getenv('GMAIL_SMTP_PORT') ?: 587,
            'username' => getenv('GMAIL_USERNAME') ?: '',
            'password' => getenv('GMAIL_PASSWORD') ?: '',
            'from_email' => getenv('GMAIL_USERNAME') ?: '',
            'from_name' => 'OutFitKita',
            'encryption' => getenv('GMAIL_ENCRYPTION') ?: 'tls'
        ];
    }
    
    /**
     * Load environment variables from .env file
     */
    private function loadEnv() {
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                // Skip comments
                if (strpos(trim($line), '#') === 0) {
                    continue;
                }
                // Parse line
                if (strpos($line, '=') !== false) {
                    list($name, $value) = explode('=', $line, 2);
                    $name = trim($name);
                    $value = trim($value);
                    // Set environment variable
                    putenv("$name=$value");
                    $_ENV[$name] = $value;
                }
            }
        }
    }
    
    /**
     * Send email using Gmail SMTP
     * 
     * @param string $to - Recipient email
     * @param string $toName - Recipient name
     * @param string $subject - Email subject
     * @param string $body - HTML email body
     * @param string $altBody - Plain text email body (optional)
     * @return array - Status and message
     */
    public function send($to, $toName, $subject, $body, $altBody = '') {
        // Validate configuration
        if (empty($this->config['username']) || empty($this->config['password'])) {
            return [
                'status' => 'error',
                'message' => 'Email configuration not set. Please configure GMAIL_USERNAME and GMAIL_PASSWORD in .env file'
            ];
        }
        
        $mail = new PHPMailer(true);
        
        try {
            // Server settings
            $mail->SMTPDebug = SMTP::DEBUG_OFF; // Disable debug output for production
            $mail->isSMTP();
            $mail->Host = $this->config['host'];
            $mail->SMTPAuth = true;
            $mail->Username = $this->config['username'];
            $mail->Password = $this->config['password'];
            
            // Set encryption based on port
            if ($this->config['port'] == 465) {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL
            } else {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // TLS
            }
            
            $mail->Port = $this->config['port'];
            
            // Recipients
            $mail->setFrom($this->config['from_email'], $this->config['from_name']);
            $mail->addAddress($to, $toName);
            $mail->addReplyTo($this->config['from_email'], $this->config['from_name']);
            
            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $body;
            if ($altBody) {
                $mail->AltBody = $altBody;
            }
            
            // Send email
            $mail->send();
            
            return [
                'status' => 'success',
                'message' => 'Email sent successfully'
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => "Email could not be sent. Mailer Error: {$mail->ErrorInfo}"
            ];
        }
    }
    
    /**
     * Send password reset email
     * 
     * @param string $to - Recipient email
     * @param string $name - Recipient name
     * @param string $token - Reset token
     * @return array - Status and message
     */
    public function sendPasswordResetEmail($to, $name, $token) {
        $reset_link = (getenv('BASE_URL') ?: 'https://outfitkita.my.id') . "/reset-password?token=" . $token;
        
        $subject = "Reset Password - OutFitKita";
        
        $body = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0; }
                    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                    h2 { color: #7c3aed; margin-top: 0; }
                    .button { display: inline-block; background: linear-gradient(to right, #7c3aed, #2563eb); color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
                    .button:hover { opacity: 0.9; }
                    .info-box { background-color: #f8fafc; border-left: 4px solid #7c3aed; padding: 12px; margin: 20px 0; }
                    .footer { margin-top: 30px; font-size: 12px; color: #888888; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <h2>🔐 Reset Password</h2>
                    <p>Halo <strong>" . htmlspecialchars($name) . "</strong>,</p>
                    <p>Kami menerima permintaan untuk mereset password akun Anda di <strong>OutFitKita</strong>.</p>
                    
                    <div style='text-align: center;'>
                        <a href='" . $reset_link . "' class='button'>Reset Password Sekarang</a>
                    </div>
                    
                    <div class='info-box'>
                        <p style='margin: 0;'><strong>⏰ Link ini berlaku selama 1 jam</strong></p>
                    </div>
                    
                    <p>Atau salin link berikut ke browser Anda:</p>
                    <p style='background: #f8f8f8; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;'>" . $reset_link . "</p>
                    
                    <p style='color: #666; font-size: 14px;'><strong>Penting:</strong> Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.</p>
                    
                    <div class='footer'>
                        <p>© " . date('Y') . " OutFitKita. Semua hak dilindungi.</p>
                        <p>Email ini dikirim secara otomatis, mohon jangan membalas email ini.</p>
                    </div>
                </div>
            </body>
            </html>
        ";
        
        $altBody = "Reset Password - OutFitKita\n\nHalo $name,\n\nKami menerima permintaan untuk mereset password akun Anda.\n\nKlik link berikut untuk reset password: $reset_link\n\nLink ini berlaku selama 1 jam.\n\nJika Anda tidak meminta reset password, abaikan email ini.\n\n© " . date('Y') . " OutFitKita";
        
        return $this->send($to, $name, $subject, $body, $altBody);
    }
}
?>

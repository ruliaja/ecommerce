<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTHelper {
    private static $secret_key = null;
    private static $issuer = null;
    private static $audience = null;
    private static $algorithm = 'HS256';
    
    /**
     * Initialize JWT configuration from environment variables
     */
    private static function initConfig() {
        if (self::$secret_key === null) {
            self::$secret_key = $_ENV['JWT_SECRET_KEY'] ?? "your_secret_key_here_change_in_production_2026";
            self::$issuer = $_ENV['JWT_ISSUER'] ?? "outfitkita.my.id";
            self::$audience = $_ENV['JWT_AUDIENCE'] ?? "outfitkita.my.id";
        }
    }
    
    /**
     * Generate JWT token for user
     */
    public static function generateToken($userId, $email, $role = 'customer', $expiresIn = null) {
        self::initConfig();
        
        if ($expiresIn === null) {
            $expiresIn = (int)($_ENV['JWT_ACCESS_TOKEN_EXPIRY'] ?? 86400); // 24 hours
        }
        
        $issuedAt = time();
        $expirationTime = $issuedAt + $expiresIn;
        
        $payload = [
            'iss' => self::$issuer,
            'aud' => self::$audience,
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'data' => [
                'userId' => $userId,
                'email' => $email,
                'role' => $role
            ]
        ];
        
        return JWT::encode($payload, self::$secret_key, self::$algorithm);
    }
    
    /**
     * Validate and decode JWT token
     */
    public static function validateToken($token) {
        self::initConfig();
        
        try {
            $decoded = JWT::decode($token, new Key(self::$secret_key, self::$algorithm));
            return [
                'status' => 'success',
                'data' => $decoded->data
            ];
        } catch (\Firebase\JWT\ExpiredException $e) {
            return [
                'status' => 'error',
                'message' => 'Token telah kedaluwarsa'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Token tidak valid: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Generate refresh token (longer expiration)
     */
    public static function generateRefreshToken($userId, $email, $role = 'customer') {
        $refreshExpiry = (int)($_ENV['JWT_REFRESH_TOKEN_EXPIRY'] ?? 604800); // 7 days
        return self::generateToken($userId, $email, $role, $refreshExpiry);
    }
    
    /**
     * Extract token from Authorization header
     */
    public static function getBearerToken() {
        $headers = null;
        
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } else if (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        // Extract token from Bearer
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }
    
    /**
     * Verify request has valid token and return user data
     */
    public static function verifyRequest() {
        $token = self::getBearerToken();
        
        if (!$token) {
            return [
                'status' => 'error',
                'message' => 'Token tidak ditemukan'
            ];
        }
        
        return self::validateToken($token);
    }
}
?>

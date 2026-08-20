<?php
use League\OAuth2\Client\Provider\Google;

class OAuthHelper {
    private static $googleClientId = null;
    private static $googleClientSecret = null;
    private static $googleRedirectUri = null;
    
    /**
     * Initialize Google OAuth configuration from environment
     */
    private static function initGoogleConfig() {
        if (self::$googleClientId === null) {
            self::$googleClientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
            self::$googleClientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? '';
            self::$googleRedirectUri = $_ENV['GOOGLE_REDIRECT_URI'] ?? 'https://outfitkita.my.id/auth/google/callback';
        }
    }
    
    /**
     * Get Google OAuth provider instance
     */
    public static function getGoogleProvider() {
        self::initGoogleConfig();
        
        if (empty(self::$googleClientId) || empty(self::$googleClientSecret)) {
            throw new Exception('Google OAuth tidak dikonfigurasi dengan benar');
        }
        
        return new Google([
            'clientId'     => self::$googleClientId,
            'clientSecret' => self::$googleClientSecret,
            'redirectUri'  => self::$googleRedirectUri,
        ]);
    }
    
    /**
     * Get Google authorization URL
     */
    public static function getGoogleAuthUrl() {
        try {
            $provider = self::getGoogleProvider();
            
            $authUrl = $provider->getAuthorizationUrl([
                'scope' => ['email', 'profile']
            ]);
            
            // Store state in session for CSRF protection
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $_SESSION['oauth2state'] = $provider->getState();
            
            return [
                'status' => 'success',
                'authUrl' => $authUrl,
                'state' => $provider->getState()
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Handle Google OAuth callback
     */
    public static function handleGoogleCallback($code, $state = null) {
        try {
            // Verify state to prevent CSRF
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if ($state !== null && (!isset($_SESSION['oauth2state']) || $state !== $_SESSION['oauth2state'])) {
                unset($_SESSION['oauth2state']);
                throw new Exception('Invalid state parameter');
            }
            
            $provider = self::getGoogleProvider();
            
            // Get access token
            $token = $provider->getAccessToken('authorization_code', [
                'code' => $code
            ]);
            
            // Get user details
            $user = $provider->getResourceOwner($token);
            $userArray = $user->toArray();
            
            return [
                'status' => 'success',
                'user' => [
                    'email' => $userArray['email'] ?? '',
                    'name' => $userArray['name'] ?? '',
                    'google_id' => $userArray['sub'] ?? $userArray['id'] ?? '',
                    'profile_image' => $userArray['picture'] ?? null,
                    'email_verified' => $userArray['email_verified'] ?? false
                ]
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
}
?>

<?php
// REGISTER
function register($db, $data) {
    if (!isset($data['name']) || !isset($data['email']) || !isset($data['password']) || !isset($data['username'])) {
        return ["status" => "error", "message" => "Data tidak lengkap"];
    }

    $password_hashed = password_hash($data['password'], PASSWORD_BCRYPT);
    $name = $db->real_escape_string($data['name']);
    $email = $db->real_escape_string($data['email']);
    $username = $db->real_escape_string($data['username']);
    
    // Validate username format (alphanumeric, underscore, dash only)
    if (!preg_match('/^[a-zA-Z0-9_-]{3,30}$/', $username)) {
        return ["status" => "error", "message" => "Username hanya boleh mengandung huruf, angka, underscore (_), dan dash (-). Panjang 3-30 karakter"];
    }
    
    try {
        // Check if username already exists
        $checkUsername = $db->prepare("SELECT id FROM users WHERE username = ?");
        $checkUsername->bind_param("s", $username);
        $checkUsername->execute();
        $result = $checkUsername->get_result();
        
        if ($result->num_rows > 0) {
            $checkUsername->close();
            return ["status" => "error", "message" => "Username sudah digunakan"];
        }
        $checkUsername->close();
        
        $query = "INSERT INTO users (name, email, username, password, role) VALUES (?, ?, ?, ?, 'customer')";
        $stmt = $db->prepare($query);
        
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }
        
        $stmt->bind_param("ssss", $name, $email, $username, $password_hashed);
        
        if ($stmt->execute()) {
            $stmt->close();
            return ["status" => "success", "message" => "User berhasil didaftarkan"];
        } else {
            $error_msg = $stmt->error;
            $stmt->close();
            
            if (strpos($error_msg, 'Duplicate entry') !== false) {
                if (strpos($error_msg, 'email') !== false) {
                    return ["status" => "error", "message" => "Email sudah terdaftar"];
                } else if (strpos($error_msg, 'username') !== false) {
                    return ["status" => "error", "message" => "Username sudah digunakan"];
                }
            }
            return ["status" => "error", "message" => "Error: " . $error_msg];
        }
    } catch (Exception $e) {
        return ["status" => "error", "message" => "Exception: " . $e->getMessage()];
    }
}

// LOGIN
function login($db, $data) {
    if (!isset($data['email']) || !isset($data['password'])) {
        return ["status" => "error", "message" => "Email dan password harus diisi"];
    }

    try {
        $email = $db->real_escape_string($data['email']);
        $password = $data['password'];
        
        $query = "SELECT id, name, username, email, phone, profile_image, role FROM users WHERE email = ?";
        $stmt = $db->prepare($query);
        
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }
        
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $stmt->close();
            return ["status" => "error", "message" => "Email atau password salah"];
        }
        
        $user = $result->fetch_assoc();
        
        // Get password dari database untuk verify
        $query_pass = "SELECT password FROM users WHERE email = ?";
        $stmt_pass = $db->prepare($query_pass);
        $stmt_pass->bind_param("s", $email);
        $stmt_pass->execute();
        $result_pass = $stmt_pass->get_result();
        $user_pass = $result_pass->fetch_assoc();
        $stmt_pass->close();
        
        if (password_verify($password, $user_pass['password'])) {
            $stmt->close();
            return [
                "status" => "success", 
                "message" => "Login berhasil",
                "user" => $user,
                "token" => bin2hex(random_bytes(32))
            ];
        }
        
        $stmt->close();
        return ["status" => "error", "message" => "Email atau password salah"];
    } catch (Exception $e) {
        return ["status" => "error", "message" => "Exception: " . $e->getMessage()];
    }
}

// CHANGE PASSWORD
function changePassword($db, $data) {
    if (!isset($data['user_id']) || !isset($data['old_password']) || !isset($data['new_password'])) {
        return ["status" => "error", "message" => "Data tidak lengkap"];
    }

    try {
        $user_id = (int)$data['user_id'];
        $old_password = $data['old_password'];
        $new_password = $data['new_password'];
        
        // Validate new password
        if (strlen($new_password) < 6) {
            return ["status" => "error", "message" => "Password baru harus minimal 6 karakter"];
        }
        
        // Get user's current password from database
        $query = "SELECT password FROM users WHERE id = ?";
        $stmt = $db->prepare($query);
        
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }
        
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $stmt->close();
            return ["status" => "error", "message" => "User tidak ditemukan"];
        }
        
        $user = $result->fetch_assoc();
        $stmt->close();
        
        // Verify old password
        if (!password_verify($old_password, $user['password'])) {
            return ["status" => "error", "message" => "Password lama salah"];
        }
        
        // Hash new password
        $new_password_hashed = password_hash($new_password, PASSWORD_BCRYPT);
        
        // Update password
        $update_query = "UPDATE users SET password = ? WHERE id = ?";
        $update_stmt = $db->prepare($update_query);
        
        if (!$update_stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }
        
        $update_stmt->bind_param("si", $new_password_hashed, $user_id);
        
        if ($update_stmt->execute()) {
            $update_stmt->close();
            return ["status" => "success", "message" => "Password berhasil diubah"];
        } else {
            $error_msg = $update_stmt->error;
            $update_stmt->close();
            return ["status" => "error", "message" => "Error: " . $error_msg];
        }
    } catch (Exception $e) {
        return ["status" => "error", "message" => "Exception: " . $e->getMessage()];
    }
}

// ADMIN LOGIN
function loginAdmin($db, $data) {
    if (!isset($data['email']) || !isset($data['password'])) {
        return ["status" => "error", "message" => "Email dan password harus diisi"];
    }

    try {
        $email = $db->real_escape_string($data['email']);
        $password = $data['password'];
        
        $query = "SELECT id, name, email, profile_image FROM admins WHERE email = ?";
        $stmt = $db->prepare($query);
        
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }
        
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $stmt->close();
            return ["status" => "error", "message" => "Email atau password admin salah"];
        }
        
        $admin = $result->fetch_assoc();
        
        // Get password dari database untuk verify
        $query_pass = "SELECT password FROM admins WHERE email = ?";
        $stmt_pass = $db->prepare($query_pass);
        $stmt_pass->bind_param("s", $email);
        $stmt_pass->execute();
        $result_pass = $stmt_pass->get_result();
        $admin_pass = $result_pass->fetch_assoc();
        $stmt_pass->close();
        
        if (password_verify($password, $admin_pass['password'])) {
            $stmt->close();
            $admin['role'] = 'admin'; // For frontend compatibility
            return [
                "status" => "success", 
                "message" => "Login admin berhasil",
                "user" => $admin,
                "token" => bin2hex(random_bytes(32)),
                "type" => "admin"
            ];
        }
        
        $stmt->close();
        return ["status" => "error", "message" => "Email atau password admin salah"];
    } catch (Exception $e) {
        return ["status" => "error", "message" => "Exception: " . $e->getMessage()];
    }
}

// FORGOT PASSWORD
function forgotPassword($db, $data) {
    if (!isset($data['email']) || empty($data['email'])) {
        return ["status" => "error", "message" => "Email harus diisi"];
    }

    try {
        $email = $db->real_escape_string($data['email']);

        // Check if user exists
        $query = "SELECT id, name, email FROM users WHERE email = ?";
        $stmt = $db->prepare($query);

        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            // Jangan beri tahu user bahwa email tidak terdaftar (keamanan)
            return ["status" => "success", "message" => "Jika email terdaftar, link reset password akan dikirim"];
        }

        $user = $result->fetch_assoc();
        $stmt->close();

        // Generate token
        $token = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Simpan token ke database
        $update_query = "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?";
        $update_stmt = $db->prepare($update_query);

        if (!$update_stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $update_stmt->bind_param("ssi", $token, $expiry, $user['id']);

        if (!$update_stmt->execute()) {
            $error_msg = $update_stmt->error;
            $update_stmt->close();
            return ["status" => "error", "message" => "Error: " . $error_msg];
        }
        $update_stmt->close();

        // Kirim email reset password
        $reset_link = "https://outfitkita.my.id/reset-password?token=" . $token;
        $subject = "Reset Password - OutFitKita";
        $message = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px; }
                    h2 { color: #7c3aed; }
                    .button { display: inline-block; background: linear-gradient(to right, #7c3aed, #2563eb); color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
                    .footer { margin-top: 20px; font-size: 12px; color: #888888; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <h2>Reset Password</h2>
                    <p>Halo <strong>" . $user['name'] . "</strong>,</p>
                    <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah ini untuk membuat password baru:</p>
                    <p style='text-align: center;'>
                        <a href='" . $reset_link . "' class='button'>Reset Password</a>
                    </p>
                    <p>Link ini berlaku selama <strong>1 jam</strong>. Jika Anda tidak meminta reset password, abaikan email ini.</p>
                    <div class='footer'>
                        <p>© " . date('Y') . " OutFitKita. Semua hak dilindungi.</p>
                    </div>
                </div>
            </body>
            </html>
        ";

        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8" . "\r\n";
        $headers .= "From: OutFitKita <no-reply@outfitkita.my.id>" . "\r\n";

        $mail_sent = @mail($user['email'], $subject, $message, $headers);

        // Jika mail tidak tersedia, tetap return success (untuk development)
        return [
            "status" => "success",
            "message" => "Link reset password telah dikirim ke email Anda",
            "debug_token" => $mail_sent ? null : $token // Hanya untuk development
        ];
    } catch (Exception $e) {
        return ["status" => "error", "message" => "Exception: " . $e->getMessage()];
    }
}

// RESET PASSWORD
function resetPassword($db, $data) {
    if (!isset($data['token']) || !isset($data['new_password'])) {
        return ["status" => "error", "message" => "Data tidak lengkap"];
    }

    try {
        $token = $db->real_escape_string($data['token']);
        $new_password = $data['new_password'];

        // Validate password
        if (strlen($new_password) < 6) {
            return ["status" => "error", "message" => "Password baru harus minimal 6 karakter"];
        }

        // Cari user dengan token yang valid
        $query = "SELECT id, reset_token_expiry FROM users WHERE reset_token = ?";
        $stmt = $db->prepare($query);

        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("s", $token);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            return ["status" => "error", "message" => "Token tidak valid atau sudah digunakan"];
        }

        $user = $result->fetch_assoc();
        $stmt->close();

        // Cek apakah token sudah expired
        $expiry = strtotime($user['reset_token_expiry']);
        if ($expiry < time()) {
            return ["status" => "error", "message" => "Token sudah kedaluwarsa. Silakan minta link reset baru"];
        }

        // Hash password baru
        $new_password_hashed = password_hash($new_password, PASSWORD_BCRYPT);

        // Update password dan hapus token
        $update_query = "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?";
        $update_stmt = $db->prepare($update_query);

        if (!$update_stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $update_stmt->bind_param("si", $new_password_hashed, $user['id']);

        if ($update_stmt->execute()) {
            $update_stmt->close();
            return ["status" => "success", "message" => "Password berhasil direset. Silakan login dengan password baru"];
        } else {
            $error_msg = $update_stmt->error;
            $update_stmt->close();
            return ["status" => "error", "message" => "Error: " . $error_msg];
        }
    } catch (Exception $e) {
        return ["status" => "error", "message" => "Exception: " . $e->getMessage()];
    }
}
?>
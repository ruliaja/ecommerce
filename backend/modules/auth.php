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
?>
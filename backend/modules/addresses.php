<?php
// User Address Management - Multiple addresses per user

class AddressManager {
    private $conn;

    public function __construct($db_connection) {
        $this->conn = $db_connection;
    }

    // Get all addresses for a user
    public function getUserAddresses($user_id) {
        $query = "SELECT id, recipient_name, address, city, province, zipCode, label, is_default FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    // Get default address for a user
    public function getDefaultAddress($user_id) {
        $query = "SELECT id, recipient_name, address, city, province, zipCode, label FROM user_addresses WHERE user_id = ? AND is_default = TRUE LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_assoc();
    }

    // Get specific address by ID
    public function getAddressById($address_id, $user_id) {
        $query = "SELECT id, recipient_name, address, city, province, zipCode, label, is_default FROM user_addresses WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $address_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_assoc();
    }

    // Create new address
    public function createAddress($user_id, $recipient_name, $address, $city, $province, $zipCode, $label = 'Rumah', $is_default = false) {
        // Validate required fields
        if (empty($recipient_name) || empty($address) || empty($city) || empty($province) || empty($zipCode)) {
            return [
                'status' => 'error',
                'message' => 'Semua field harus diisi'
            ];
        }

        // If setting as default, unset previous default
        if ($is_default) {
            $updateQuery = "UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?";
            $updateStmt = $this->conn->prepare($updateQuery);
            $updateStmt->bind_param("i", $user_id);
            $updateStmt->execute();
        }

        $query = "INSERT INTO user_addresses (user_id, recipient_name, address, city, province, zipCode, label, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        
        if (!$stmt) {
            return [
                'status' => 'error',
                'message' => 'Prepare failed: ' . $this->conn->error
            ];
        }

        $stmt->bind_param("issssssi", $user_id, $recipient_name, $address, $city, $province, $zipCode, $label, $is_default);

        if ($stmt->execute()) {
            return [
                'status' => 'success',
                'message' => 'Alamat berhasil ditambahkan',
                'address_id' => $stmt->insert_id
            ];
        } else {
            return [
                'status' => 'error',
                'message' => 'Gagal menambahkan alamat: ' . $this->conn->error
            ];
        }
    }

    // Update address
    public function updateAddress($address_id, $user_id, $recipient_name, $address, $city, $province, $zipCode, $label, $is_default = false) {
        // Validate required fields
        if (empty($recipient_name) || empty($address) || empty($city) || empty($province) || empty($zipCode)) {
            return [
                'status' => 'error',
                'message' => 'Semua field harus diisi'
            ];
        }

        // If setting as default, unset previous default
        if ($is_default) {
            $updateQuery = "UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND id != ?";
            $updateStmt = $this->conn->prepare($updateQuery);
            $updateStmt->bind_param("ii", $user_id, $address_id);
            $updateStmt->execute();
        }

        $query = "UPDATE user_addresses SET recipient_name = ?, address = ?, city = ?, province = ?, zipCode = ?, label = ?, is_default = ? WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        
        if (!$stmt) {
            return [
                'status' => 'error',
                'message' => 'Prepare failed: ' . $this->conn->error
            ];
        }

        $stmt->bind_param("sssssssii", $recipient_name, $address, $city, $province, $zipCode, $label, $is_default, $address_id, $user_id);

        if ($stmt->execute()) {
            return [
                'status' => 'success',
                'message' => 'Alamat berhasil diperbarui'
            ];
        } else {
            return [
                'status' => 'error',
                'message' => 'Gagal memperbarui alamat: ' . $this->conn->error
            ];
        }
    }

    // Delete address
    public function deleteAddress($address_id, $user_id) {
        $query = "DELETE FROM user_addresses WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $address_id, $user_id);

        if ($stmt->execute()) {
            return [
                'status' => 'success',
                'message' => 'Alamat berhasil dihapus'
            ];
        } else {
            return [
                'status' => 'error',
                'message' => 'Gagal menghapus alamat: ' . $this->conn->error
            ];
        }
    }

    // Set default address
    public function setDefaultAddress($address_id, $user_id) {
        // Unset all defaults first
        $updateQuery = "UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?";
        $updateStmt = $this->conn->prepare($updateQuery);
        $updateStmt->bind_param("i", $user_id);
        $updateStmt->execute();

        // Set new default
        $query = "UPDATE user_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $address_id, $user_id);

        if ($stmt->execute()) {
            return [
                'status' => 'success',
                'message' => 'Alamat default berhasil diperbarui'
            ];
        } else {
            return [
                'status' => 'error',
                'message' => 'Gagal memperbarui alamat default: ' . $this->conn->error
            ];
        }
    }
}
?>


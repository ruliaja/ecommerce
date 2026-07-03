<?php
require_once 'config/database.php';

$db->query('DROP TABLE IF EXISTS cart');

$sql = 'CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    guest_session_id VARCHAR(255) NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart (user_id, product_id, guest_session_id)
)';

if ($db->query($sql)) {
    echo 'Tabel cart berhasil dibuat ulang';
} else {
    echo 'Error: ' . $db->error;
}
?>

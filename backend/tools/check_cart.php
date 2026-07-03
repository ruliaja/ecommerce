<?php
require_once 'config/database.php';
$result = $db->query('SELECT * FROM cart LIMIT 10');
echo 'Total items in cart table: ' . $result->num_rows . PHP_EOL . PHP_EOL;
while ($row = $result->fetch_assoc()) {
    echo 'ID: ' . $row['id'] . ' | Product: ' . $row['product_id'] . ' | Quantity: ' . $row['quantity'] . ' | User: ' . ($row['user_id'] ?? 'NULL') . ' | Guest Session: ' . ($row['guest_session_id'] ?? 'NULL') . PHP_EOL;
}
?>

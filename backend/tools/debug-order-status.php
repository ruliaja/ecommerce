<?php
require_once 'config/database.php';

header('Content-Type: application/json');

// Fix all orders with empty status to 'pending'
$fix = $db->query("UPDATE orders SET status = 'pending' WHERE status = '' OR status IS NULL");
$affected = $db->affected_rows;

// Show all orders after fix
$result = $db->query("SELECT id, order_number, status FROM orders ORDER BY id DESC");
$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = $row;
}

echo json_encode([
    "message" => "Fixed $affected orders with empty status back to 'pending'",
    "orders" => $orders
], JSON_PRETTY_PRINT);
?>

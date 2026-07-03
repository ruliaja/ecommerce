<?php
header("Content-Type: application/json; charset=UTF-8");

require_once 'config/database.php';

try {
    // Check order_items table structure
    $result = $db->query("DESCRIBE order_items");
    
    if (!$result) {
        echo json_encode([
            "status" => "error", 
            "message" => "Table order_items tidak ditemukan"
        ]);
        exit;
    }
    
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = [
            'name' => $row['Field'],
            'type' => $row['Type'],
            'null' => $row['Null'],
            'key' => $row['Key'],
            'default' => $row['Default']
        ];
    }
    
    // Check if there are any order items
    $countResult = $db->query("SELECT COUNT(*) as count FROM order_items");
    $count = $countResult->fetch_assoc()['count'];
    
    echo json_encode([
        "status" => "success",
        "table" => "order_items",
        "columns" => $columns,
        "total_items" => (int)$count,
        "message" => "Order items table structure"
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>

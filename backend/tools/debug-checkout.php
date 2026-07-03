<?php
header("Content-Type: application/json; charset=UTF-8");

require_once 'config/database.php';

try {
    // Check orders table structure
    $result = $db->query("DESCRIBE orders");
    
    if (!$result) {
        echo json_encode([
            "status" => "error", 
            "message" => "Table orders tidak ditemukan"
        ]);
        exit;
    }
    
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = [
            'name' => $row['Field'],
            'type' => $row['Type'],
            'null' => $row['Null'],
            'default' => $row['Default']
        ];
    }
    
    echo json_encode([
        "status" => "success",
        "columns" => $columns,
        "message" => "Orders table structure"
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>

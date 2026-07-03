<?php
header("Content-Type: application/json; charset=UTF-8");

require_once 'config/database.php';

try {
    // Check orders table structure
    $result = $db->query("DESCRIBE orders");
    
    if (!$result) {
        echo json_encode(["status" => "error", "message" => "Table orders tidak ditemukan"]);
        exit;
    }
    
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = [
            'Field' => $row['Field'],
            'Type' => $row['Type'],
            'Null' => $row['Null'],
            'Key' => $row['Key'],
            'Default' => $row['Default'],
            'Extra' => $row['Extra']
        ];
    }
    
    echo json_encode([
        "status" => "success",
        "message" => "Kolom tabel orders:",
        "columns" => $columns
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>

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
        $columns[] = $row['Field'];
    }
    
    // Check if there are any orders in the table
    $countResult = $db->query("SELECT COUNT(*) as count FROM orders");
    $count = $countResult->fetch_assoc()['count'];
    
    // Get sample order if exists
    $sampleOrder = null;
    if ($count > 0) {
        $sampleResult = $db->query("SELECT * FROM orders LIMIT 1");
        $sampleOrder = $sampleResult->fetch_assoc();
    }
    
    echo json_encode([
        "status" => "success",
        "table_columns" => $columns,
        "total_orders" => (int)$count,
        "sample_order" => $sampleOrder,
        "message" => "Struktur tabel orders ditemukan"
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>

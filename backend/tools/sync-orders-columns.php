<?php
header("Content-Type: application/json; charset=UTF-8");
require_once 'config/database.php';

$results = [];

try {
    // Get existing columns
    $columnsResult = $db->query("DESCRIBE orders");
    $existingColumns = [];
    while ($col = $columnsResult->fetch_assoc()) {
        $existingColumns[] = $col['Field'];
    }

    // Columns to add if missing
    $columnsToAdd = [
        'customer_name'    => "VARCHAR(255) DEFAULT NULL AFTER user_id",
        'customer_email'   => "VARCHAR(255) DEFAULT NULL AFTER customer_name",
        'customer_phone'   => "VARCHAR(50) DEFAULT NULL AFTER customer_email",
        'customer_address' => "TEXT DEFAULT NULL AFTER customer_phone",
        'customer_city'    => "VARCHAR(100) DEFAULT NULL AFTER customer_address",
        'customer_zip'     => "VARCHAR(20) DEFAULT NULL AFTER customer_city",
        'shipping_method'  => "VARCHAR(50) DEFAULT 'standard' AFTER payment_method",
        'shipping_cost'    => "INT DEFAULT 0 AFTER total_amount",
        'tracking_number'  => "VARCHAR(100) DEFAULT NULL AFTER shipping_cost",
    ];

    foreach ($columnsToAdd as $colName => $colDef) {
        if (!in_array($colName, $existingColumns)) {
            $sql = "ALTER TABLE orders ADD COLUMN $colName $colDef";
            if ($db->query($sql)) {
                $results[] = "✅ Added column: $colName";
            } else {
                $results[] = "❌ Error adding $colName: " . $db->error;
            }
        } else {
            $results[] = "⏭️ Column $colName already exists";
        }
    }

    // Also ensure order_items has price column
    $oiColumnsResult = $db->query("DESCRIBE order_items");
    $oiExisting = [];
    while ($col = $oiColumnsResult->fetch_assoc()) {
        $oiExisting[] = $col['Field'];
    }
    if (!in_array('price', $oiExisting)) {
        $db->query("ALTER TABLE order_items ADD COLUMN price INT DEFAULT 0 AFTER quantity");
        $results[] = "✅ Added column price to order_items";
    } else {
        $results[] = "⏭️ order_items.price already exists";
    }

    echo json_encode([
        "status" => "success",
        "message" => "Column sync completed",
        "results" => $results
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
        "results" => $results
    ]);
}

$db->close();
?>

<?php
require_once 'config/database.php';

$result = $db->query("SELECT id, name, stock FROM products");
$fixes = 0;

while ($row = $result->fetch_assoc()) {
    $pid = $row['id'];
    $oldStock = $row['stock'];
    
    // Check if product has variants
    $varCheck = $db->query("SELECT SUM(stock) as total FROM product_variants WHERE product_id = $pid");
    $varRow = $varCheck->fetch_assoc();
    $varSum = $varRow['total'];
    
    if ($varSum !== null) {
        // Product has variants
        if ($oldStock != $varSum) {
            echo "Mismatch found for ID $pid ({$row['name']}): Product Stock = $oldStock, Variants Sum = $varSum. Fixing...\n";
            $db->query("UPDATE products SET stock = $varSum WHERE id = $pid");
            $fixes++;
        } else {
            echo "ID $pid ({$row['name']}) is in sync. (Total: $varSum)\n";
        }
    } else {
        echo "ID $pid ({$row['name']}) has no variants. (Base Stock: $oldStock)\n";
    }
}

echo "\nDone. Fixed $fixes products.\n";

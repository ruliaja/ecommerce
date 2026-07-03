<?php
require_once 'config/database.php';
$result = $db->query("SELECT id, name, stock FROM products");
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']} | Name: {$row['name']} | Stock: {$row['stock']}\n";
    $vRes = $db->query("SELECT size, color, stock FROM product_variants WHERE product_id = {$row['id']}");
    $vStock = 0;
    while ($v = $vRes->fetch_assoc()) {
        echo "  - Variant: {$v['size']} / {$v['color']} | Stock: {$v['stock']}\n";
        $vStock += $v['stock'];
    }
    echo "  -> Total Variant Stock: $vStock\n";
}

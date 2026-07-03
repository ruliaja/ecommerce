<?php
require_once 'config/database.php';

echo "=== SEMUA PESANAN ===\n";
$result = $db->query("SELECT id, order_number, status, total_price, created_at FROM orders ORDER BY created_at DESC");
while ($row = $result->fetch_assoc()) {
    echo "ID:{$row['id']} | {$row['order_number']} | Status: {$row['status']} | Total: Rp" . number_format($row['total_price']) . " | {$row['created_at']}\n";
}

echo "\n=== PENDAPATAN DASHBOARD (shipped/delivered/completed) ===\n";
$res = $db->query("SELECT SUM(total_price) as total FROM orders WHERE status IN ('shipped', 'delivered', 'completed')");
$row = $res->fetch_assoc();
echo "Total: Rp" . number_format($row['total']) . "\n";

echo "\n=== PENDAPATAN LAPORAN (shipped/delivered/completed) ===\n";
$res2 = $db->query("SELECT status, SUM(total_price) as total, COUNT(*) as cnt FROM orders WHERE status IN ('shipped', 'delivered', 'completed') GROUP BY status");
while ($row = $res2->fetch_assoc()) {
    echo "Status: {$row['status']} | Jumlah: {$row['cnt']} | Total: Rp" . number_format($row['total']) . "\n";
}

echo "\n=== PESANAN CANCEL ===\n";
$res3 = $db->query("SELECT id, order_number, status, total_price FROM orders WHERE status IN ('cancel', 'cancelled')");
while ($row = $res3->fetch_assoc()) {
    echo "ID:{$row['id']} | {$row['order_number']} | Status: {$row['status']} | Total: Rp" . number_format($row['total_price']) . "\n";
}

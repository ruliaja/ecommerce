<?php
require 'config/database.php';

echo "=== Verify user_addresses Table ===\n\n";

// Get count
$countResult = $db->query("SELECT COUNT(*) as cnt FROM user_addresses");
$countRow = $countResult->fetch_assoc();
echo "✅ Total addresses: " . $countRow['cnt'] . "\n\n";

// Get sample data
echo "=== Sample Data ===\n";
$result = $db->query("SELECT id, user_id, recipient_name, address, city, is_default FROM user_addresses LIMIT 5");
while($row = $result->fetch_assoc()) {
    echo "ID: " . $row['id'] . 
         " | User: " . $row['user_id'] . 
         " | Name: " . $row['recipient_name'] . 
         " | City: " . $row['city'] . 
         " | Default: " . ($row['is_default'] ? 'YES ⭐' : 'NO') . "\n";
}

echo "\n✅ Database migration successful!\n";
?>

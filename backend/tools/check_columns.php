<?php
require_once 'config/database.php';
$result = $db->query("DESCRIBE orders");
while ($row = $result->fetch_assoc()) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}

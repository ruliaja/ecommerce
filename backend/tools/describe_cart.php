require_once 'config/database.php';
$result = $db->query('DESCRIBE cart');
while ($row = $result->fetch_assoc()) {
    echo $row['Field'] . PHP_EOL;
}

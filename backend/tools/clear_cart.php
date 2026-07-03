<?php
require_once 'config/database.php';
$db->query('DELETE FROM cart');
echo 'Cart table cleared!';
?>

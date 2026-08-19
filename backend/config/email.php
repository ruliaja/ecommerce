<?php
// Email configuration untuk Gmail SMTP
return [
    'smtp' => [
        'host' => 'smtp.gmail.com',
        'port' => 587, // atau 465 untuk SSL
        'username' => getenv('GMAIL_USERNAME') ?: 'your-email@gmail.com',
        'password' => getenv('GMAIL_PASSWORD') ?: 'your-app-password', // Gunakan App Password, bukan password Gmail biasa
        'from_email' => getenv('GMAIL_USERNAME') ?: 'your-email@gmail.com',
        'from_name' => 'OutFitKita',
        'encryption' => 'tls' // 'tls' untuk port 587, 'ssl' untuk port 465
    ]
];
?>

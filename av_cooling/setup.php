<?php // Run ONCE after importing schema.sql, then DELETE this file.
require 'includes/bootstrap.php';
$rid=$pdo->query('SELECT id FROM roles WHERE name="admin"')->fetchColumn();
$pdo->prepare('INSERT IGNORE INTO users(role_id,name,email,password_hash) VALUES(?,?,?,?)')
    ->execute([$rid,'Administrator','admin@avcooling.local',password_hash('ChangeMe123!',PASSWORD_DEFAULT)]);
echo 'Admin created: admin@avcooling.local / ChangeMe123!  - change it, then delete setup.php';

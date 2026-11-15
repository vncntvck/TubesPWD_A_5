<?php
session_start();
if(!isset($_SESSION['id_pengguna'])){
    echo json_encode(['status' => false, 'pesan' => 'Silakan login dulu']);
    exit;
}
?>
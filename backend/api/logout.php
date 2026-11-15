<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['id_pengguna'])) {
    echo json_encode(['status' => false, 'pesan' => 'Belum login']);
    exit;
}
$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
session_destroy();
echo json_encode(['status' => true, 'pesan' => 'Logout berhasil']);
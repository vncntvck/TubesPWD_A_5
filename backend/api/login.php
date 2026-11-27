<?php
session_start();
header('Content-Type: application/json');
include '../config/koneksi.php';

$data = json_decode(file_get_contents('php://input'), true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

$query = $koneksi->prepare("SELECT * FROM pengguna WHERE username = ?");
$query->bind_param("s", $username);
$query->execute();
$hasil = $query->get_result()->fetch_assoc();

if ($hasil && password_verify($password, $hasil['password'])) {
    session_regenerate_id(true);
    $role = $hasil['role'] ?? 'user';
    $_SESSION['id_pengguna'] = $hasil['id_pengguna'];
    $_SESSION['username']    = $hasil['username'];
    $_SESSION['role']        = $role;

    echo json_encode([
        'status'      => true,
        'pesan'       => 'Login berhasil',
        'username'    => $hasil['username'],
        'id_pengguna' => $hasil['id_pengguna'],
        'role'        => $role
    ]);
} else {
    echo json_encode(['status' => false, 'pesan' => 'Username atau password salah']);
}
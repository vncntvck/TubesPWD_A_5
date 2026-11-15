<?php
header('Content-Type: application/json');
include '../config/koneksi.php';

$data = json_decode(file_get_contents('php://input'), true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';
$no_tlp   = $data['no_tlp'] ?? '';
$email    = $data['email'] ?? '';

// semua kolom wajib diisi
if ($username == '' || $password == '' || $no_tlp == '' || $email == '') {
    echo json_encode(['status' => false, 'pesan' => 'Semua data harus diisi']);
    exit;
}

// cek username / email udah kepake belum
$cek = $koneksi->prepare("SELECT id_pengguna FROM pengguna WHERE username = ? OR email = ?");
$cek->bind_param("ss", $username, $email);
$cek->execute();
$cek->store_result();

if ($cek->num_rows > 0) {
    echo json_encode(['status' => false, 'pesan' => 'Username atau email sudah terdaftar']);
    exit;
}

$password_hash = password_hash($password, PASSWORD_DEFAULT);

$simpan = $koneksi->prepare("INSERT INTO pengguna (username, password, no_tlp, email) VALUES (?, ?, ?, ?)");
$simpan->bind_param("ssss", $username, $password_hash, $no_tlp, $email);

if ($simpan->execute()) {
    echo json_encode(['status' => true, 'pesan' => 'Sign up berhasil']);
} else {
    echo json_encode(['status' => false, 'pesan' => 'Sign up gagal']);
}
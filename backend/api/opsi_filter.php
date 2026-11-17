<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
include '../config/koneksi.php';

$kategori = $koneksi->query("SELECT DISTINCT kategori FROM mobil WHERE kategori IS NOT NULL ORDER BY kategori");
$merek    = $koneksi->query("SELECT DISTINCT merek FROM mobil ORDER BY merek");

if (!$kategori || !$merek) {
    http_response_code(500);
    echo json_encode(['status' => false, 'pesan' => 'Gagal mengambil pilihan filter katalog.']);
    exit;
}

echo json_encode([
    'status'   => true,
    'kategori' => array_column($kategori->fetch_all(MYSQLI_ASSOC), 'kategori'),
    'merek'    => array_column($merek->fetch_all(MYSQLI_ASSOC), 'merek')
]);
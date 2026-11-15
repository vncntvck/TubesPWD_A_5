<?php
// baca file .env manual
$env = [];
$file = __DIR__ . '/../.env';

if (!file_exists($file)) {
    die(json_encode(['status' => false, 'pesan' => 'File .env tidak ditemukan']));
}

foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $baris) {
    $baris = trim($baris);
    if ($baris == '' || $baris[0] == '#' || strpos($baris, '=') === false) continue;
    list($kunci, $nilai) = explode('=', $baris, 2);
    $env[trim($kunci)] = trim($nilai, " \t\"'");
}

mysqli_report(MYSQLI_REPORT_OFF);
$koneksi = new mysqli(
    $env['DB_HOST'] ?? 'localhost',
    $env['DB_USER'] ?? 'root',
    $env['DB_PASS'] ?? '',
    $env['DB_NAME'] ?? 'cariez'
);

if ($koneksi->connect_error) {
    die(json_encode(['status' => false, 'pesan' => 'Koneksi gagal: ' . $koneksi->connect_error]));
}
<?php
header('Content-Type: application/json; charset=utf-8');

$env = [];
$file = __DIR__ . '/../.env';

if (!file_exists($file)) {
    http_response_code(500);
    die(json_encode([
        'status' => false,
        'pesan' => 'File backend/.env tidak ditemukan.'
    ], JSON_UNESCAPED_SLASHES));
}

foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $baris) {
    $baris = trim($baris);
    if ($baris === '' || $baris[0] === '#' || strpos($baris, '=') === false) {
        continue;
    }

    [$kunci, $nilai] = explode('=', $baris, 2);
    $env[trim($kunci)] = trim($nilai, " \t\"'");
}

mysqli_report(MYSQLI_REPORT_OFF);
$koneksi = new mysqli(
    $env['DB_HOST'] ?? '127.0.0.1',
    $env['DB_USERNAME'] ?? $env['DB_USER'] ?? 'root',
    $env['DB_PASSWORD'] ?? $env['DB_PASS'] ?? '',
    $env['DB_DATABASE'] ?? $env['DB_NAME'] ?? 'cariez',
    (int) ($env['DB_PORT'] ?? 3306)
);

if ($koneksi->connect_error) {
    http_response_code(500);
    die(json_encode([
        'status' => false,
        'pesan' => 'Koneksi database gagal.'
    ], JSON_UNESCAPED_SLASHES));
}
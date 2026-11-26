<?php
session_start();
require_once __DIR__ . '/../config/koneksi.php';

$idPengguna = (int) ($_SESSION['id_pengguna'] ?? 0);
if ($idPengguna <= 0) {
    http_response_code(401);
    exit('Silakan login terlebih dahulu.');
}

$jenis = $_GET['jenis'] ?? '';
$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0 || !in_array($jenis, ['dokumen', 'bukti'], true)) {
    http_response_code(400);
    exit('Jenis atau ID berkas tidak valid.');
}

if ($jenis === 'dokumen') {
    $query = $koneksi->prepare('SELECT file_dokumen AS file_path FROM dokumen_kendaraan WHERE id_dokumen = ?');
    $folder = 'dokumen';
} else {
    $query = $koneksi->prepare(
        'SELECT b.file_bukti AS file_path, t.id_pengguna
         FROM bukti_pembayaran b
         JOIN pembayaran p ON p.id_pembayaran = b.id_pembayaran
         JOIN transaksi t ON t.id_transaksi = p.id_transaksi
         WHERE b.id_bukti = ?'
    );
    $folder = 'bukti';
}

if (!$query) {
    http_response_code(500);
    exit('Berkas gagal diambil.');
}
$query->bind_param('i', $id);
if (!$query->execute()) {
    http_response_code(500);
    exit('Berkas gagal diambil.');
}
$record = $query->get_result()->fetch_assoc();
if (!$record) {
    http_response_code(404);
    exit('Berkas tidak ditemukan.');
}
if (
    $jenis === 'bukti' &&
    ($_SESSION['role'] ?? '') !== 'admin' &&
    (int) $record['id_pengguna'] !== $idPengguna
) {
    http_response_code(403);
    exit('Akses ditolak.');
}

$relativePath = $record['file_path'] ?? '';
$pattern = '#^private/' . preg_quote($folder, '#') . '/[a-f0-9]{32}\.(jpg|png|pdf)$#';
if (!preg_match($pattern, $relativePath)) {
    http_response_code(404);
    exit('Berkas tidak ditemukan.');
}

$directory = realpath(__DIR__ . '/../private/' . $folder);
$filePath = realpath(__DIR__ . '/../' . $relativePath);
if (
    $directory === false ||
    $filePath === false ||
    strpos($filePath, $directory . DIRECTORY_SEPARATOR) !== 0 ||
    !is_file($filePath)
) {
    http_response_code(404);
    exit('Berkas tidak ditemukan.');
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($filePath);
if (!in_array($mime, ['application/pdf', 'image/jpeg', 'image/png'], true)) {
    http_response_code(415);
    exit('Format berkas tidak didukung.');
}

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($filePath));
header('Content-Disposition: inline; filename="' . ucfirst($jenis) . '-' . $id . '"');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
readfile($filePath);
?>

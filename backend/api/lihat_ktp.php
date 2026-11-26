<?php
session_start();
require_once __DIR__ . '/../config/koneksi.php';

if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    exit('Akses ditolak.');
}

$idPembeli = (int) ($_GET['id_pembeli'] ?? 0);
if ($idPembeli <= 0) {
    http_response_code(400);
    exit('ID pembeli tidak valid.');
}

$query = $koneksi->prepare('SELECT foto_ktp FROM pembeli WHERE id_pembeli = ?');
if (!$query) {
    http_response_code(500);
    exit('Data KTP gagal diambil.');
}
$query->bind_param('i', $idPembeli);
if (!$query->execute()) {
    http_response_code(500);
    exit('Data KTP gagal diambil.');
}
$hasil = $query->get_result()->fetch_assoc();
$relativePath = $hasil['foto_ktp'] ?? '';

if (!preg_match('#^private/ktp/[a-f0-9]{32}\.(jpg|png)$#', $relativePath)) {
    http_response_code(404);
    exit('File KTP tidak ditemukan.');
}

$privateDirectory = realpath(__DIR__ . '/../private/ktp');
$filePath = realpath(__DIR__ . '/../' . $relativePath);
if (
    $privateDirectory === false ||
    $filePath === false ||
    strpos($filePath, $privateDirectory . DIRECTORY_SEPARATOR) !== 0 ||
    !is_file($filePath)
) {
    http_response_code(404);
    exit('File KTP tidak ditemukan.');
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($filePath);
if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
    http_response_code(415);
    exit('Format file KTP tidak didukung.');
}

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($filePath));
header('Content-Disposition: inline; filename="KTP-' . $idPembeli . '"');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
readfile($filePath);
?>

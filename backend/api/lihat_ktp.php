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

$query = $koneksi->prepare(
    'SELECT foto_ktp_data, foto_ktp_mime
     FROM pembeli
     WHERE id_pembeli = ?'
);
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

if (!$hasil) {
    http_response_code(404);
    exit('File KTP tidak ditemukan.');
}

$fileData = $hasil['foto_ktp_data'];
if ($fileData !== null && $fileData !== '') {
    $mime = $hasil['foto_ktp_mime'];
    if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
        http_response_code(415);
        exit('Format file KTP tidak didukung.');
    }

    header('Content-Type: ' . $mime);
    header('Content-Length: ' . strlen($fileData));
    header('Content-Disposition: inline; filename="KTP-' . $idPembeli . '"');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    echo $fileData;
    exit;
}

http_response_code(404);
exit('File KTP tidak ditemukan.');
?>

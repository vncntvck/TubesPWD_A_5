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
    $query = $koneksi->prepare(
        'SELECT file_dokumen_data AS file_data, file_dokumen_mime AS mime_type
         FROM dokumen_kendaraan
         WHERE id_dokumen = ?'
    );
} else {
    $query = $koneksi->prepare(
        'SELECT b.file_bukti_data AS file_data, b.file_bukti_mime AS mime_type,
                t.id_pengguna
         FROM bukti_pembayaran b
         JOIN pembayaran p ON p.id_pembayaran = b.id_pembayaran
         JOIN transaksi t ON t.id_transaksi = p.id_transaksi
         WHERE b.id_bukti = ?'
    );
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

$fileData = $record['file_data'];
if ($fileData !== null && $fileData !== '') {
    $mime = $record['mime_type'];
    if (!in_array($mime, ['application/pdf', 'image/jpeg', 'image/png'], true)) {
        http_response_code(415);
        exit('Format berkas tidak didukung.');
    }

    header('Content-Type: ' . $mime);
    header('Content-Length: ' . strlen($fileData));
    header('Content-Disposition: inline; filename="' . ucfirst($jenis) . '-' . $id . '"');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    echo $fileData;
    exit;
}

http_response_code(404);
exit('Berkas tidak ditemukan.');
?>

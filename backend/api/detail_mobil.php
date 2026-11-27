<?php
header('Content-Type: application/json; charset=utf-8');
include '../config/koneksi.php';

function gagal($pesan, $kode = 500)
{
    http_response_code($kode);
    echo json_encode(['status' => false, 'pesan' => $pesan]);
    exit;
}

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id <= 0) {
    gagal('ID mobil tidak valid.', 400);
}

$sql = "SELECT id_mobil, merek, model, varian, tahun_produksi, warna, jenis_transmisi,
               harga, harga_kredit, kondisi, kategori, kilometer, foto_utama, status,
               deskripsi, kapasitas_mesin, tenaga, torsi, kapasitas_penumpang
        FROM mobil
        WHERE id_mobil = ? AND status = 'Tersedia'";

$stmt = $koneksi->prepare($sql);
if (!$stmt) {
    gagal('Gagal menyiapkan query detail mobil.');
}

$stmt->bind_param('i', $id);
if (!$stmt->execute()) {
    gagal('Gagal mengambil data detail mobil.');
}

$hasil = $stmt->get_result();
if (!$hasil) {
    gagal('Gagal membaca data detail mobil.');
}

$mobil = $hasil->fetch_assoc();

if (!$mobil) {
    gagal('Mobil tidak ditemukan.', 404);
}

if (isset($mobil['foto_utama']) && $mobil['foto_utama'] !== null) {
    $mobil['foto_utama'] = str_replace('\\', '/', $mobil['foto_utama']);
}

echo json_encode([
    'status' => true,
    'data'   => $mobil
]);
?>
<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/koneksi.php';
require_once __DIR__ . '/../config/mobil_foto.php';

function gagal($pesan, $kode = 500)
{
    http_response_code($kode);
    echo json_encode(['status' => false, 'pesan' => $pesan]);
    exit;
}

$idParam = $_GET['id'] ?? '';
$id = is_scalar($idParam) && ctype_digit((string) $idParam) ? (int) $idParam : 0;

if ($id <= 0) {
    gagal('ID mobil tidak valid.', 400);
}

$sql = "SELECT id_mobil, merek, model, varian, tahun_produksi, warna, jenis_transmisi,
               harga, harga_kredit, kondisi, kategori, kilometer, foto_utama, status,
               deskripsi, kapasitas_cc AS kapasitas_mesin, tenaga_hp AS tenaga,
               torsi_nm AS torsi, kapasitas_kursi AS kapasitas_penumpang
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

$mobil['foto_utama'] = cariezFotoMobil($mobil);

echo json_encode([
    'status' => true,
    'data'   => $mobil
]);
?>
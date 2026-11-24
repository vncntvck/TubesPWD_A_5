<?php
header('Content-Type: application/json; charset=utf-8');
include '../config/koneksi.php';

function gagal($pesan, $kode = 500)
{
    http_response_code($kode);
    echo json_encode(['status' => false, 'pesan' => $pesan]);
    exit;
}

$sql = "SELECT id_mobil, merek, model, varian, tahun_produksi, warna, jenis_transmisi,
               harga, harga_kredit, kondisi, kategori, kilometer, foto_utama, status
        FROM mobil
        WHERE status = ?";
$tipe = 's';
$nilai = ['Tersedia'];

$filterKolom = [
    'kondisi' => 'kondisi',
    'merek' => 'merek',
    'model' => 'model',
    'tahun' => 'tahun_produksi',
    'warna' => 'warna',
    'kategori' => 'kategori',
    'transmisi' => 'jenis_transmisi'
];

foreach ($filterKolom as $parameter => $kolom) {
    $nilaiFilter = isset($_GET[$parameter]) ? trim((string) $_GET[$parameter]) : '';
    if ($nilaiFilter === '') {
        continue;
    }

    if ($parameter === 'tahun') {
        if (!ctype_digit($nilaiFilter)) {
            gagal('Filter tahun harus berupa angka.', 400);
        }
        $nilaiFilter = (int) $nilaiFilter;
        $tipe .= 'i';
    } else {
        $tipe .= 's';
    }

    $sql .= " AND $kolom = ?";
    $nilai[] = $nilaiFilter;
}

$cari = isset($_GET['cari']) ? trim((string) $_GET['cari']) : '';
if ($cari !== '') {
    $sql .= " AND (merek LIKE ? OR model LIKE ? OR varian LIKE ?)";
    $tipe .= 'sss';
    $kataKunci = '%' . $cari . '%';
    $nilai[] = $kataKunci;
    $nilai[] = $kataKunci;
    $nilai[] = $kataKunci;
}

$hargaMin = isset($_GET['harga_min']) ? trim((string) $_GET['harga_min']) : '';
$hargaMax = isset($_GET['harga_max']) ? trim((string) $_GET['harga_max']) : '';

foreach (['harga_min' => $hargaMin, 'harga_max' => $hargaMax] as $parameter => $harga) {
    if ($harga !== '' && !is_numeric($harga)) {
        gagal('Filter harga harus berupa angka.', 400);
    }
}

if ($hargaMin !== '' && $hargaMax !== '') {
    $sql .= ' AND harga BETWEEN ? AND ?';
    $tipe .= 'dd';
    $nilai[] = (float) $hargaMin;
    $nilai[] = (float) $hargaMax;
} elseif ($hargaMin !== '') {
    $sql .= ' AND harga >= ?';
    $tipe .= 'd';
    $nilai[] = (float) $hargaMin;
} elseif ($hargaMax !== '') {
    $sql .= ' AND harga <= ?';
    $tipe .= 'd';
    $nilai[] = (float) $hargaMax;
}

$sql .= ' ORDER BY harga DESC';
$stmt = $koneksi->prepare($sql);
if (!$stmt) {
    gagal('Gagal menyiapkan query katalog.');
}

$stmt->bind_param($tipe, ...$nilai);
if (!$stmt->execute()) {
    gagal('Gagal mengambil data katalog.');
}

$hasil = $stmt->get_result();
if (!$hasil) {
    gagal('Gagal membaca data katalog.');
}

$data = [];
while ($baris = $hasil->fetch_assoc()) {
    if (isset($baris['foto_utama']) && $baris['foto_utama'] !== null) {
        $baris['foto_utama'] = str_replace('\\', '/', $baris['foto_utama']);
    }
    $data[] = $baris;
}

echo json_encode([
    'status' => true,
    'jumlah' => count($data),
    'data' => $data
]);
?>
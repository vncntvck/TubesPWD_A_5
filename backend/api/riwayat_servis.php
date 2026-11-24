<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/koneksi.php';

function kirimRespons($status, $pesan, $data = null, $kodeHttp = 200)
{
    http_response_code($kodeHttp);

    $respons = [
        'status' => $status,
        'pesan' => $pesan
    ];

    if ($data !== null) {
        $respons['data'] = $data;
    }

    echo json_encode($respons, JSON_UNESCAPED_UNICODE);
    exit;
}

function ambilInputJson()
{
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        return [];
    }

    return $input;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $id = (int) $_GET['id'];
        if ($id <= 0) {
            kirimRespons(false, 'ID riwayat servis tidak valid.', null, 400);
        }

        $query = $koneksi->prepare(
            'SELECT * FROM riwayat_servis WHERE id_riwayat_servis = ?'
        );

        if (!$query) {
            kirimRespons(false, 'Query riwayat servis gagal disiapkan.', null, 500);
        }

        $query->bind_param('i', $id);
    } else {
        $query = $koneksi->prepare(
            'SELECT * FROM riwayat_servis ORDER BY id_riwayat_servis DESC'
        );

        if (!$query) {
            kirimRespons(false, 'Query riwayat servis gagal disiapkan.', null, 500);
        }
    }

    if (!$query->execute()) {
        kirimRespons(false, 'Data riwayat servis gagal diambil.', null, 500);
    }

    $hasil = $query->get_result();
    if (!$hasil) {
        kirimRespons(false, 'Data riwayat servis gagal dibaca.', null, 500);
    }

    $dataServis = [];
    while ($baris = $hasil->fetch_assoc()) {
        $dataServis[] = $baris;
    }

    kirimRespons(true, 'Data riwayat servis berhasil diambil.', $dataServis);
}

if ($method === 'POST') {
    $data = ambilInputJson();

    $idMobil = (int) ($data['id_mobil'] ?? 0);
    $tanggal = trim($data['tanggal_servis'] ?? '');
    $deskripsi = trim($data['deskripsi_servis'] ?? '');
    $biaya = $data['biaya_servis'] ?? 0;
    $namaBengkel = trim($data['nama_bengkel'] ?? '');

    if ($idMobil <= 0 || $tanggal === '' || $deskripsi === '') {
        kirimRespons(
            false,
            'id_mobil, tanggal_servis, dan deskripsi_servis wajib diisi.',
            null,
            400
        );
    }

    if (!is_numeric($biaya) || $biaya < 0) {
        kirimRespons(false, 'Biaya servis harus berupa angka positif.', null, 400);
    }

    $biaya = (float) $biaya;
    $query = $koneksi->prepare(
        'INSERT INTO riwayat_servis
            (id_mobil, tanggal_servis, deskripsi_servis, biaya_servis, nama_bengkel)
         VALUES (?, ?, ?, ?, ?)'
    );

    if (!$query) {
        kirimRespons(false, 'Query riwayat servis gagal disiapkan.', null, 500);
    }

    $query->bind_param(
        'issds',
        $idMobil,
        $tanggal,
        $deskripsi,
        $biaya,
        $namaBengkel
    );

    if (!$query->execute()) {
        kirimRespons(false, 'Riwayat servis gagal ditambahkan.', null, 500);
    }

    kirimRespons(
        true,
        'Riwayat servis berhasil ditambahkan.',
        ['id_riwayat_servis' => $koneksi->insert_id]
    );
}

if ($method === 'PUT') {
    $data = ambilInputJson();
    $id = (int) ($data['id_riwayat_servis'] ?? 0);

    if ($id <= 0) {
        kirimRespons(false, 'ID riwayat servis wajib diisi.', null, 400);
    }

    $kolomYangBisaDiubah = [
        'tanggal_servis',
        'deskripsi_servis',
        'biaya_servis',
        'nama_bengkel'
    ];

    $adaPerubahan = false;
    foreach ($kolomYangBisaDiubah as $kolom) {
        if (array_key_exists($kolom, $data)) {
            $adaPerubahan = true;
            break;
        }
    }

    if (!$adaPerubahan) {
        kirimRespons(false, 'Tidak ada data yang diubah.', null, 400);
    }

    $queryCek = $koneksi->prepare(
        'SELECT tanggal_servis, deskripsi_servis, biaya_servis, nama_bengkel
         FROM riwayat_servis
         WHERE id_riwayat_servis = ?'
    );

    if (!$queryCek) {
        kirimRespons(false, 'Query riwayat servis gagal disiapkan.', null, 500);
    }

    $queryCek->bind_param('i', $id);
    if (!$queryCek->execute()) {
        kirimRespons(false, 'Data riwayat servis gagal diperiksa.', null, 500);
    }

    $hasilCek = $queryCek->get_result();
    $dataLama = $hasilCek ? $hasilCek->fetch_assoc() : null;

    if (!$dataLama) {
        kirimRespons(false, 'Riwayat servis tidak ditemukan.', null, 404);
    }

    $tanggal = $data['tanggal_servis'] ?? $dataLama['tanggal_servis'];
    $deskripsi = $data['deskripsi_servis'] ?? $dataLama['deskripsi_servis'];
    $biaya = $data['biaya_servis'] ?? $dataLama['biaya_servis'];
    $namaBengkel = $data['nama_bengkel'] ?? $dataLama['nama_bengkel'];

    if (trim($tanggal) === '' || trim($deskripsi) === '') {
        kirimRespons(false, 'Tanggal dan deskripsi servis wajib diisi.', null, 400);
    }

    if (!is_numeric($biaya) || $biaya < 0) {
        kirimRespons(false, 'Biaya servis harus berupa angka positif.', null, 400);
    }

    $tanggal = trim($tanggal);
    $deskripsi = trim($deskripsi);
    $biaya = (float) $biaya;
    $namaBengkel = trim($namaBengkel);

    $query = $koneksi->prepare(
        'UPDATE riwayat_servis
         SET tanggal_servis = ?, deskripsi_servis = ?, biaya_servis = ?, nama_bengkel = ?
         WHERE id_riwayat_servis = ?'
    );

    if (!$query) {
        kirimRespons(false, 'Query riwayat servis gagal disiapkan.', null, 500);
    }

    $query->bind_param(
        'ssdsi',
        $tanggal,
        $deskripsi,
        $biaya,
        $namaBengkel,
        $id
    );

    if (!$query->execute()) {
        kirimRespons(false, 'Riwayat servis gagal diperbarui.', null, 500);
    }

    kirimRespons(true, 'Riwayat servis berhasil diperbarui.');
}

if ($method === 'DELETE') {
    $id = (int) ($_GET['id_riwayat_servis'] ?? 0);

    if ($id <= 0) {
        $data = ambilInputJson();
        $id = (int) ($data['id_riwayat_servis'] ?? 0);
    }

    if ($id <= 0) {
        kirimRespons(false, 'ID riwayat servis wajib diisi.', null, 400);
    }

    $query = $koneksi->prepare(
        'DELETE FROM riwayat_servis WHERE id_riwayat_servis = ?'
    );

    if (!$query) {
        kirimRespons(false, 'Query riwayat servis gagal disiapkan.', null, 500);
    }

    $query->bind_param('i', $id);
    if (!$query->execute()) {
        kirimRespons(false, 'Riwayat servis gagal dihapus.', null, 500);
    }
    if ($query->affected_rows === 0) {
        kirimRespons(false, 'Riwayat servis tidak ditemukan.', null, 404);
    }
    kirimRespons(true, 'Riwayat servis berhasil dihapus.');
}
kirimRespons(false, 'Metode request tidak diizinkan.', null, 405);
?>
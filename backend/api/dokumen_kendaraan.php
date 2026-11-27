<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/koneksi.php';

function responsDokumen($status, $pesan, $data = null, $kodeHttp = 200)
{
    http_response_code($kodeHttp);
    $respons = ['status' => $status, 'pesan' => $pesan];
    if ($data !== null) {
        $respons['data'] = $data;
    }
    echo json_encode($respons, JSON_UNESCAPED_UNICODE);
    exit;
}

function inputDokumen()
{
    if (($_SERVER['CONTENT_TYPE'] ?? '') !== '' &&
        stripos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') === 0) {
        return $_POST;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

function nilaiStringDokumen($input, $field, $default = null)
{
    if (!array_key_exists($field, $input)) {
        return $default;
    }
    if ($input[$field] === null || $input[$field] === '') {
        return null;
    }
    if (!is_string($input[$field])) {
        responsDokumen(false, 'Nilai ' . $field . ' tidak valid.', null, 400);
    }
    return trim($input[$field]);
}

function tanggalDokumen($value, $field)
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_string($value)) {
        responsDokumen(false, 'Tanggal ' . $field . ' tidak valid.', null, 400);
    }
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    if (!$date || $date->format('Y-m-d') !== $value) {
        responsDokumen(false, 'Tanggal ' . $field . ' harus berformat YYYY-MM-DD.', null, 400);
    }
    return $value;
}

function urlDokumen($baris)
{
    $baris['url_file'] = !empty($baris['has_file'])
        ? 'lihat_berkas.php?jenis=dokumen&id=' . (int) $baris['id_dokumen']
        : null;
    unset($baris['has_file']);
    return $baris;
}

$idPengguna = (int) ($_SESSION['id_pengguna'] ?? 0);
if ($idPengguna <= 0) {
    responsDokumen(false, 'Silakan login terlebih dahulu.', null, 401);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $idMobil = (int) ($_GET['id_mobil'] ?? 0);
    if ($idMobil <= 0) {
        responsDokumen(false, 'ID mobil tidak valid.', null, 400);
    }

    $query = $koneksi->prepare(
        'SELECT id_dokumen, id_mobil, jenis_dokumen, nomor_dokumen, tanggal_terbit,
                masa_berlaku, keterangan, status_valid,
                (file_dokumen_data IS NOT NULL) AS has_file
         FROM dokumen_kendaraan
         WHERE id_mobil = ?
         ORDER BY masa_berlaku DESC, id_dokumen DESC'
    );
    if (!$query) {
        responsDokumen(false, 'Query dokumen gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idMobil);
    if (!$query->execute()) {
        responsDokumen(false, 'Dokumen kendaraan gagal diambil.', null, 500);
    }

    $data = [];
    $hasil = $query->get_result();
    while ($baris = $hasil->fetch_assoc()) {
        $data[] = urlDokumen($baris);
    }
    responsDokumen(true, 'Dokumen kendaraan berhasil diambil.', $data);
}

if (($_SESSION['role'] ?? '') !== 'admin') {
    responsDokumen(false, 'Akses khusus admin.', null, 403);
}

if ($method === 'POST') {
    $input = inputDokumen();
    $idMobil = (int) ($input['id_mobil'] ?? 0);
    $jenis = nilaiStringDokumen($input, 'jenis_dokumen', '');
    $nomor = nilaiStringDokumen($input, 'nomor_dokumen');
    $tanggalTerbit = tanggalDokumen(nilaiStringDokumen($input, 'tanggal_terbit'), 'terbit');
    $masaBerlaku = tanggalDokumen(nilaiStringDokumen($input, 'masa_berlaku'), 'berlaku');
    $keterangan = nilaiStringDokumen($input, 'keterangan');
    $statusValid = nilaiStringDokumen($input, 'status_valid', 'Belum Dicek');
    $jenisDiizinkan = ['BPKB', 'STNK', 'Faktur', 'Pajak', 'Lainnya'];
    $statusDiizinkan = ['Valid', 'Tidak Valid', 'Belum Dicek'];

    if ($idMobil <= 0 || !in_array($jenis, $jenisDiizinkan, true)) {
        responsDokumen(false, 'ID mobil atau jenis dokumen tidak valid.', null, 400);
    }
    if (!in_array($statusValid, $statusDiizinkan, true)) {
        responsDokumen(false, 'Status dokumen tidak valid.', null, 400);
    }
    if ($nomor !== null && strlen($nomor) > 60) {
        responsDokumen(false, 'Nomor dokumen maksimal 60 karakter.', null, 400);
    }

    $fileData = null;
    $mime = null;
    $file = $_FILES['file_dokumen'] ?? null;
    if ($file !== null) {
        if (!is_array($file) || !isset($file['error'])) {
            responsDokumen(false, 'Data file tidak valid.', null, 400);
        }
        if ($file['error'] !== UPLOAD_ERR_NO_FILE) {
            if (
                !isset($file['tmp_name'], $file['size']) ||
                !is_string($file['tmp_name']) ||
                !is_int($file['size']) ||
                $file['error'] !== UPLOAD_ERR_OK ||
                !is_uploaded_file($file['tmp_name'])
            ) {
                responsDokumen(false, 'File gagal diunggah.', null, 400);
            }
            if ($file['size'] <= 0 || $file['size'] > 10 * 1024 * 1024) {
                responsDokumen(false, 'Ukuran file maksimal 10 MB.', null, 400);
            }

            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
            if (!in_array($mime, ['application/pdf', 'image/jpeg', 'image/png'], true)) {
                responsDokumen(false, 'File harus berformat PDF, JPG, atau PNG.', null, 400);
            }
            $fileData = file_get_contents($file['tmp_name']);
            if (!is_string($fileData) || strlen($fileData) !== $file['size']) {
                responsDokumen(false, 'Isi file gagal dibaca.', null, 500);
            }
        }
    }

    $query = $koneksi->prepare(
        'INSERT INTO dokumen_kendaraan
            (id_mobil, jenis_dokumen, nomor_dokumen, tanggal_terbit, masa_berlaku,
             file_dokumen_data, file_dokumen_mime, keterangan, status_valid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    if (!$query) {
        responsDokumen(false, 'Query dokumen gagal disiapkan.', null, 500);
    }
    $query->bind_param(
        'issssbsss',
        $idMobil,
        $jenis,
        $nomor,
        $tanggalTerbit,
        $masaBerlaku,
        $fileData,
        $mime,
        $keterangan,
        $statusValid
    );
    if (($fileData !== null && !$query->send_long_data(5, $fileData)) || !$query->execute()) {
        responsDokumen(false, 'Dokumen kendaraan gagal disimpan.', null, 500);
    }

    $idDokumen = $koneksi->insert_id;
    responsDokumen(true, 'Dokumen kendaraan berhasil ditambahkan.', [
        'id_dokumen' => $idDokumen,
        'url_file' => $fileData !== null ? 'lihat_berkas.php?jenis=dokumen&id=' . $idDokumen : null
    ], 201);
}

if ($method === 'PUT') {
    $input = inputDokumen();
    $idDokumen = (int) ($input['id_dokumen'] ?? 0);
    if ($idDokumen <= 0) {
        responsDokumen(false, 'ID dokumen tidak valid.', null, 400);
    }

    $query = $koneksi->prepare(
        'SELECT jenis_dokumen, nomor_dokumen, tanggal_terbit, masa_berlaku, keterangan, status_valid
         FROM dokumen_kendaraan
         WHERE id_dokumen = ?'
    );
    if (!$query) {
        responsDokumen(false, 'Query dokumen gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idDokumen);
    if (!$query->execute()) {
        responsDokumen(false, 'Dokumen kendaraan gagal diambil.', null, 500);
    }
    $existing = $query->get_result()->fetch_assoc();
    if (!$existing) {
        responsDokumen(false, 'Dokumen kendaraan tidak ditemukan.', null, 404);
    }

    $jenis = nilaiStringDokumen($input, 'jenis_dokumen', $existing['jenis_dokumen']);
    $nomor = nilaiStringDokumen($input, 'nomor_dokumen', $existing['nomor_dokumen']);
    $tanggalTerbit = tanggalDokumen(
        array_key_exists('tanggal_terbit', $input)
            ? nilaiStringDokumen($input, 'tanggal_terbit')
            : $existing['tanggal_terbit'],
        'terbit'
    );
    $masaBerlaku = tanggalDokumen(
        array_key_exists('masa_berlaku', $input)
            ? nilaiStringDokumen($input, 'masa_berlaku')
            : $existing['masa_berlaku'],
        'berlaku'
    );
    $keterangan = nilaiStringDokumen($input, 'keterangan', $existing['keterangan']);
    $statusValid = nilaiStringDokumen($input, 'status_valid', $existing['status_valid']);

    if (
        !in_array($jenis, ['BPKB', 'STNK', 'Faktur', 'Pajak', 'Lainnya'], true) ||
        !in_array($statusValid, ['Valid', 'Tidak Valid', 'Belum Dicek'], true) ||
        ($nomor !== null && strlen($nomor) > 60)
    ) {
        responsDokumen(false, 'Data dokumen tidak valid.', null, 400);
    }

    $update = $koneksi->prepare(
        'UPDATE dokumen_kendaraan
         SET jenis_dokumen = ?, nomor_dokumen = ?, tanggal_terbit = ?, masa_berlaku = ?,
             keterangan = ?, status_valid = ?
         WHERE id_dokumen = ?'
    );
    if (!$update) {
        responsDokumen(false, 'Query pembaruan dokumen gagal disiapkan.', null, 500);
    }
    $update->bind_param(
        'ssssssi',
        $jenis,
        $nomor,
        $tanggalTerbit,
        $masaBerlaku,
        $keterangan,
        $statusValid,
        $idDokumen
    );
    if (!$update->execute()) {
        responsDokumen(false, 'Dokumen kendaraan gagal diperbarui.', null, 500);
    }
    responsDokumen(true, 'Dokumen kendaraan berhasil diperbarui.');
}

if ($method === 'DELETE') {
    $input = inputDokumen();
    $idDokumen = (int) ($input['id_dokumen'] ?? $_GET['id_dokumen'] ?? 0);
    if ($idDokumen <= 0) {
        responsDokumen(false, 'ID dokumen tidak valid.', null, 400);
    }

    $query = $koneksi->prepare('SELECT id_dokumen FROM dokumen_kendaraan WHERE id_dokumen = ?');
    if (!$query) {
        responsDokumen(false, 'Query dokumen gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idDokumen);
    if (!$query->execute()) {
        responsDokumen(false, 'Dokumen kendaraan gagal diambil.', null, 500);
    }
    $existing = $query->get_result()->fetch_assoc();
    if (!$existing) {
        responsDokumen(false, 'Dokumen kendaraan tidak ditemukan.', null, 404);
    }

    $delete = $koneksi->prepare('DELETE FROM dokumen_kendaraan WHERE id_dokumen = ?');
    if (!$delete) {
        responsDokumen(false, 'Query penghapusan dokumen gagal disiapkan.', null, 500);
    }
    $delete->bind_param('i', $idDokumen);
    if (!$delete->execute()) {
        responsDokumen(false, 'Dokumen kendaraan gagal dihapus.', null, 500);
    }
    responsDokumen(true, 'Dokumen kendaraan berhasil dihapus.');
}

responsDokumen(false, 'Method tidak didukung.', null, 405);
?>

<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/koneksi.php';

function responsDetailPemeriksaan($status, $pesan, $data = null, $kodeHttp = 200)
{
    http_response_code($kodeHttp);
    $respons = ['status' => $status, 'pesan' => $pesan];
    if ($data !== null) {
        $respons['data'] = $data;
    }
    echo json_encode($respons, JSON_UNESCAPED_UNICODE);
    exit;
}

function inputDetailPemeriksaan()
{
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

if ((int) ($_SESSION['id_pengguna'] ?? 0) <= 0) {
    responsDetailPemeriksaan(false, 'Silakan login terlebih dahulu.', null, 401);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $idPemeriksaan = (int) ($_GET['id_pemeriksaan'] ?? 0);
    if ($idPemeriksaan <= 0) {
        responsDetailPemeriksaan(false, 'ID pemeriksaan tidak valid.', null, 400);
    }

    $query = $koneksi->prepare(
        'SELECT id_detail, id_pemeriksaan, nama_komponen, kondisi, keterangan
         FROM detail_pemeriksaan
         WHERE id_pemeriksaan = ?
         ORDER BY id_detail'
    );
    if (!$query) {
        responsDetailPemeriksaan(false, 'Query detail pemeriksaan gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idPemeriksaan);
    if (!$query->execute()) {
        responsDetailPemeriksaan(false, 'Detail pemeriksaan gagal diambil.', null, 500);
    }

    $hasil = $query->get_result();
    $data = [];
    while ($baris = $hasil->fetch_assoc()) {
        $data[] = $baris;
    }
    responsDetailPemeriksaan(true, 'Detail pemeriksaan berhasil diambil.', $data);
}

if (($_SESSION['role'] ?? '') !== 'admin') {
    responsDetailPemeriksaan(false, 'Akses khusus admin.', null, 403);
}

if ($method === 'POST') {
    $input = inputDetailPemeriksaan();
    $idPemeriksaan = (int) ($input['id_pemeriksaan'] ?? 0);
    $namaKomponen = trim(is_string($input['nama_komponen'] ?? null) ? $input['nama_komponen'] : '');
    $kondisi = trim(is_string($input['kondisi'] ?? null) ? $input['kondisi'] : '');
    $keterangan = $input['keterangan'] ?? null;

    if ($idPemeriksaan <= 0 || $namaKomponen === '' || $kondisi === '') {
        responsDetailPemeriksaan(false, 'ID pemeriksaan, nama komponen, dan kondisi wajib diisi.', null, 400);
    }
    if ($keterangan !== null && !is_string($keterangan)) {
        responsDetailPemeriksaan(false, 'Keterangan tidak valid.', null, 400);
    }

    $parent = $koneksi->prepare('SELECT 1 FROM pemeriksaan_mobil WHERE id_pemeriksaan = ?');
    if (!$parent) {
        responsDetailPemeriksaan(false, 'Query pemeriksaan gagal disiapkan.', null, 500);
    }
    $parent->bind_param('i', $idPemeriksaan);
    if (!$parent->execute() || !$parent->get_result()->fetch_row()) {
        responsDetailPemeriksaan(false, 'Data pemeriksaan tidak ditemukan.', null, 404);
    }

    $query = $koneksi->prepare(
        'INSERT INTO detail_pemeriksaan (id_pemeriksaan, nama_komponen, kondisi, keterangan)
         VALUES (?, ?, ?, ?)'
    );
    if (!$query) {
        responsDetailPemeriksaan(false, 'Query detail pemeriksaan gagal disiapkan.', null, 500);
    }
    $query->bind_param('isss', $idPemeriksaan, $namaKomponen, $kondisi, $keterangan);
    if (!$query->execute()) {
        responsDetailPemeriksaan(false, 'Detail pemeriksaan gagal disimpan.', null, 500);
    }

    responsDetailPemeriksaan(true, 'Detail pemeriksaan berhasil ditambahkan.', [
        'id_detail' => $koneksi->insert_id
    ], 201);
}

if ($method === 'PUT') {
    $input = inputDetailPemeriksaan();
    $idDetail = (int) ($input['id_detail'] ?? 0);
    if ($idDetail <= 0) {
        responsDetailPemeriksaan(false, 'ID detail tidak valid.', null, 400);
    }

    $query = $koneksi->prepare(
        'SELECT nama_komponen, kondisi, keterangan
         FROM detail_pemeriksaan
         WHERE id_detail = ?'
    );
    if (!$query) {
        responsDetailPemeriksaan(false, 'Query detail pemeriksaan gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idDetail);
    if (!$query->execute()) {
        responsDetailPemeriksaan(false, 'Detail pemeriksaan gagal diambil.', null, 500);
    }
    $existing = $query->get_result()->fetch_assoc();
    if (!$existing) {
        responsDetailPemeriksaan(false, 'Detail pemeriksaan tidak ditemukan.', null, 404);
    }

    $namaKomponen = $existing['nama_komponen'];
    if (array_key_exists('nama_komponen', $input)) {
        if (!is_string($input['nama_komponen']) || trim($input['nama_komponen']) === '') {
            responsDetailPemeriksaan(false, 'Nama komponen tidak valid.', null, 400);
        }
        $namaKomponen = trim($input['nama_komponen']);
    }

    $kondisi = $existing['kondisi'];
    if (array_key_exists('kondisi', $input)) {
        if (!is_string($input['kondisi']) || trim($input['kondisi']) === '') {
            responsDetailPemeriksaan(false, 'Kondisi tidak valid.', null, 400);
        }
        $kondisi = trim($input['kondisi']);
    }

    $keterangan = $existing['keterangan'];
    if (array_key_exists('keterangan', $input)) {
        if ($input['keterangan'] !== null && !is_string($input['keterangan'])) {
            responsDetailPemeriksaan(false, 'Keterangan tidak valid.', null, 400);
        }
        $keterangan = $input['keterangan'];
    }

    $update = $koneksi->prepare(
        'UPDATE detail_pemeriksaan
         SET nama_komponen = ?, kondisi = ?, keterangan = ?
         WHERE id_detail = ?'
    );
    if (!$update) {
        responsDetailPemeriksaan(false, 'Query pembaruan gagal disiapkan.', null, 500);
    }
    $update->bind_param('sssi', $namaKomponen, $kondisi, $keterangan, $idDetail);
    if (!$update->execute()) {
        responsDetailPemeriksaan(false, 'Detail pemeriksaan gagal diperbarui.', null, 500);
    }
    responsDetailPemeriksaan(true, 'Detail pemeriksaan berhasil diperbarui.');
}

if ($method === 'DELETE') {
    $input = inputDetailPemeriksaan();
    $idDetail = (int) ($input['id_detail'] ?? $_GET['id_detail'] ?? 0);
    if ($idDetail <= 0) {
        responsDetailPemeriksaan(false, 'ID detail tidak valid.', null, 400);
    }

    $query = $koneksi->prepare('DELETE FROM detail_pemeriksaan WHERE id_detail = ?');
    if (!$query) {
        responsDetailPemeriksaan(false, 'Query penghapusan gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idDetail);
    if (!$query->execute()) {
        responsDetailPemeriksaan(false, 'Detail pemeriksaan gagal dihapus.', null, 500);
    }
    if ($query->affected_rows === 0) {
        responsDetailPemeriksaan(false, 'Detail pemeriksaan tidak ditemukan.', null, 404);
    }
    responsDetailPemeriksaan(true, 'Detail pemeriksaan berhasil dihapus.');
}

responsDetailPemeriksaan(false, 'Method tidak didukung.', null, 405);
?>

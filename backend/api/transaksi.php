<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once __DIR__ . '/../config/koneksi.php';

function kirimRespons($status, $pesan, $data = null, $kodeHttp = 200)
{
    http_response_code($kodeHttp);
    $respons = ['status' => $status, 'pesan' => $pesan];
    if ($data !== null) {
        $respons['data'] = $data;
    }
    echo json_encode($respons, JSON_UNESCAPED_UNICODE);
    exit;
}

function ambilInputJson()
{
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

$method = $_SERVER['REQUEST_METHOD'];

// GET — ambil semua atau satu transaksi
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $id = (int) $_GET['id'];
        if ($id <= 0) {
            kirimRespons(false, 'ID transaksi tidak valid.', null, 400);
        }
        $query = $koneksi->prepare(
            'SELECT t.*, m.merek, m.model, m.varian, m.foto_utama, p.username, p.email
             FROM transaksi t
             LEFT JOIN mobil m ON t.id_mobil = m.id_mobil
             LEFT JOIN pengguna p ON t.id_pengguna = p.id_pengguna
             WHERE t.id_transaksi = ?'
        );
        if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);
        $query->bind_param('i', $id);
    } elseif (isset($_GET['id_pengguna'])) {
        $idPengguna = (int) $_GET['id_pengguna'];
        $query = $koneksi->prepare(
            'SELECT t.*, m.merek, m.model, m.varian, m.foto_utama
             FROM transaksi t
             LEFT JOIN mobil m ON t.id_mobil = m.id_mobil
             WHERE t.id_pengguna = ?
             ORDER BY t.tanggal_transaksi DESC'
        );
        if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);
        $query->bind_param('i', $idPengguna);
    } else {
        // Semua transaksi (admin)
        $query = $koneksi->prepare(
            'SELECT t.*, m.merek, m.model, m.varian, m.foto_utama, p.username, p.email
             FROM transaksi t
             LEFT JOIN mobil m ON t.id_mobil = m.id_mobil
             LEFT JOIN pengguna p ON t.id_pengguna = p.id_pengguna
             ORDER BY t.tanggal_transaksi DESC'
        );
        if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);
    }

    if (!$query->execute()) kirimRespons(false, 'Data gagal diambil.', null, 500);
    $hasil = $query->get_result();
    if (!$hasil) kirimRespons(false, 'Data gagal dibaca.', null, 500);

    $data = [];
    while ($baris = $hasil->fetch_assoc()) {
        if (isset($baris['foto_utama'])) {
            $baris['foto_utama'] = str_replace('\\', '/', $baris['foto_utama']);
        }
        $data[] = $baris;
    }

    if (isset($_GET['id'])) {
        kirimRespons(true, 'Detail transaksi berhasil diambil.', $data[0] ?? null);
    }
    kirimRespons(true, 'Data transaksi berhasil diambil.', $data);
}

// POST — buat transaksi baru
if ($method === 'POST') {
    $data = ambilInputJson();

    $idPenggunaSesi = (int) ($_SESSION['id_pengguna'] ?? 0);
    $idPenggunaInput = (int) ($data['id_pengguna'] ?? 0);
    if ($idPenggunaSesi <= 0) {
        kirimRespons(false, 'Silakan login untuk membuat transaksi.', null, 401);
    }
    if ($idPenggunaInput !== $idPenggunaSesi) {
        kirimRespons(false, 'Data pengguna tidak sesuai dengan sesi login.', null, 403);
    }

    $idPengguna  = $idPenggunaSesi;
    $idMobil     = (int) ($data['id_mobil'] ?? 0);
    $metodeBayar = trim($data['metode_pembayaran'] ?? '');
    $totalHarga  = $data['total_harga'] ?? 0;
    $uangMuka    = $data['uang_muka'] ?? 0;
    $status      = trim($data['status'] ?? 'Menunggu');
    $catatanPemesan = $data['catatan_pemesan'] ?? null;

    if ($idPengguna <= 0 || $idMobil <= 0 || $metodeBayar === '') {
        kirimRespons(false, 'id_pengguna, id_mobil, dan metode_pembayaran wajib diisi.', null, 400);
    }

    if (!is_numeric($totalHarga) || $totalHarga < 0) {
        kirimRespons(false, 'Total harga tidak valid.', null, 400);
    }

    if (!is_numeric($uangMuka) || $uangMuka < 0) {
        kirimRespons(false, 'Uang muka tidak valid.', null, 400);
    }

    if (!in_array($status, ['Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'], true)) {
        kirimRespons(false, 'Status transaksi tidak valid.', null, 400);
    }

    if ($catatanPemesan !== null && !is_string($catatanPemesan)) {
        kirimRespons(false, 'Catatan pemesan tidak valid.', null, 400);
    }

    $query = $koneksi->prepare(
        'INSERT INTO transaksi (id_pengguna, id_mobil, metode_pembayaran, total_harga, uang_muka, status, catatan_pemesan, tanggal_transaksi)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
    );
    if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);

    $query->bind_param('iisddss', $idPengguna, $idMobil, $metodeBayar, $totalHarga, $uangMuka, $status, $catatanPemesan);
    if (!$query->execute()) kirimRespons(false, 'Transaksi gagal disimpan.', null, 500);

    kirimRespons(true, 'Transaksi berhasil dibuat.', ['id_transaksi' => $koneksi->insert_id], 201);
}

// PUT — update status transaksi
if ($method === 'PUT') {
    $data = ambilInputJson();
    $id   = (int) ($data['id_transaksi'] ?? 0);
    if ($id <= 0) kirimRespons(false, 'ID transaksi wajib diisi.', null, 400);

    $status = trim($data['status'] ?? '');
    if ($status === '') kirimRespons(false, 'Status wajib diisi.', null, 400);

    $allowed = ['Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'];
    if (!in_array($status, $allowed)) {
        kirimRespons(false, 'Status tidak valid.', null, 400);
    }

    $query = $koneksi->prepare('UPDATE transaksi SET status = ? WHERE id_transaksi = ?');
    if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);
    $query->bind_param('si', $status, $id);
    if (!$query->execute()) kirimRespons(false, 'Transaksi gagal diperbarui.', null, 500);
    if ($query->affected_rows === 0) kirimRespons(false, 'Transaksi tidak ditemukan.', null, 404);

    kirimRespons(true, 'Status transaksi berhasil diperbarui.');
}

// DELETE
if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        $data = ambilInputJson();
        $id   = (int) ($data['id_transaksi'] ?? 0);
    }
    if ($id <= 0) kirimRespons(false, 'ID transaksi wajib diisi.', null, 400);

    $query = $koneksi->prepare('DELETE FROM transaksi WHERE id_transaksi = ?');
    if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);
    $query->bind_param('i', $id);
    if (!$query->execute()) kirimRespons(false, 'Transaksi gagal dihapus.', null, 500);
    if ($query->affected_rows === 0) kirimRespons(false, 'Transaksi tidak ditemukan.', null, 404);

    kirimRespons(true, 'Transaksi berhasil dihapus.');
}

kirimRespons(false, 'Metode request tidak diizinkan.', null, 405);
?>

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

// GET — ambil semua atau satu pembayaran
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $id = (int) $_GET['id'];
        if ($id <= 0) kirimRespons(false, 'ID pembayaran tidak valid.', null, 400);

        $query = $koneksi->prepare(
            'SELECT pb.*, t.id_pengguna, t.id_mobil, t.total_harga, m.merek, m.model, m.varian, p.username
             FROM pembayaran pb
             LEFT JOIN transaksi t ON pb.id_transaksi = t.id_transaksi
             LEFT JOIN mobil m ON t.id_mobil = m.id_mobil
             LEFT JOIN pengguna p ON t.id_pengguna = p.id_pengguna
             WHERE pb.id_pembayaran = ?'
        );
        if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);
        $query->bind_param('i', $id);
    } elseif (isset($_GET['id_transaksi'])) {
        $idTransaksi = (int) $_GET['id_transaksi'];
        $query = $koneksi->prepare(
            'SELECT * FROM pembayaran WHERE id_transaksi = ? ORDER BY tanggal_pembayaran DESC'
        );
        if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);
        $query->bind_param('i', $idTransaksi);
    } else {
        // Semua pembayaran (admin)
        $query = $koneksi->prepare(
            'SELECT pb.*, t.id_pengguna, t.id_mobil, t.total_harga, m.merek, m.model, p.username
             FROM pembayaran pb
             LEFT JOIN transaksi t ON pb.id_transaksi = t.id_transaksi
             LEFT JOIN mobil m ON t.id_mobil = m.id_mobil
             LEFT JOIN pengguna p ON t.id_pengguna = p.id_pengguna
             ORDER BY pb.tanggal_pembayaran DESC'
        );
        if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);
    }

    if (!$query->execute()) kirimRespons(false, 'Data gagal diambil.', null, 500);
    $hasil = $query->get_result();
    if (!$hasil) kirimRespons(false, 'Data gagal dibaca.', null, 500);

    $data = [];
    while ($baris = $hasil->fetch_assoc()) {
        $data[] = $baris;
    }

    if (isset($_GET['id'])) {
        kirimRespons(true, 'Detail pembayaran berhasil diambil.', $data[0] ?? null);
    }
    kirimRespons(true, 'Data pembayaran berhasil diambil.', $data);
}

// POST — catat pembayaran baru
if ($method === 'POST') {
    $data = ambilInputJson();

    $idTransaksi     = (int) ($data['id_transaksi'] ?? 0);
    $jumlah          = $data['jumlah_pembayaran'] ?? 0;
    $metodeBayar     = trim($data['metode_pembayaran'] ?? '');
    $bukti           = trim($data['bukti_pembayaran'] ?? '');
    $status          = trim($data['status'] ?? 'Menunggu');

    if ($idTransaksi <= 0 || !is_numeric($jumlah) || $metodeBayar === '') {
        kirimRespons(false, 'id_transaksi, jumlah_pembayaran, dan metode_pembayaran wajib diisi.', null, 400);
    }

    if ($jumlah < 0) kirimRespons(false, 'Jumlah pembayaran tidak valid.', null, 400);

    $query = $koneksi->prepare(
        'INSERT INTO pembayaran (id_transaksi, jumlah_pembayaran, metode_pembayaran, bukti_pembayaran, status, tanggal_pembayaran)
         VALUES (?, ?, ?, ?, ?, NOW())'
    );
    if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);

    $query->bind_param('idsss', $idTransaksi, $jumlah, $metodeBayar, $bukti, $status);
    if (!$query->execute()) kirimRespons(false, 'Pembayaran gagal disimpan.', null, 500);

    kirimRespons(true, 'Pembayaran berhasil dicatat.', ['id_pembayaran' => $koneksi->insert_id], 201);
}

// PUT — update status pembayaran
if ($method === 'PUT') {
    $data = ambilInputJson();
    $id   = (int) ($data['id_pembayaran'] ?? 0);
    if ($id <= 0) kirimRespons(false, 'ID pembayaran wajib diisi.', null, 400);

    $status = trim($data['status'] ?? '');
    if ($status === '') kirimRespons(false, 'Status wajib diisi.', null, 400);

    $allowed = ['Menunggu', 'Dikonfirmasi', 'Ditolak'];
    if (!in_array($status, $allowed)) {
        kirimRespons(false, 'Status tidak valid.', null, 400);
    }

    $query = $koneksi->prepare('UPDATE pembayaran SET status = ? WHERE id_pembayaran = ?');
    if (!$query) kirimRespons(false, 'Query gagal disiapkan.', null, 500);
    $query->bind_param('si', $status, $id);
    if (!$query->execute()) kirimRespons(false, 'Status pembayaran gagal diperbarui.', null, 500);
    if ($query->affected_rows === 0) kirimRespons(false, 'Pembayaran tidak ditemukan.', null, 404);

    kirimRespons(true, 'Status pembayaran berhasil diperbarui.');
}

kirimRespons(false, 'Metode request tidak diizinkan.', null, 405);
?>

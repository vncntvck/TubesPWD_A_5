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
    $idPenggunaInputRaw = $data['id_pengguna'] ?? 0;
    $idPenggunaInput = is_scalar($idPenggunaInputRaw) ? (int) $idPenggunaInputRaw : 0;
    if ($idPenggunaSesi <= 0) {
        kirimRespons(false, 'Silakan login untuk membuat transaksi.', null, 401);
    }
    if ($idPenggunaInput !== $idPenggunaSesi) {
        kirimRespons(false, 'Data pengguna tidak sesuai dengan sesi login.', null, 403);
    }

    $idPengguna  = $idPenggunaSesi;
    $idMobilInput = $data['id_mobil'] ?? '';
    $idMobil = is_scalar($idMobilInput) && ctype_digit((string) $idMobilInput)
        ? (int) $idMobilInput
        : 0;
    $namaMobilInput = $data['nama_mobil'] ?? '';
    $namaMobil = is_string($namaMobilInput) ? trim($namaMobilInput) : '';
    $hargaUnitInput = $data['harga_unit'] ?? null;
    $metodeInput = $data['metode_pembayaran'] ?? '';
    $metodeBayar = is_string($metodeInput) ? trim($metodeInput) : '';
    $catatanPemesan = $data['catatan_pemesan'] ?? null;

    if ($idPengguna <= 0 || $idMobil <= 0 || $namaMobil === '' ||
        !is_numeric($hargaUnitInput) || $metodeBayar === '') {
        kirimRespons(false, 'Identitas unit dan metode pembayaran wajib diisi dengan benar.', null, 400);
    }

    if (!in_array($metodeBayar, ['Virtual Account', 'Transfer Bank', 'QRIS Instan'], true)) {
        kirimRespons(false, 'Metode pembayaran tidak valid.', null, 400);
    }

    if ($catatanPemesan !== null && !is_string($catatanPemesan)) {
        kirimRespons(false, 'Catatan pemesan tidak valid.', null, 400);
    }

    if (!$koneksi->begin_transaction()) {
        kirimRespons(false, 'Transaksi database gagal dimulai.', null, 500);
    }

    $mobilQuery = $koneksi->prepare(
        "SELECT merek, model, varian, harga
         FROM mobil
         WHERE id_mobil = ? AND status = 'Tersedia'
         FOR UPDATE"
    );
    if (!$mobilQuery) {
        $koneksi->rollback();
        kirimRespons(false, 'Data unit gagal diperiksa.', null, 500);
    }
    $mobilQuery->bind_param('i', $idMobil);
    if (!$mobilQuery->execute()) {
        $koneksi->rollback();
        kirimRespons(false, 'Data unit gagal diperiksa.', null, 500);
    }
    $mobil = $mobilQuery->get_result()->fetch_assoc();
    if (!$mobil) {
        $koneksi->rollback();
        kirimRespons(false, 'Unit tidak tersedia atau sudah dipesan.', null, 409);
    }

    $namaUnitDatabase = implode(' ', array_filter([
        $mobil['merek'],
        $mobil['model'],
        $mobil['varian']
    ], function ($bagian) {
        return $bagian !== null && trim((string) $bagian) !== '';
    }));
    if ($namaMobil !== $namaUnitDatabase ||
        (int) round((float) $hargaUnitInput * 100) !== (int) round((float) $mobil['harga'] * 100)) {
        $koneksi->rollback();
        kirimRespons(false, 'Data unit berubah. Muat ulang halaman dan pilih unit kembali.', null, 409);
    }

    $biayaAdmin = 2500000.00;
    $totalHarga = (float) $mobil['harga'] + $biayaAdmin;
    $uangMuka = round($totalHarga * 0.20, 2);
    $status = 'Menunggu';

    $query = $koneksi->prepare(
        'INSERT INTO transaksi (id_pengguna, id_mobil, metode_pembayaran, total_harga, uang_muka, status, catatan_pemesan, tanggal_transaksi)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
    );
    if (!$query) {
        $koneksi->rollback();
        kirimRespons(false, 'Query gagal disiapkan.', null, 500);
    }

    $query->bind_param('iisddss', $idPengguna, $idMobil, $metodeBayar, $totalHarga, $uangMuka, $status, $catatanPemesan);
    if (!$query->execute()) {
        $koneksi->rollback();
        kirimRespons(false, 'Transaksi gagal disimpan.', null, 500);
    }
    $idTransaksi = $koneksi->insert_id;
    if (!$koneksi->commit()) {
        $koneksi->rollback();
        kirimRespons(false, 'Transaksi gagal disimpan.', null, 500);
    }

    kirimRespons(true, 'Transaksi berhasil dibuat.', [
        'id_transaksi' => $idTransaksi,
        'id_mobil' => $idMobil,
        'total_harga' => $totalHarga,
        'uang_muka' => $uangMuka
    ], 201);
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

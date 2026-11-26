<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/koneksi.php';

function responsCicilan($status, $pesan, $data = null, $kodeHttp = 200)
{
    http_response_code($kodeHttp);
    $respons = ['status' => $status, 'pesan' => $pesan];
    if ($data !== null) {
        $respons['data'] = $data;
    }
    echo json_encode($respons, JSON_UNESCAPED_UNICODE);
    exit;
}

function inputCicilan()
{
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

$idPengguna = (int) ($_SESSION['id_pengguna'] ?? 0);
if ($idPengguna <= 0) {
    responsCicilan(false, 'Silakan login terlebih dahulu.', null, 401);
}

$isAdmin = ($_SESSION['role'] ?? '') === 'admin';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $idTransaksi = (int) ($_GET['id_transaksi'] ?? 0);
    if ($idTransaksi <= 0) {
        responsCicilan(false, 'ID transaksi tidak valid.', null, 400);
    }

    $ownerQuery = $koneksi->prepare('SELECT id_pengguna FROM transaksi WHERE id_transaksi = ?');
    if (!$ownerQuery) {
        responsCicilan(false, 'Query transaksi gagal disiapkan.', null, 500);
    }
    $ownerQuery->bind_param('i', $idTransaksi);
    if (!$ownerQuery->execute()) {
        responsCicilan(false, 'Transaksi gagal diperiksa.', null, 500);
    }
    $owner = $ownerQuery->get_result()->fetch_assoc();
    if (!$owner) {
        responsCicilan(false, 'Transaksi tidak ditemukan.', null, 404);
    }
    if (!$isAdmin && (int) $owner['id_pengguna'] !== $idPengguna) {
        responsCicilan(false, 'Akses ditolak.', null, 403);
    }

    $query = $koneksi->prepare(
        'SELECT c.id_cicilan, c.id_transaksi, c.tenor_bulan, c.uang_muka,
                c.total_cicilan, c.cicilan_per_bulan, c.status AS status_cicilan,
                a.id_angsuran, a.angsuran_ke, a.jatuh_tempo, a.jumlah,
                a.tanggal_bayar, a.status AS status_angsuran
         FROM cicilan c
         LEFT JOIN angsuran a ON a.id_cicilan = c.id_cicilan
         WHERE c.id_transaksi = ?
         ORDER BY a.angsuran_ke'
    );
    if (!$query) {
        responsCicilan(false, 'Query jadwal cicilan gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idTransaksi);
    if (!$query->execute()) {
        responsCicilan(false, 'Jadwal cicilan gagal diambil.', null, 500);
    }

    $data = [];
    $hasil = $query->get_result();
    while ($baris = $hasil->fetch_assoc()) {
        $data[] = $baris;
    }
    responsCicilan(true, 'Jadwal cicilan berhasil diambil.', $data);
}

if (!$isAdmin) {
    responsCicilan(false, 'Akses khusus admin.', null, 403);
}

if ($method === 'POST') {
    $input = inputCicilan();
    $idTransaksi = (int) ($input['id_transaksi'] ?? 0);
    $tenor = (int) ($input['tenor'] ?? 0);
    $tanggalMulai = $input['tanggal_mulai'] ?? '';
    if ($idTransaksi <= 0 || $tenor < 1 || $tenor > 120 || !is_string($tanggalMulai)) {
        responsCicilan(false, 'ID transaksi, tenor (1–120), dan tanggal mulai wajib valid.', null, 400);
    }

    $tanggal = DateTimeImmutable::createFromFormat('!Y-m-d', $tanggalMulai);
    if (!$tanggal || $tanggal->format('Y-m-d') !== $tanggalMulai) {
        responsCicilan(false, 'Tanggal mulai harus berformat YYYY-MM-DD.', null, 400);
    }

    if (!$koneksi->begin_transaction()) {
        responsCicilan(false, 'Transaksi database gagal dimulai.', null, 500);
    }

    $transaksiQuery = $koneksi->prepare(
        'SELECT total_harga, uang_muka FROM transaksi WHERE id_transaksi = ? FOR UPDATE'
    );
    if (!$transaksiQuery) {
        $koneksi->rollback();
        responsCicilan(false, 'Query transaksi gagal disiapkan.', null, 500);
    }
    $transaksiQuery->bind_param('i', $idTransaksi);
    if (!$transaksiQuery->execute()) {
        $koneksi->rollback();
        responsCicilan(false, 'Transaksi gagal dibaca.', null, 500);
    }
    $transaksi = $transaksiQuery->get_result()->fetch_assoc();
    if (!$transaksi) {
        $koneksi->rollback();
        responsCicilan(false, 'Transaksi tidak ditemukan.', null, 404);
    }

    $totalCents = (int) round((float) $transaksi['total_harga'] * 100);
    $uangMukaCents = (int) round((float) $transaksi['uang_muka'] * 100);
    $pokokCents = $totalCents - $uangMukaCents;
    if ($pokokCents <= 0) {
        $koneksi->rollback();
        responsCicilan(false, 'Uang muka harus lebih kecil dari total harga.', null, 400);
    }

    $existingQuery = $koneksi->prepare('SELECT id_cicilan FROM cicilan WHERE id_transaksi = ? LIMIT 1');
    if (!$existingQuery) {
        $koneksi->rollback();
        responsCicilan(false, 'Query jadwal cicilan gagal disiapkan.', null, 500);
    }
    $existingQuery->bind_param('i', $idTransaksi);
    if (!$existingQuery->execute()) {
        $koneksi->rollback();
        responsCicilan(false, 'Jadwal cicilan gagal diperiksa.', null, 500);
    }
    if ($existingQuery->get_result()->fetch_assoc()) {
        $koneksi->rollback();
        responsCicilan(false, 'Jadwal cicilan untuk transaksi ini sudah ada.', null, 409);
    }

    $cicilanCents = intdiv($pokokCents, $tenor);
    $cicilanPerBulan = $cicilanCents / 100;
    $uangMuka = $uangMukaCents / 100;
    $totalCicilan = $pokokCents / 100;
    $parentQuery = $koneksi->prepare(
        "INSERT INTO cicilan (id_transaksi, tenor_bulan, uang_muka, total_cicilan, cicilan_per_bulan, status)
         VALUES (?, ?, ?, ?, ?, 'Berjalan')"
    );
    if (!$parentQuery) {
        $koneksi->rollback();
        responsCicilan(false, 'Query cicilan gagal disiapkan.', null, 500);
    }
    $parentQuery->bind_param('iiddd', $idTransaksi, $tenor, $uangMuka, $totalCicilan, $cicilanPerBulan);
    if (!$parentQuery->execute()) {
        $koneksi->rollback();
        responsCicilan(false, 'Data cicilan gagal disimpan.', null, 500);
    }
    $idCicilan = $koneksi->insert_id;

    $angsuranQuery = $koneksi->prepare(
        "INSERT INTO angsuran (id_cicilan, angsuran_ke, jatuh_tempo, jumlah, status)
         VALUES (?, ?, ?, ?, 'Belum Bayar')"
    );
    if (!$angsuranQuery) {
        $koneksi->rollback();
        responsCicilan(false, 'Query angsuran gagal disiapkan.', null, 500);
    }

    $baseCents = intdiv($pokokCents, $tenor);
    $remainderCents = $pokokCents - ($baseCents * $tenor);
    for ($i = 1; $i <= $tenor; $i++) {
        $jatuhTempo = $tanggal->modify('+' . ($i - 1) . ' month')->format('Y-m-d');
        $jumlah = ($baseCents + ($i === $tenor ? $remainderCents : 0)) / 100;
        $angsuranQuery->bind_param('iisd', $idCicilan, $i, $jatuhTempo, $jumlah);
        if (!$angsuranQuery->execute()) {
            $koneksi->rollback();
            responsCicilan(false, 'Jadwal angsuran gagal dibuat.', null, 500);
        }
    }

    if (!$koneksi->commit()) {
        $koneksi->rollback();
        responsCicilan(false, 'Jadwal cicilan gagal disimpan.', null, 500);
    }
    responsCicilan(true, 'Jadwal cicilan berhasil dibuat.', [
        'id_cicilan' => $idCicilan,
        'tenor' => $tenor,
        'per_bulan' => $cicilanPerBulan
    ], 201);
}

if ($method === 'PUT') {
    $input = inputCicilan();
    $idAngsuran = (int) ($input['id_angsuran'] ?? 0);
    $status = $input['status_angsuran'] ?? '';
    if ($idAngsuran <= 0 || !is_string($status)) {
        responsCicilan(false, 'ID angsuran dan status wajib valid.', null, 400);
    }

    $statusMap = [
        'belum_bayar' => 'Belum Bayar',
        'menunggu_verifikasi' => 'Menunggu Verifikasi',
        'lunas' => 'Lunas'
    ];
    $status = $statusMap[strtolower(trim($status))] ?? null;
    if ($status === null) {
        responsCicilan(false, 'Status angsuran tidak valid.', null, 400);
    }

    $parentQuery = $koneksi->prepare('SELECT id_cicilan FROM angsuran WHERE id_angsuran = ?');
    if (!$parentQuery) {
        responsCicilan(false, 'Query angsuran gagal disiapkan.', null, 500);
    }
    $parentQuery->bind_param('i', $idAngsuran);
    if (!$parentQuery->execute()) {
        responsCicilan(false, 'Angsuran gagal diperiksa.', null, 500);
    }
    $parent = $parentQuery->get_result()->fetch_assoc();
    if (!$parent) {
        responsCicilan(false, 'Angsuran tidak ditemukan.', null, 404);
    }

    $update = $koneksi->prepare(
        "UPDATE angsuran
         SET status = ?, tanggal_bayar = CASE WHEN ? = 'Lunas' THEN COALESCE(tanggal_bayar, NOW()) ELSE NULL END
         WHERE id_angsuran = ?"
    );
    if (!$update) {
        responsCicilan(false, 'Query pembaruan angsuran gagal disiapkan.', null, 500);
    }
    $update->bind_param('ssi', $status, $status, $idAngsuran);
    if (!$update->execute()) {
        responsCicilan(false, 'Status angsuran gagal diperbarui.', null, 500);
    }

    $countQuery = $koneksi->prepare(
        "SELECT COUNT(*) AS belum_lunas FROM angsuran WHERE id_cicilan = ? AND status <> 'Lunas'"
    );
    if (!$countQuery) {
        responsCicilan(false, 'Status seluruh angsuran gagal diperiksa.', null, 500);
    }
    $countQuery->bind_param('i', $parent['id_cicilan']);
    if (!$countQuery->execute()) {
        responsCicilan(false, 'Status seluruh angsuran gagal diperiksa.', null, 500);
    }
    $belumLunas = (int) $countQuery->get_result()->fetch_assoc()['belum_lunas'];
    $statusCicilan = $belumLunas === 0 ? 'Lunas' : 'Berjalan';
    $updateParent = $koneksi->prepare('UPDATE cicilan SET status = ? WHERE id_cicilan = ?');
    if (!$updateParent) {
        responsCicilan(false, 'Query status cicilan gagal disiapkan.', null, 500);
    }
    $updateParent->bind_param('si', $statusCicilan, $parent['id_cicilan']);
    if (!$updateParent->execute()) {
        responsCicilan(false, 'Status cicilan gagal diperbarui.', null, 500);
    }
    responsCicilan(true, 'Status angsuran berhasil diperbarui.');
}

if ($method === 'DELETE') {
    $input = inputCicilan();
    $idTransaksi = (int) ($input['id_transaksi'] ?? $_GET['id_transaksi'] ?? 0);
    if ($idTransaksi <= 0) {
        responsCicilan(false, 'ID transaksi tidak valid.', null, 400);
    }

    $query = $koneksi->prepare('DELETE FROM cicilan WHERE id_transaksi = ?');
    if (!$query) {
        responsCicilan(false, 'Query penghapusan cicilan gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idTransaksi);
    if (!$query->execute()) {
        responsCicilan(false, 'Jadwal cicilan gagal dihapus.', null, 500);
    }
    if ($query->affected_rows === 0) {
        responsCicilan(false, 'Jadwal cicilan tidak ditemukan.', null, 404);
    }
    responsCicilan(true, 'Jadwal cicilan berhasil dihapus.');
}

responsCicilan(false, 'Method tidak didukung.', null, 405);
?>

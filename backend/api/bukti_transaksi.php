<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/koneksi.php';
require_once __DIR__ . '/../config/file_storage.php';

function responsBukti($status, $pesan, $data = null, $kodeHttp = 200)
{
    http_response_code($kodeHttp);
    $respons = ['status' => $status, 'pesan' => $pesan];
    if ($data !== null) {
        $respons['data'] = $data;
    }
    echo json_encode($respons, JSON_UNESCAPED_UNICODE);
    exit;
}

function inputBukti()
{
    if (($_SERVER['CONTENT_TYPE'] ?? '') !== '' &&
        stripos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') === 0) {
        return $_POST;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

function pembayaranPemilik($koneksi, $idPembayaran, $idPengguna, $isAdmin)
{
    $query = $koneksi->prepare(
        'SELECT p.id_pembayaran, p.status, t.id_pengguna
         FROM pembayaran p
         JOIN transaksi t ON t.id_transaksi = p.id_transaksi
         WHERE p.id_pembayaran = ?'
    );
    if (!$query) {
        responsBukti(false, 'Query pembayaran gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idPembayaran);
    if (!$query->execute()) {
        responsBukti(false, 'Pembayaran gagal diperiksa.', null, 500);
    }
    $pembayaran = $query->get_result()->fetch_assoc();
    if (!$pembayaran) {
        responsBukti(false, 'Pembayaran tidak ditemukan.', null, 404);
    }
    if (!$isAdmin && (int) $pembayaran['id_pengguna'] !== $idPengguna) {
        responsBukti(false, 'Akses ditolak.', null, 403);
    }
    return $pembayaran;
}

function urlBukti($baris)
{
    $baris['url_file'] = !empty($baris['file_bukti'])
        ? 'lihat_berkas.php?jenis=bukti&id=' . (int) $baris['id_bukti']
        : null;
    unset($baris['file_bukti']);
    return $baris;
}

$idPengguna = (int) ($_SESSION['id_pengguna'] ?? 0);
if ($idPengguna <= 0) {
    responsBukti(false, 'Silakan login terlebih dahulu.', null, 401);
}
$isAdmin = ($_SESSION['role'] ?? '') === 'admin';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $idPembayaran = (int) ($_GET['id_pembayaran'] ?? 0);
    if ($idPembayaran <= 0) {
        responsBukti(false, 'ID pembayaran tidak valid.', null, 400);
    }
    pembayaranPemilik($koneksi, $idPembayaran, $idPengguna, $isAdmin);

    $query = $koneksi->prepare(
        'SELECT id_bukti, id_pembayaran, nomor_bukti, file_bukti, tanggal_terbit, keterangan
         FROM bukti_pembayaran
         WHERE id_pembayaran = ?
         ORDER BY tanggal_terbit DESC, id_bukti DESC'
    );
    if (!$query) {
        responsBukti(false, 'Query bukti pembayaran gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idPembayaran);
    if (!$query->execute()) {
        responsBukti(false, 'Bukti pembayaran gagal diambil.', null, 500);
    }

    $data = [];
    $hasil = $query->get_result();
    while ($baris = $hasil->fetch_assoc()) {
        $data[] = urlBukti($baris);
    }
    responsBukti(true, 'Bukti pembayaran berhasil diambil.', $data);
}

if ($method === 'POST') {
    $input = inputBukti();
    $idPembayaran = (int) ($input['id_pembayaran'] ?? 0);
    if ($idPembayaran <= 0) {
        responsBukti(false, 'ID pembayaran tidak valid.', null, 400);
    }

    $pembayaran = pembayaranPemilik($koneksi, $idPembayaran, $idPengguna, $isAdmin);
    if ($pembayaran['status'] !== 'Menunggu') {
        responsBukti(false, 'Bukti hanya dapat diunggah untuk pembayaran yang menunggu.', null, 409);
    }

    $nomorBukti = null;
    $keterangan = null;
    foreach (['nomor_bukti', 'keterangan'] as $field) {
        $value = $input[$field] ?? null;
        if ($value !== null && !is_string($value)) {
            responsBukti(false, 'Data ' . $field . ' tidak valid.', null, 400);
        }
        if (is_string($value)) {
            $value = trim($value);
            if ($value === '') {
                $value = null;
            }
        }
        if ($field === 'nomor_bukti') {
            $nomorBukti = $value;
        } else {
            $keterangan = $value;
        }
    }
    if ($nomorBukti !== null && strlen($nomorBukti) > 60) {
        responsBukti(false, 'Nomor bukti maksimal 60 karakter.', null, 400);
    }
    if ($keterangan !== null && strlen($keterangan) > 255) {
        responsBukti(false, 'Keterangan maksimal 255 karakter.', null, 400);
    }

    try {
        $file = simpanFilePrivat('file_bukti', 'bukti', [
            'application/pdf' => 'pdf',
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
        ], 10 * 1024 * 1024, true);
    } catch (InvalidArgumentException $error) {
        responsBukti(false, $error->getMessage(), null, 400);
    } catch (RuntimeException $error) {
        responsBukti(false, $error->getMessage(), null, 500);
    }

    $query = $koneksi->prepare(
        'INSERT INTO bukti_pembayaran (id_pembayaran, nomor_bukti, file_bukti, tanggal_terbit, keterangan)
         VALUES (?, ?, ?, NOW(), ?)'
    );
    if (!$query) {
        hapusFilePrivat($file, 'bukti');
        responsBukti(false, 'Query bukti pembayaran gagal disiapkan.', null, 500);
    }
    $query->bind_param('isss', $idPembayaran, $nomorBukti, $file, $keterangan);
    if (!$query->execute()) {
        hapusFilePrivat($file, 'bukti');
        responsBukti(false, 'Bukti pembayaran gagal disimpan.', null, 500);
    }

    $idBukti = $koneksi->insert_id;
    responsBukti(true, 'Bukti pembayaran berhasil diunggah.', [
        'id_bukti' => $idBukti,
        'url_file' => 'lihat_berkas.php?jenis=bukti&id=' . $idBukti
    ], 201);
}

if ($method === 'DELETE') {
    $input = inputBukti();
    $idBukti = (int) ($input['id_bukti'] ?? $_GET['id_bukti'] ?? 0);
    if ($idBukti <= 0) {
        responsBukti(false, 'ID bukti tidak valid.', null, 400);
    }

    $query = $koneksi->prepare(
        'SELECT b.id_bukti, b.id_pembayaran, b.file_bukti, p.status, t.id_pengguna
         FROM bukti_pembayaran b
         JOIN pembayaran p ON p.id_pembayaran = b.id_pembayaran
         JOIN transaksi t ON t.id_transaksi = p.id_transaksi
         WHERE b.id_bukti = ?'
    );
    if (!$query) {
        responsBukti(false, 'Query bukti pembayaran gagal disiapkan.', null, 500);
    }
    $query->bind_param('i', $idBukti);
    if (!$query->execute()) {
        responsBukti(false, 'Bukti pembayaran gagal diperiksa.', null, 500);
    }
    $bukti = $query->get_result()->fetch_assoc();
    if (!$bukti) {
        responsBukti(false, 'Bukti pembayaran tidak ditemukan.', null, 404);
    }
    if (!$isAdmin && (int) $bukti['id_pengguna'] !== $idPengguna) {
        responsBukti(false, 'Akses ditolak.', null, 403);
    }
    if ($bukti['status'] !== 'Menunggu') {
        responsBukti(false, 'Bukti pembayaran sudah diproses dan tidak dapat dihapus.', null, 409);
    }

    $delete = $koneksi->prepare('DELETE FROM bukti_pembayaran WHERE id_bukti = ?');
    if (!$delete) {
        responsBukti(false, 'Query penghapusan bukti gagal disiapkan.', null, 500);
    }
    $delete->bind_param('i', $idBukti);
    if (!$delete->execute()) {
        responsBukti(false, 'Bukti pembayaran gagal dihapus.', null, 500);
    }
    if (!empty($bukti['file_bukti'])) {
        hapusFilePrivat($bukti['file_bukti'], 'bukti');
    }
    responsBukti(true, 'Bukti pembayaran berhasil dihapus.');
}

responsBukti(false, 'Method tidak didukung.', null, 405);
?>

<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/koneksi.php';

function responsVerifikasiKtp($status, $pesan, $data = null, $kodeHttp = 200)
{
    http_response_code($kodeHttp);
    $respons = ['status' => $status, 'pesan' => $pesan];
    if ($data !== null) {
        $respons['data'] = $data;
    }
    echo json_encode($respons, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SESSION['role'] ?? '') !== 'admin') {
    responsVerifikasiKtp(false, 'Akses khusus admin.', null, 403);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = $koneksi->prepare(
        'SELECT b.id_pembeli, b.nama_lengkap, b.nik, b.status_verifikasi,
                u.username, u.email
         FROM pembeli b
         JOIN pengguna u ON u.id_pengguna = b.id_pengguna
         WHERE b.foto_ktp_data IS NOT NULL
         ORDER BY FIELD(b.status_verifikasi, "Menunggu", "Terverifikasi", "Ditolak"),
                  b.id_pembeli DESC'
    );
    if (!$query || !$query->execute()) {
        responsVerifikasiKtp(false, 'Data verifikasi KTP gagal diambil.', null, 500);
    }

    $hasil = $query->get_result();
    $data = [];
    while ($baris = $hasil->fetch_assoc()) {
        $data[] = $baris;
    }
    responsVerifikasiKtp(true, 'Data verifikasi KTP berhasil diambil.', $data);
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        responsVerifikasiKtp(false, 'Format data tidak valid.', null, 400);
    }

    $idPembeli = (int) ($input['id_pembeli'] ?? 0);
    $statusValue = $input['status'] ?? '';
    if (!is_string($statusValue)) {
        responsVerifikasiKtp(false, 'ID pembeli atau status tidak valid.', null, 400);
    }
    $statusInput = strtolower(trim($statusValue));
    $status = [
        'terverifikasi' => 'Terverifikasi',
        'ditolak' => 'Ditolak',
    ][$statusInput] ?? null;

    if ($idPembeli <= 0 || $status === null) {
        responsVerifikasiKtp(false, 'ID pembeli atau status tidak valid.', null, 400);
    }

    $query = $koneksi->prepare(
        'UPDATE pembeli
         SET status_verifikasi = ?
         WHERE id_pembeli = ? AND foto_ktp_data IS NOT NULL'
    );
    if (!$query) {
        responsVerifikasiKtp(false, 'Query verifikasi gagal disiapkan.', null, 500);
    }
    $query->bind_param('si', $status, $idPembeli);
    if (!$query->execute()) {
        responsVerifikasiKtp(false, 'Status KTP gagal diperbarui.', null, 500);
    }
    if ($query->affected_rows === 0) {
        $cek = $koneksi->prepare(
            'SELECT id_pembeli
             FROM pembeli
             WHERE id_pembeli = ? AND foto_ktp_data IS NOT NULL'
        );
        if (!$cek) {
            responsVerifikasiKtp(false, 'Pemeriksaan data KTP gagal.', null, 500);
        }
        $cek->bind_param('i', $idPembeli);
        if (!$cek->execute() || !$cek->get_result()->fetch_assoc()) {
            responsVerifikasiKtp(false, 'Data KTP tidak ditemukan.', null, 404);
        }
    }

    responsVerifikasiKtp(true, 'Status KTP berhasil diperbarui.');
}

responsVerifikasiKtp(false, 'Method tidak didukung.', null, 405);
?>

<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/koneksi.php';

function responsKtp($status, $pesan, $data = null, $kodeHttp = 200)
{
    http_response_code($kodeHttp);
    $respons = ['status' => $status, 'pesan' => $pesan];
    if ($data !== null) {
        $respons['data'] = $data;
    }
    echo json_encode($respons, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responsKtp(false, 'Method tidak didukung.', null, 405);
}

$idPengguna = (int) ($_SESSION['id_pengguna'] ?? 0);
if ($idPengguna <= 0) {
    responsKtp(false, 'Silakan login untuk mengunggah KTP.', null, 401);
}

foreach (['nama_lengkap', 'nomor_ktp', 'alamat'] as $field) {
    if (!isset($_POST[$field]) || !is_string($_POST[$field])) {
        responsKtp(false, 'Data KTP tidak valid.', null, 400);
    }
}

$namaLengkap = trim($_POST['nama_lengkap']);
$nomorKtp = trim($_POST['nomor_ktp']);
$alamat = trim($_POST['alamat']);

if ($namaLengkap === '' || $alamat === '') {
    responsKtp(false, 'Nama lengkap dan alamat wajib diisi.', null, 400);
}
if (!preg_match('/^\d{16}$/', $nomorKtp)) {
    responsKtp(false, 'Nomor KTP harus terdiri dari 16 digit.', null, 400);
}

$file = $_FILES['bukti_ktp'] ?? null;
if (
    !is_array($file) ||
    !isset($file['error'], $file['tmp_name'], $file['size']) ||
    !is_string($file['tmp_name']) ||
    !is_int($file['size']) ||
    $file['error'] !== UPLOAD_ERR_OK ||
    !is_uploaded_file($file['tmp_name'])
) {
    responsKtp(false, 'File KTP wajib dipilih dan harus berhasil diunggah.', null, 400);
}
if ($file['size'] <= 0 || $file['size'] > 5 * 1024 * 1024) {
    responsKtp(false, 'Ukuran file KTP maksimal 5 MB.', null, 400);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
    responsKtp(false, 'File KTP harus berformat JPG atau PNG.', null, 400);
}

$fileData = file_get_contents($file['tmp_name']);
if (!is_string($fileData) || strlen($fileData) !== $file['size']) {
    responsKtp(false, 'Isi file KTP gagal dibaca.', null, 500);
}

$query = $koneksi->prepare('SELECT id_pembeli FROM pembeli WHERE id_pengguna = ? LIMIT 1');
if (!$query) {
    responsKtp(false, 'Query profil pembeli gagal disiapkan.', null, 500);
}
$query->bind_param('i', $idPengguna);
if (!$query->execute()) {
    responsKtp(false, 'Profil pembeli gagal diperiksa.', null, 500);
}
$pembeli = $query->get_result()->fetch_assoc();

if ($pembeli) {
    $simpan = $koneksi->prepare(
        "UPDATE pembeli
         SET nama_lengkap = ?, nik = ?, alamat = ?, foto_ktp = NULL, foto_ktp_data = ?,
             foto_ktp_mime = ?, status_verifikasi = 'Menunggu'
         WHERE id_pembeli = ?"
    );
    if ($simpan) {
        $simpan->bind_param(
            'sssbsi',
            $namaLengkap,
            $nomorKtp,
            $alamat,
            $fileData,
            $mime,
            $pembeli['id_pembeli']
        );
    }
} else {
    $simpan = $koneksi->prepare(
        "INSERT INTO pembeli
            (id_pengguna, nama_lengkap, nik, alamat, foto_ktp_data, foto_ktp_mime, status_verifikasi)
         VALUES (?, ?, ?, ?, ?, ?, 'Menunggu')"
    );
    if ($simpan) {
        $simpan->bind_param(
            'isssbs',
            $idPengguna,
            $namaLengkap,
            $nomorKtp,
            $alamat,
            $fileData,
            $mime
        );
    }
}

if (
    !$simpan ||
    !$simpan->send_long_data($pembeli ? 3 : 4, $fileData) ||
    !$simpan->execute()
) {
    if ($simpan && $simpan->errno === 1062) {
        responsKtp(false, 'Nomor KTP sudah terdaftar pada akun lain.', null, 409);
    }
    responsKtp(false, 'Data KTP gagal disimpan.', null, 500);
}

responsKtp(true, 'KTP berhasil diunggah dan menunggu verifikasi.');
?>

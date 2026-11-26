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
$ekstensi = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
][$mime] ?? null;
if ($ekstensi === null) {
    responsKtp(false, 'File KTP harus berformat JPG atau PNG.', null, 400);
}

$direktori = __DIR__ . '/../private/ktp';
if (!is_dir($direktori) && !mkdir($direktori, 0700, true) && !is_dir($direktori)) {
    responsKtp(false, 'Folder penyimpanan KTP tidak dapat dibuat.', null, 500);
}

$namaFile = bin2hex(random_bytes(16)) . '.' . $ekstensi;
$pathRelatif = 'private/ktp/' . $namaFile;
$pathFile = $direktori . DIRECTORY_SEPARATOR . $namaFile;
if (!move_uploaded_file($file['tmp_name'], $pathFile)) {
    responsKtp(false, 'File KTP gagal disimpan.', null, 500);
}

$query = $koneksi->prepare('SELECT id_pembeli, foto_ktp FROM pembeli WHERE id_pengguna = ? LIMIT 1');
if (!$query) {
    unlink($pathFile);
    responsKtp(false, 'Query profil pembeli gagal disiapkan.', null, 500);
}
$query->bind_param('i', $idPengguna);
if (!$query->execute()) {
    unlink($pathFile);
    responsKtp(false, 'Profil pembeli gagal diperiksa.', null, 500);
}
$pembeli = $query->get_result()->fetch_assoc();

if ($pembeli) {
    $simpan = $koneksi->prepare(
        "UPDATE pembeli
         SET nama_lengkap = ?, nik = ?, alamat = ?, foto_ktp = ?, status_verifikasi = 'Menunggu'
         WHERE id_pembeli = ?"
    );
    if ($simpan) {
        $simpan->bind_param('ssssi', $namaLengkap, $nomorKtp, $alamat, $pathRelatif, $pembeli['id_pembeli']);
    }
} else {
    $simpan = $koneksi->prepare(
        "INSERT INTO pembeli (id_pengguna, nama_lengkap, nik, alamat, foto_ktp, status_verifikasi)
         VALUES (?, ?, ?, ?, ?, 'Menunggu')"
    );
    if ($simpan) {
        $simpan->bind_param('issss', $idPengguna, $namaLengkap, $nomorKtp, $alamat, $pathRelatif);
    }
}

if (!$simpan || !$simpan->execute()) {
    unlink($pathFile);
    if ($simpan && $simpan->errno === 1062) {
        responsKtp(false, 'Nomor KTP sudah terdaftar pada akun lain.', null, 409);
    }
    responsKtp(false, 'Data KTP gagal disimpan.', null, 500);
}

if (
    $pembeli &&
    preg_match('#^private/ktp/[a-f0-9]{32}\.(jpg|png)$#', $pembeli['foto_ktp'] ?? '')
) {
    $pathLama = $direktori . DIRECTORY_SEPARATOR . basename($pembeli['foto_ktp']);
    if (is_file($pathLama)) {
        unlink($pathLama);
    }
}

responsKtp(true, 'KTP berhasil diunggah dan menunggu verifikasi.');
?>

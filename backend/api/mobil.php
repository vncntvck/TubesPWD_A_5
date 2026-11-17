<?php 
header('Content-type: application/json');
include '../config/koneksi.php';

$kondisi = $_GET['kondisi'];
$merek = $_GET['merek'];
$model = $_GET['model'];
$tahun = $_GET['tahun'];
$warna = $_GET['warna'];
$transmisi = $_GET['transmisi'];
$harga_min = $_GET['harga_min'];
$harga_max = $_GET['harga_max'];

$sql = "SELECT id_mobil,merek,model,varian,tahun_produksi,warna,jenis_transmisi,
       harga,harga_kredit,kondisi,kategori,kilometer,foto_utama, status FROM mobile WHERE status ='Tersedia'";
$tipe = '';
$nilai=[];
if($kondisi != ''){
    $sql .= " AND kondisi = '$kondisi'";
    $tipe .= 's';
    $nilai[] = $kondisi;
}
if($merek != ''){
    $sql .= " AND merek = '$merek'";
    $tipe .= 's';
    $nilai[] = $merek;
}
if($model != ''){
    $sql .= " AND model = '$model'";
    $tipe .= 's';
    $nilai[] = $model;
}
if($tahun != ''){
    $sql .= " AND tahun_produksi = '$tahun'";
    $tipe .= 'i';
    $nilai[] = $tahun;
}
if($warna != ''){
    $sql .= "AND warna = '$warna'";
    $tipe .= 's';
    $nilia[] = $warna;
}
if($transmisi != ''){
    $sql .= " AND jenis_transmisi = '$transmisi'";
    $tipe .= 's';
    $nilai[] = $transmisi;
}
if($harga_min != '' && $harga_max != ''){
    $sql .= " AND harga BETWEEN ? AND ?";
    $tipe .= 'd';
    $nilai[] = $harga_min;
    $nilai[] = $harga_max;
} elseif($harga_min != ''){
    $sql .= " AND harga >= ?";
    $tipe .= 'd';
    $nilai[] = $harga_min;
} elseif($harga_max != ''){
    $sql .= " AND harga <= ?";
    $tipe .= 'd';
    $nilai[] = $harga_max;
}
$sql .= " ORDER BY harga DESC";
$stmt = $koneksi->prepare($sql);

if($tipe != ''){
    $stmt->bind_param($tipe, ...$nilai);
}
$stmt->execute();
$hasil = $stmt->get_result();
$data = [];
while ($baris = $hasil->fetch_assoc()) {
    $data[] = $baris;
}
echo json_encode([
    'status' => 'true',
    'jumlah' => count($data),
    'data' => $data
]);
?>
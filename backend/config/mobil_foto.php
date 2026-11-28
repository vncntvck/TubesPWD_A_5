<?php

function cariezFotoMobil(array $mobil)
{
    $folderImg = realpath(dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'Frontend' . DIRECTORY_SEPARATOR . 'Img');
    if ($folderImg === false) {
        return 'Img/unit-belum-tersedia.svg';
    }

    $foto = isset($mobil['foto_utama']) && is_string($mobil['foto_utama'])
        ? trim(str_replace('\\', '/', $mobil['foto_utama']))
        : '';
    if (strpos($foto, 'Frontend/Img/') === 0) {
        $foto = substr($foto, strlen('Frontend/Img/'));
    } elseif (strpos($foto, 'Img/') === 0) {
        $foto = substr($foto, strlen('Img/'));
    }

    $kandidat = [];
    $nama = strtolower(trim(
        (string) ($mobil['merek'] ?? '') . ' ' . (string) ($mobil['model'] ?? '')
    ));
    $peta = [
        'mazda mx-5' => 'Mobil_New/mazzda/Mazda MX5 ND.png',
        'mazda mx5' => 'Mobil_New/mazzda/Mazda MX5 ND.png',
        'miata' => 'Mobil_New/mazzda/Mazda MX5 ND.png',
        'mazda rx-7' => 'Mobil_New/mazzda/Mazda RX7 FD.png',
        'mazda rx7' => 'Mobil_New/mazzda/Mazda RX7 FD.png',
        'mazda rx-8' => 'Mobil_New/mazzda/Mazda RX8.png',
        'mazda rx8' => 'Mobil_New/mazzda/Mazda RX8.png',
        'mazda3' => 'Mobil_New/mazzda/Mazda3 hatchback.png',
        'mazda 3' => 'Mobil_New/mazzda/Mazda3 hatchback.png',
        'hatchback' => 'Mobil_New/mazzda/Mazda3 hatchback.png',
        'cosmo' => 'Mobil_New/mazzda/Mazda_Cosmo_Sport_110S_png._1967_Mazda_Cosmo_110_Sport-23.png',
        'cx-30' => 'catalog/banner-mazda cx 30.jpg',
        'cx30' => 'catalog/banner-mazda cx 30.jpg',
        'gr86' => 'Mobil_New/toyota/Toyota_GR86.png',
        'gr 86' => 'Mobil_New/toyota/Toyota_GR86.png',
        'supra' => 'Mobil_New/toyota/GR SUPRA.png',
        'ae86' => 'Mobil_New/toyota/Toyota AE86 Trueno.jpeg',
        'celica' => 'Mobil_New/toyota/Toyota Celica ST205.png',
        'mr2' => 'Mobil_New/toyota/Toyota MR2 SW20.png',
        'avanza' => 'Mobil_Sec/avanza.webp',
        'brio' => 'Mobil_Sec/brio.webp',
        'triton' => 'Mobil_Sec/triton.webp',
        'l300' => 'Mobil_Sec/0aa012e6ad3a632c5eb129fc1e06b319.jpg.jpeg',
        'fortuner' => 'Mobil_Sec/fortuner.webp',
        'raptor' => 'Mobil_Sec/raptor.avif',
        'xenia' => 'Mobil_Sec/xenia.webp',
        'xpander' => 'Mobil_Sec/xpander.avif',
        'elf' => 'Mobil_Sec/elf.webp',
    ];
    foreach ($peta as $kataKunci => $path) {
        if (strpos($nama, $kataKunci) !== false) {
            $kandidat[] = $path;
            break;
        }
    }
    if ($foto !== '') {
        $kandidat[] = $foto;
    }
    $kandidat[] = 'unit-belum-tersedia.svg';

    foreach ($kandidat as $path) {
        $path = str_replace('\\', '/', $path);
        if ($path === '' || strpos($path, "\0") !== false) {
            continue;
        }

        $lokasi = realpath($folderImg . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $path));
        $awalan = rtrim($folderImg, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        if ($lokasi === false || !is_file($lokasi) ||
            stripos($lokasi, $awalan) !== 0 ||
            stripos($lokasi, DIRECTORY_SEPARATOR . 'logo' . DIRECTORY_SEPARATOR) !== false) {
            continue;
        }

        return 'Img/' . str_replace(DIRECTORY_SEPARATOR, '/', substr($lokasi, strlen($awalan)));
    }

    return 'Img/unit-belum-tersedia.svg';
}

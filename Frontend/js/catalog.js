document.addEventListener('DOMContentLoaded', function () {
    var alamatApi = '../backend/api/';
    var daftarMobil = document.getElementById('carGrid');
    var pilihanKategori = document.getElementById('category');
    var pilihanMerek = document.getElementById('brand');

    if (!daftarMobil) return;

    var alamatHalaman = new URLSearchParams(window.location.search);
    var kataKunci = (alamatHalaman.get('q') || '').trim();

    function buatElemen(tag, kelas, isi) {
        var elemen = document.createElement(tag);
        if (kelas) elemen.className = kelas;
        if (isi !== undefined) elemen.textContent = isi;
        return elemen;
    }

    function isiPilihan(pilihan, judul, daftar) {
        if (!pilihan) return;

        pilihan.textContent = '';
        var awal = buatElemen('option', '', judul);
        awal.value = 'all';
        pilihan.appendChild(awal);

        daftar.forEach(function (item) {
            var opsi = buatElemen('option', '', item);
            opsi.value = item;
            pilihan.appendChild(opsi);
        });
    }

    function buatKartu(mobil) {
        var namaMobil = mobil.merek + ' ' + mobil.model;
        var kartu = buatElemen('div', 'car-card');

        var gambar = buatElemen('img', 'car-card__img');
        if (mobil.foto_utama) gambar.src = mobil.foto_utama;
        gambar.alt = namaMobil;
        gambar.loading = 'lazy';
        kartu.appendChild(gambar);

        var info = buatElemen('div', 'car-card__info');
        info.appendChild(buatElemen('span', 'car-card__name', namaMobil));
        info.appendChild(buatElemen(
            'span',
            'car-card__price',
            'Rp ' + Number(mobil.harga).toLocaleString('id-ID')
        ));
        kartu.appendChild(info);

        var tombolDetail = buatElemen('a', 'car-card__link', 'Details');
        tombolDetail.href = 'detail.xhtml?car=' + mobil.id_mobil;
        kartu.appendChild(tombolDetail);

        return kartu;
    }

    function tampilkanMobil() {
        var parameter = new URLSearchParams();
        var kategori = pilihanKategori ? pilihanKategori.value : 'all';
        var merek = pilihanMerek ? pilihanMerek.value : 'all';

        if (kategori !== 'all') parameter.set('kategori', kategori);
        if (merek !== 'all') parameter.set('merek', merek);
        if (kataKunci) parameter.set('cari', kataKunci);

        fetch(alamatApi + 'mobil.php?' + parameter.toString())
            .then(function (response) {
                if (!response.ok) throw new Error('Data mobil gagal diambil.');
                return response.json();
            })
            .then(function (hasil) {
                if (hasil.status !== true || !Array.isArray(hasil.data)) {
                    throw new Error('Data mobil tidak valid.');
                }

                daftarMobil.textContent = '';

                if (hasil.data.length === 0) {
                    daftarMobil.appendChild(buatElemen(
                        'p',
                        'car-grid__empty',
                        'Tidak ada mobil yang cocok dengan filter ini.'
                    ));
                    return;
                }

                hasil.data.forEach(function (mobil) {
                    daftarMobil.appendChild(buatKartu(mobil));
                });
            })
            .catch(function () {
                daftarMobil.textContent = '';
                daftarMobil.appendChild(buatElemen(
                    'p',
                    'car-grid__empty',
                    'Gagal mengambil data mobil. Coba muat ulang halaman.'
                ));
            });
    }

    if (pilihanKategori) {
        pilihanKategori.addEventListener('change', tampilkanMobil);
    }
    if (pilihanMerek) {
        pilihanMerek.addEventListener('change', tampilkanMobil);
    }

    fetch(alamatApi + 'opsi_filter.php')
        .then(function (response) {
            if (!response.ok) throw new Error('Pilihan filter gagal diambil.');
            return response.json();
        })
        .then(function (hasil) {
            isiPilihan(pilihanKategori, 'All Categories', hasil.kategori);
            isiPilihan(pilihanMerek, 'All Brands', hasil.merek);

            if (pilihanKategori && alamatHalaman.get('category')) {
                pilihanKategori.value = alamatHalaman.get('category');
            }
            if (pilihanMerek && alamatHalaman.get('brand')) {
                pilihanMerek.value = alamatHalaman.get('brand');
            }

            tampilkanMobil();
        })
        .catch(function () {
            tampilkanMobil();
        });
});

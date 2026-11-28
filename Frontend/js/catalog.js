document.addEventListener('DOMContentLoaded', function () {
    var alamatApi = new URL('../backend/api/', window.location.href).href;
    var daftarMobil = document.getElementById('carGrid');
    var pilihanKategori = document.getElementById('category');
    var pilihanMerek = document.getElementById('brand');
    var pilihanUrutan = document.getElementById('catalogSort');
    var teksJumlah = document.getElementById('catalogCount');

    if (!daftarMobil) return;

    var alamatHalaman = new URLSearchParams(window.location.search);
    var kataKunci = (alamatHalaman.get('q') || '').trim();

    /* ----------------------------------------------------------
       SCROLL REVEAL — Section Heading (.catalog-heading)
       IntersectionObserver: unobserve setelah muncul sekali
       ---------------------------------------------------------- */
    var motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initHeadingReveal() {
        var heading = document.querySelector('.catalog-heading');
        if (!heading) return;

        var eyebrow = heading.querySelector('.catalog-heading__eyebrow');
        var judul   = heading.querySelector('h1');

        if (motionReduced) {
            if (eyebrow) eyebrow.classList.add('sr-visible');
            if (judul)   judul.classList.add('sr-visible');
            return;
        }

        if (!('IntersectionObserver' in window)) {
            if (eyebrow) eyebrow.classList.add('sr-visible');
            if (judul)   judul.classList.add('sr-visible');
            return;
        }

        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('sr-visible');
                obs.unobserve(entry.target); /* berhenti memantau → hemat memori */
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

        if (eyebrow) observer.observe(eyebrow);
        if (judul)   observer.observe(judul);
    }

    initHeadingReveal();

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
        kartu.dataset.price = String(mobil.harga);
        kartu.dataset.name = namaMobil;

        /* -- Wrapper gambar agar image zoom tidak keluar bingkai -- */
        var imgWrap = buatElemen('div', 'car-card__img-wrap');
        var gambar  = buatElemen('img', 'car-card__img');
        gambar.src = mobil.foto_utama
            ? new URL(mobil.foto_utama.replace(/\\/g, '/'), window.location.href).href
            : 'Img/unit-belum-tersedia.svg';
        gambar.alt    = namaMobil;
        gambar.loading = 'lazy';
        gambar.width  = 640;
        gambar.height = 360;
        gambar.onerror = function () {
            gambar.onerror = null;
            gambar.src = 'Img/unit-belum-tersedia.svg';
        };
        imgWrap.appendChild(gambar);
        kartu.appendChild(imgWrap);

        /* -- Info: nama + ikon panah (↗) + harga -- */
        var info = buatElemen('div', 'car-card__info');

        /* Baris nama + panah */
        var namaRow = buatElemen('span', 'car-card__name-row');
        var namaTeks = buatElemen('span', 'car-card__name', namaMobil);
        var panah    = buatElemen('i',    'car-card__arrow');
        panah.textContent = '↗';
        panah.setAttribute('aria-hidden', 'true');
        namaRow.appendChild(namaTeks);
        namaRow.appendChild(panah);

        info.appendChild(namaRow);
        info.appendChild(buatElemen(
            'span',
            'car-card__price',
            'Rp ' + Number(mobil.harga).toLocaleString('id-ID')
        ));
        kartu.appendChild(info);

        /* -- Tombol detail dengan underline animasi -- */
        var tombolDetail = buatElemen('a', 'car-card__link', 'Tanyakan harga');
        tombolDetail.href = 'detail.xhtml?id=' + encodeURIComponent(mobil.id_mobil);
        kartu.appendChild(tombolDetail);

        return kartu;
    }

    /* ----------------------------------------------------------
       REVEAL KARTU — stagger 100ms, unobserve setelah muncul.
       Jika reduced-motion, langsung tampilkan tanpa animasi.
       ---------------------------------------------------------- */
    function tampilkanRevealKartu(useFadeIn) {
        var kartu = daftarMobil.querySelectorAll('.car-card');

        if (motionReduced) {
            kartu.forEach(function (item) {
                item.classList.add('is-ready');
                item.style.opacity = '1';
                item.style.transform = 'none';
            });
            return;
        }

        kartu.forEach(function (item, index) {
            /* Stagger: selisih 100ms antar kartu, dibatasi 600ms agar tidak terlalu lambat */
            var delay = Math.min(index * 100, 600);
            item.style.setProperty('--card-delay', delay + 'ms');

            if (useFadeIn) {
                /* Filter change → fade-in singkat tanpa translateY */
                item.style.animationDelay = delay + 'ms';
                item.classList.add('card-fadein');
                /* Pastikan opacity visible setelah animasi */
                item.addEventListener('animationend', function onEnd() {
                    item.classList.remove('card-fadein');
                    item.classList.add('is-ready');
                    item.removeEventListener('animationend', onEnd);
                });
            } else {
                /* Muat pertama kali → slide up dari bawah */
                item.classList.add('is-ready');
            }
        });
    }

    /* flag: true = muat pertama, false = perubahan filter */
    var isFirstLoad = true;

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
                    isFirstLoad = false;
                    return;
                }

                hasil.data.forEach(function (mobil) {
                    daftarMobil.appendChild(buatKartu(mobil));
                });

                var urutan = pilihanUrutan ? pilihanUrutan.value : 'featured';
                if (urutan !== 'featured') {
                    var kartu = Array.prototype.slice.call(daftarMobil.querySelectorAll('.car-card'));
                    kartu.sort(function (a, b) {
                        if (urutan === 'price-low') return Number(a.dataset.price) - Number(b.dataset.price);
                        if (urutan === 'price-high') return Number(b.dataset.price) - Number(a.dataset.price);
                        return a.dataset.name.localeCompare(b.dataset.name);
                    });
                    kartu.forEach(function (item) {
                        daftarMobil.appendChild(item);
                    });
                }

                if (teksJumlah) teksJumlah.textContent = hasil.data.length + ' mobil tersedia';

                /* Muat pertama → slide-up reveal. Filter change → fade-in cepat */
                tampilkanRevealKartu(!isFirstLoad);
                isFirstLoad = false;
            })
            .catch(function () {
                daftarMobil.textContent = '';
                daftarMobil.appendChild(buatElemen(
                    'p',
                    'car-grid__empty',
                    'Gagal mengambil data mobil. Coba muat ulang halaman.'
                ));
                isFirstLoad = false;
            });
    }

    if (pilihanKategori) {
        pilihanKategori.addEventListener('change', tampilkanMobil);
    }
    if (pilihanMerek) {
        pilihanMerek.addEventListener('change', tampilkanMobil);
    }
    if (pilihanUrutan) {
        pilihanUrutan.addEventListener('change', tampilkanMobil);
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

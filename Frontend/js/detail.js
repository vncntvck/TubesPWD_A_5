/* ================================================================
   CARIEZ — detail.js  (versi dinamis)
   Mengambil data mobil dari backend/api/detail_mobil.php berdasarkan
   ?id=ID di URL, lalu mengisi semua elemen DOM tanpa mengubah CSS.
   ================================================================ */

(function () {
    'use strict';

    /* ── Path API ──────────────────────────────────────────────── */
    var API_BASE = '../backend/api/';

    /* ── Ambil ID mobil dari URL ────────────────────────────────── */
    var params = new URLSearchParams(window.location.search);
    var idParam = params.get('id') || '';
    var carId   = /^\d+$/.test(idParam) ? parseInt(idParam, 10) : 0;

    /* Jika tidak ada ID, redirect ke katalog */
    if (!carId || carId < 1) {
        window.location.replace('catalog.xhtml');
        return;
    }

    /* ── Simpan ID agar halaman pembayaran bisa mengambilnya ───── */
    if (carId) sessionStorage.setItem('id_mobil', carId);

    var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ==============================================================
       IMAGE MAPPING
       Cocokkan nama mobil dari DB dengan file yang ada di folder Img.
       Kunci: kata-kata dari merek/model (lowercase, tanpa spasi).
       Nilai: { hero, thumbs[] } — semua path relatif dari Frontend/
    ============================================================== */
    var IMG_BASE = 'Img/Mobil_New/';

    /* Thumbnail interior per merek/model */
    var INTERIOR_MAZDA_MX5 = [
        IMG_BASE + 'Interior Mazda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0011.webp',
        IMG_BASE + 'Interior Mazda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0353.webp',
        IMG_BASE + 'Interior Mazda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0965.webp',
        IMG_BASE + 'Interior Mazda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0830.webp',
    ];
    var INTERIOR_RX7 = [
        IMG_BASE + 'Interior Mazda/rx7/rs7 dashboard.jpeg',
        IMG_BASE + 'Interior Mazda/rx7/rs7 mesin.jpeg',
        IMG_BASE + 'mazzda/Mazda RX7 FD.png',
        IMG_BASE + 'mazzda/Mazda RX7 FD.png',
    ];
    var INTERIOR_RX8 = [
        IMG_BASE + 'Interior Mazda/interior rx8/rx8 dashboard.webp',
        IMG_BASE + 'Interior Mazda/interior rx8/rx8 bawah.webp',
        IMG_BASE + 'mazzda/Mazda RX8.png',
        IMG_BASE + 'mazzda/Mazda RX8.png',
    ];
    var INTERIOR_MAZDA3 = [
        IMG_BASE + 'Interior Mazda/interior mazda 3 hatchback/mazda dashborad.webp',
        IMG_BASE + 'Interior Mazda/interior mazda 3 hatchback/mazda depan.webp',
        IMG_BASE + 'mazzda/Mazda3 hatchback.png',
        IMG_BASE + 'mazzda/Mazda3 hatchback.png',
    ];
    var INTERIOR_COSMO = [
        IMG_BASE + 'Interior Mazda/cosmo/cosmo 1.jpeg',
        IMG_BASE + 'Interior Mazda/cosmo/cosmo 2.jpeg',
        IMG_BASE + 'mazzda/Mazda_Cosmo_Sport_110S_png._1967_Mazda_Cosmo_110_Sport-23.png',
        IMG_BASE + 'mazzda/Mazda_Cosmo_Sport_110S_png._1967_Mazda_Cosmo_110_Sport-23.png',
    ];
    var INTERIOR_TOYOTA = [
        IMG_BASE + 'toyota/Toyota_GR86.png',
        IMG_BASE + 'toyota/Toyota_GR86.png',
        IMG_BASE + 'toyota/Toyota_GR86.png',
        IMG_BASE + 'toyota/Toyota_GR86.png',
    ];

    /* Gambar default jika tidak ada yang cocok */
    var DEFAULT_IMG    = 'Img/mobil_homepage.jpg';
    var DEFAULT_THUMBS = [DEFAULT_IMG, DEFAULT_IMG, DEFAULT_IMG, DEFAULT_IMG];

    /**
     * Cari gambar berdasarkan merek + model dari DB.
     * Mengembalikan { hero: string, thumbs: string[] }
     */
    function getImageSet(merek, model, fotoUtama) {
        var key = ((merek || '') + ' ' + (model || '')).toLowerCase();

        /* Kalau DB sudah punya foto_utama, pakai itu sebagai hero */
        var hero = (fotoUtama && fotoUtama.trim()) ? fotoUtama : null;

        /* Mazda */
        if (key.indexOf('mx-5') !== -1 || key.indexOf('mx5') !== -1 || key.indexOf('miata') !== -1) {
            return {
                hero:   hero || IMG_BASE + 'mazzda/WhatsApp Image 2026-11-19 at 10.26.15.jpeg',
                thumbs: [
                    hero || IMG_BASE + 'mazzda/WhatsApp Image 2026-11-19 at 10.26.15.jpeg',
                    IMG_BASE + 'mazzda/Mazda MX5 ND.png',
                ].concat(INTERIOR_MAZDA_MX5.slice(0, 2))
            };
        }
        if (key.indexOf('rx-7') !== -1 || key.indexOf('rx7') !== -1) {
            return {
                hero:   hero || IMG_BASE + 'mazzda/Mazda RX7 FD.png',
                thumbs: [hero || IMG_BASE + 'mazzda/Mazda RX7 FD.png'].concat(INTERIOR_RX7.slice(0, 3))
            };
        }
        if (key.indexOf('rx-8') !== -1 || key.indexOf('rx8') !== -1) {
            return {
                hero:   hero || IMG_BASE + 'mazzda/Mazda RX8.png',
                thumbs: [hero || IMG_BASE + 'mazzda/Mazda RX8.png'].concat(INTERIOR_RX8.slice(0, 3))
            };
        }
        if (key.indexOf('mazda3') !== -1 || key.indexOf('mazda 3') !== -1 || key.indexOf('hatchback') !== -1) {
            return {
                hero:   hero || IMG_BASE + 'mazzda/Mazda3 hatchback.png',
                thumbs: [hero || IMG_BASE + 'mazzda/Mazda3 hatchback.png'].concat(INTERIOR_MAZDA3.slice(0, 3))
            };
        }
        if (key.indexOf('cosmo') !== -1) {
            return {
                hero:   hero || IMG_BASE + 'mazzda/Mazda_Cosmo_Sport_110S_png._1967_Mazda_Cosmo_110_Sport-23.png',
                thumbs: INTERIOR_COSMO
            };
        }

        /* Toyota */
        if (key.indexOf('gr86') !== -1 || key.indexOf('gr 86') !== -1) {
            return {
                hero:   hero || IMG_BASE + 'toyota/Toyota_GR86.png',
                thumbs: [hero || IMG_BASE + 'toyota/Toyota_GR86.png'].concat(INTERIOR_TOYOTA.slice(0, 3))
            };
        }
        if (key.indexOf('supra') !== -1) {
            return {
                hero:   hero || IMG_BASE + 'toyota/GR SUPRA.png',
                thumbs: [
                    hero || IMG_BASE + 'toyota/GR SUPRA.png',
                    IMG_BASE + 'toyota/GR SUPRA.png',
                    IMG_BASE + 'toyota/Toyota_GR86.png',
                    IMG_BASE + 'toyota/Toyota_GR86.png',
                ]
            };
        }
        if (key.indexOf('ae86') !== -1) {
            return {
                hero:   hero || IMG_BASE + 'toyota/Toyota AE86 Trueno.jpeg',
                thumbs: [
                    hero || IMG_BASE + 'toyota/Toyota AE86 Trueno.jpeg',
                    IMG_BASE + 'toyota/Toyota AE86 Trueno.jpeg',
                    IMG_BASE + 'toyota/Toyota_GR86.png',
                    IMG_BASE + 'toyota/Toyota_GR86.png',
                ]
            };
        }
        if (key.indexOf('celica') !== -1) {
            return {
                hero:   hero || IMG_BASE + 'toyota/Toyota Celica ST205.png',
                thumbs: [
                    hero || IMG_BASE + 'toyota/Toyota Celica ST205.png',
                    IMG_BASE + 'toyota/Toyota Celica ST205.png',
                    IMG_BASE + 'toyota/Toyota MR2 SW20.png',
                    IMG_BASE + 'toyota/Toyota MR2 SW20.png',
                ]
            };
        }
        if (key.indexOf('mr2') !== -1) {
            return {
                hero:   hero || IMG_BASE + 'toyota/Toyota MR2 SW20.png',
                thumbs: [
                    hero || IMG_BASE + 'toyota/Toyota MR2 SW20.png',
                    IMG_BASE + 'toyota/Toyota MR2 SW20.png',
                    IMG_BASE + 'toyota/Toyota Celica ST205.png',
                    IMG_BASE + 'toyota/Toyota Celica ST205.png',
                ]
            };
        }

        /* Fallback: kalau foto_utama ada dari DB, pakai itu */
        if (hero) {
            return { hero: hero, thumbs: [hero, hero, hero, hero] };
        }

        return { hero: DEFAULT_IMG, thumbs: DEFAULT_THUMBS };
    }

    /* ==============================================================
       UTILITAS DOM
    ============================================================== */
    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value || '—';
    }

    function setHtml(id, value) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = value || '';
    }

    function setAttr(id, attr, value) {
        var el = document.getElementById(id);
        if (el) el.setAttribute(attr, value || '');
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }

    function hasValue(value) {
        return value !== null && value !== undefined && String(value).trim() !== '';
    }

    function formatRupiah(angka) {
        if (!hasValue(angka)) return 'Belum tersedia';
        var nominal = Number(angka);
        return Number.isFinite(nominal)
            ? 'Rp ' + nominal.toLocaleString('id-ID')
            : 'Belum tersedia';
    }

    function formatCicilan(mobil) {
        var cicilan = mobil.cicilan_per_bulan;
        if (hasValue(cicilan) && Number.isFinite(Number(cicilan)) && Number(cicilan) > 0) {
            return formatRupiah(cicilan) + ' /bln';
        }

        var harga = Number(mobil.harga);
        if (!Number.isFinite(harga) || harga <= 0) return 'Belum tersedia';
        var pokok = harga * 0.70;
        var total = pokok * (1 + (0.035 * 4));
        return formatRupiah(Math.round(total / 48)) + ' /bln';
    }

    function formatUkuranMesin(value) {
        if (!hasValue(value)) return null;
        var angka = Number(value);
        return (Number.isFinite(angka) ? angka.toLocaleString('id-ID') : value) + ' cc';
    }

    /* ==============================================================
       ISI DOM DARI DATA MOBIL
    ============================================================== */
    function isiDOM(mobil) {
        var namaMobil = [mobil.merek, mobil.model].filter(hasValue).join(' ');
        var namaLengkap = [namaMobil, mobil.varian].filter(hasValue).join(' ') || 'Mobil #' + mobil.id_mobil;

        /* ── <title> halaman ─────────────────────────────────── */
        document.title = namaLengkap + ' — Detail Mobil | CARIEZ';

        /* ── Breadcrumb ──────────────────────────────────────── */
        var bcKategori = document.getElementById('bcKategori');
        var bcModel    = document.getElementById('bcModel');
        var bcKatLink  = document.getElementById('bcKategoriLink');
        if (bcKategori) bcKategori.textContent = mobil.kategori || 'Kategori belum tersedia';
        if (bcModel)    bcModel.textContent    = namaLengkap;
        if (bcKatLink) {
            bcKatLink.setAttribute('href', hasValue(mobil.kategori)
                ? 'catalog.xhtml?category=' + encodeURIComponent(mobil.kategori)
                : 'catalog.xhtml');
        }

        /* ── Badge kategori & tahun ──────────────────────────── */
        var badgeEv = document.getElementById('badgeKategori');
        if (badgeEv) {
            badgeEv.textContent = mobil.kategori || 'Kategori belum tersedia';
        }
        setText('infoTahun', mobil.tahun_produksi
            ? 'Model Year ' + mobil.tahun_produksi
            : 'Tahun belum tersedia');

        /* ── Judul & deskripsi ───────────────────────────────── */
        setText('infoJudul', namaLengkap);
        setText('infoDesc',  mobil.deskripsi || 'Informasi deskripsi belum tersedia.');

        setText('highlightJarak', hasValue(mobil.kilometer)
            ? Number(mobil.kilometer).toLocaleString('id-ID') + ' km'
            : 'Belum tersedia');
        setText('highlightMesin', formatUkuranMesin(mobil.kapasitas_mesin) || 'Belum tersedia');
        setText('highlightTenaga', hasValue(mobil.tenaga) ? mobil.tenaga + ' HP' : 'Belum tersedia');
        setText('highlightTorsi', hasValue(mobil.torsi) ? mobil.torsi + ' Nm' : 'Belum tersedia');

        /* ── Harga & cicilan ─────────────────────────────────── */
        setText('infoHarga',   formatRupiah(mobil.harga));
        setText('infoCicilan', formatCicilan(mobil));

        /* ── Varian badge di tabel spesifikasi ──────────────── */
        setText('specsVarian', mobil.varian || namaMobil || 'Varian belum tersedia');
        setText('colorName', mobil.warna || 'Warna belum tersedia');
        var swatches = document.querySelector('.d-swatches');
        if (swatches) {
            swatches.hidden = true;
            swatches.style.display = 'none';
        }

        /* ── Tabel spesifikasi ───────────────────────────────── */
        var tbody = document.getElementById('specsBody');
        if (tbody) {
            var rows = [];

            var push = function (label, value) {
                if (value != null && String(value).trim()) {
                    rows.push('<tr><td>' + escapeHtml(label) + '</td><td>' + escapeHtml(value) + '</td></tr>');
                }
            };

            push('Merek',         mobil.merek);
            push('Model',         [mobil.model, mobil.varian].filter(hasValue).join(' '));
            push('Tahun Produksi', mobil.tahun_produksi);
            push('Kategori',      mobil.kategori);
            push('Kondisi',       mobil.kondisi);
            push('Transmisi',     mobil.jenis_transmisi);
            push('Warna',         mobil.warna);
            push('Kilometer', hasValue(mobil.kilometer)
                ? Number(mobil.kilometer).toLocaleString('id-ID') + ' km'
                : null);
            push('Kapasitas Mesin', formatUkuranMesin(mobil.kapasitas_mesin));
            push('Tenaga Maksimum', hasValue(mobil.tenaga) ? mobil.tenaga + ' HP' : null);
            push('Torsi Maksimum', hasValue(mobil.torsi) ? mobil.torsi + ' Nm' : null);
            push('Kapasitas Penumpang', hasValue(mobil.kapasitas_penumpang)
                ? mobil.kapasitas_penumpang + ' orang'
                : null);
            push('Harga Kredit', hasValue(mobil.harga_kredit) ? formatRupiah(mobil.harga_kredit) : null);

            tbody.innerHTML = rows.length
                ? rows.join('')
                : '<tr><td colspan="2" style="color:#9ca3af;">Data spesifikasi belum tersedia.</td></tr>';
        }

        /* ── Harga di kartu promo ────────────────────────────── */
        setText('promoHarga', formatCicilan(mobil));

        /* ── Tombol Pesan Unit ───────────────────────────────── */
        var btnPesan = document.getElementById('btnPesanUnit');
        if (btnPesan) btnPesan.setAttribute('href', 'pembayaran.xhtml?car=' + mobil.id_mobil);
        var permintaanKendaraan = function (judul) {
            var detailUnit = 'Unit: ' + namaLengkap + ' (ID ' + mobil.id_mobil + ')';
            return 'mailto:hi@cariez.com?subject=' + encodeURIComponent(judul + ' - ' + namaLengkap) +
                '&body=' + encodeURIComponent('Halo CARIEZ, saya ingin informasi untuk ' + detailUnit + '.');
        };
        var btnTestDrive = document.getElementById('btnTestDrive');
        var btnBrosur = document.getElementById('btnBrosur');
        var btnKonsultasi = document.getElementById('btnKonsultasi');
        var btnSpecs = document.getElementById('btnSpecs');
        if (btnTestDrive) btnTestDrive.href = permintaanKendaraan('Permintaan test drive');
        if (btnBrosur) btnBrosur.href = permintaanKendaraan('Permintaan brosur');
        if (btnKonsultasi) btnKonsultasi.href = permintaanKendaraan('Konsultasi pembiayaan');
        if (btnSpecs) btnSpecs.href = permintaanKendaraan('Permintaan lembar spesifikasi');

        /* ── Galeri gambar ───────────────────────────────────── */
        var imgSet  = getImageSet(mobil.merek, mobil.model, mobil.foto_utama);
        var imgA    = document.getElementById('mainImgA');
        var imgB    = document.getElementById('mainImgB');

        if (imgA) {
            imgA.src = imgSet.hero;
            imgA.alt = namaLengkap;
            imgA.onerror = function () {
                imgA.onerror = null;
                imgA.src = DEFAULT_IMG;
            };
        }
        if (imgB) {
            imgB.src = imgSet.hero;
            imgB.alt = namaLengkap;
            imgB.onerror = function () {
                imgB.onerror = null;
                imgB.src = DEFAULT_IMG;
            };
        }

        /* Thumbnail strip */
        var thumbsContainer = document.getElementById('dThumbs');
        if (thumbsContainer) {
            thumbsContainer.innerHTML = '';
            var labels = ['Eksterior Depan', 'Tampak Samping', 'Interior', 'Detail'];
            imgSet.thumbs.forEach(function (src, i) {
                var btn = document.createElement('button');
                btn.type      = 'button';
                btn.className = 'd-thumb' + (i === 0 ? ' d-thumb--active' : '');
                btn.setAttribute('data-src', src);
                btn.setAttribute('data-label', labels[i] || 'Foto ' + (i + 1));

                var img = document.createElement('img');
                img.src     = src;
                img.alt     = namaLengkap + ' — ' + (labels[i] || '');
                img.loading = 'lazy';
                img.onerror = function () {
                    img.onerror = null;
                    img.src = DEFAULT_IMG;
                };

                btn.appendChild(img);
                thumbsContainer.appendChild(btn);
            });

            /* Re-attach event listener klik thumbnail */
            initThumbClicks();
        }

    }

    /* ==============================================================
       FETCH DATA DARI API
    ============================================================== */
    function muatDetail() {
        if (!carId) return;

        fetch(API_BASE + 'detail_mobil.php?id=' + encodeURIComponent(carId))
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (json) {
                if (!json.status || !json.data) {
                    /* Mobil tidak ditemukan → kembali ke katalog */
                    window.location.replace('catalog.xhtml');
                    return;
                }
                isiDOM(json.data);
                /* Muat rekomendasi mobil lain setelah data utama tampil */
                muatRekomendasi(carId);
            })
            .catch(function () {
                /* Gagal koneksi → kembali ke katalog */
                window.location.replace('catalog.xhtml');
            });
    }

    /* ==============================================================
       REKOMENDASI — Ambil 3 mobil lain dari DB (bukan mobil ini)
    ============================================================== */
    function muatRekomendasi(idSaatIni) {
        fetch(API_BASE + 'mobil.php')
            .then(function (res) { return res.json(); })
            .then(function (json) {
                if (!json.status || !Array.isArray(json.data)) return;

                /* Ambil maks 3 mobil berbeda dari yang sedang ditampilkan */
                var lain = json.data
                    .filter(function (m) { return String(m.id_mobil) !== String(idSaatIni); })
                    .slice(0, 3);

                var grid = document.querySelector('.d-reco__grid');
                if (!grid || !lain.length) return;

                var badgeClass = ['d-reco-card__badge--blue', 'd-reco-card__badge--green', 'd-reco-card__badge--purple'];
                var delay      = ['0s', '0.1s', '0.2s'];

                grid.innerHTML = lain.map(function (m, i) {
                    var nama   = [m.merek, m.model].filter(hasValue).join(' ') || 'Mobil #' + m.id_mobil;
                    var imgSet = getImageSet(m.merek, m.model, m.foto_utama);
                    var harga  = hasValue(m.harga) ? 'Mulai ' + formatRupiah(m.harga) : 'Harga belum tersedia';
                    return [
                        '<a href="detail.xhtml?id=' + encodeURIComponent(m.id_mobil) + '" class="d-reco-card sr-item" style="--sr-delay:' + delay[i] + '">',
                        '  <div class="d-reco-card__img-wrap">',
                        '    <img src="' + escapeHtml(imgSet.hero) + '" alt="' + escapeHtml(nama) + '" loading="lazy" class="d-reco-card__img"',
                        '         onerror="this.onerror=null;this.src=\'' + DEFAULT_IMG + '\'" />',
                        '    <span class="d-reco-card__badge ' + badgeClass[i] + '">' + escapeHtml(m.kategori || 'Mobil') + '</span>',
                        '  </div>',
                        '  <div class="d-reco-card__body">',
                        '      <span class="d-reco-card__brand">' + escapeHtml(m.merek || '') + '</span>',
                        '    <div class="d-reco-card__name-row">',
                        '      <span class="d-reco-card__name">' + escapeHtml([m.model, m.varian].filter(hasValue).join(' ') || 'Detail mobil') + '</span>',
                        '      <span class="d-reco-card__arrow" aria-hidden="true">&#8594;</span>',
                        '    </div>',
                        '    <span class="d-reco-card__price">' + harga + '</span>',
                        '  </div>',
                        '</a>',
                    ].join('\n');
                }).join('\n');

                /* Re-trigger scroll reveal untuk kartu baru */
                if (typeof initScrollReveal === 'function') initScrollReveal();
                else reInitReveal();
            })
            .catch(function () { /* rekomendasi gagal — tidak masalah */ });
    }

    /* ==============================================================
       GALERI — crossfade thumbnail
    ============================================================== */
    var imgA   = document.getElementById('mainImgA');
    var imgB   = document.getElementById('mainImgB');
    var active = 'A';

    function switchImage(src) {
        if (!imgA || !imgB) return;
        if (active === 'A') {
            imgB.src = src;
            imgB.classList.add('is-shown');
            imgA.classList.remove('is-shown');
            active = 'B';
        } else {
            imgA.src = src;
            imgA.classList.add('is-shown');
            imgB.classList.remove('is-shown');
            active = 'A';
        }
    }

    function initThumbClicks() {
        var thumbEls = document.querySelectorAll('.d-thumb');
        thumbEls.forEach(function (thumb) {
            thumb.addEventListener('click', function () {
                var src = thumb.getAttribute('data-src');
                if (!src) return;
                thumbEls.forEach(function (t) { t.classList.remove('d-thumb--active'); });
                thumb.classList.add('d-thumb--active');
                switchImage(src);
            });
            thumb.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); thumb.click(); }
            });
        });
    }

    /* ==============================================================
       NAVBAR
    ============================================================== */
    var navbar = document.getElementById('dNavbar');
    if (navbar) {
        var onScroll = function () {
            navbar.classList.toggle('is-scrolled', window.scrollY > 10);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    var burger  = document.getElementById('dBurger');
    var navMenu = document.getElementById('dNavMenu');
    if (burger && navMenu) {
        burger.addEventListener('click', function () {
            var isOpen = navMenu.classList.toggle('is-open');
            burger.classList.toggle('is-open', isOpen);
            burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) {
            if (navbar && !navbar.contains(e.target)) {
                navMenu.classList.remove('is-open');
                burger.classList.remove('is-open');
                burger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ==============================================================
       SCROLL REVEAL
    ============================================================== */
    function reInitReveal() {
        var items = document.querySelectorAll('.sr-item:not(.is-visible)');
        if (!items.length) return;
        if (!motionOK) {
            items.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }
        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }
        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        items.forEach(function (el) { observer.observe(el); });
    }

    function initScrollReveal() { reInitReveal(); }

    /* ==============================================================
       NUMBER COUNTER
    ============================================================== */
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function animateCounter(el) {
        var target   = parseFloat(el.getAttribute('data-target') || '0');
        var suffix   = el.getAttribute('data-suffix')  || '';
        var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
        var duration = 1400;
        var start    = null;
        function step(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            el.textContent = (easeOut(progress) * target).toFixed(decimals) + suffix;
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target.toFixed(decimals) + suffix;
        }
        requestAnimationFrame(step);
    }

    function initCounters() {
        var counters = document.querySelectorAll('.d-counter');
        if (!counters.length) return;
        if (!motionOK) {
            counters.forEach(function (el) {
                el.textContent = parseFloat(el.getAttribute('data-target') || '0')
                    .toFixed(parseInt(el.getAttribute('data-decimal') || '0', 10))
                    + (el.getAttribute('data-suffix') || '');
            });
            return;
        }
        if (!('IntersectionObserver' in window)) {
            counters.forEach(function (el) {
                el.textContent = parseFloat(el.getAttribute('data-target') || '0')
                    .toFixed(parseInt(el.getAttribute('data-decimal') || '0', 10))
                    + (el.getAttribute('data-suffix') || '');
            });
            return;
        }
        var io = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                animateCounter(entry.target);
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.4 });
        counters.forEach(function (el) { io.observe(el); });
    }

    /* ==============================================================
       TOMBOL PRESS
    ============================================================== */
    function initButtonPress() {
        var btns = document.querySelectorAll('.d-btn, .d-promo-card__btn, .d-navbar__cta');
        btns.forEach(function (btn) {
            btn.addEventListener('mousedown', function () {
                btn.style.transform = 'scale(0.98)';
                btn.style.transitionDuration = '0.08s';
            });
            var reset = function () {
                btn.style.transform = '';
                btn.style.transitionDuration = '';
            };
            btn.addEventListener('mouseup',    reset);
            btn.addEventListener('mouseleave', reset);
        });
    }

    /* ==============================================================
       REKOMENDASI — panah navigasi
    ============================================================== */
    var recoPrev = document.getElementById('recoPrev');
    var recoNext = document.getElementById('recoNext');
    var recoGrid = document.querySelector('.d-reco__grid');
    if (recoPrev && recoNext && recoGrid) {
        recoNext.addEventListener('click', function () { recoGrid.scrollBy({ left: 320, behavior: 'smooth' }); });
        recoPrev.addEventListener('click', function () { recoGrid.scrollBy({ left: -320, behavior: 'smooth' }); });
    }

    /* ==============================================================
       WARNA PICKER — biarkan berfungsi dengan gambar yang sudah diisi
       Pemilih warna tidak lagi hardcode; ia hanya mengganti gambar
       pada galeri yang sudah diinisialisasi oleh isiDOM().
    ============================================================== */
    var swatches  = document.querySelectorAll('.d-swatch');
    var colorName = document.getElementById('colorName');

    swatches.forEach(function (swatch) {
        swatch.addEventListener('click', function () {
            swatches.forEach(function (s) {
                s.classList.remove('d-swatch--active');
                s.setAttribute('aria-checked', 'false');
            });
            swatch.classList.add('d-swatch--active');
            swatch.setAttribute('aria-checked', 'true');

            var name = swatch.getAttribute('data-name') || '';
            if (colorName) {
                colorName.style.transition = 'opacity 0.18s ease';
                colorName.style.opacity    = '0';
                setTimeout(function () {
                    colorName.textContent   = name;
                    colorName.style.opacity = '1';
                }, 190);
            }
            /* Tidak perlu switch gambar — warna picker sudah jadi dekoratif
               kecuali data gambar per-warna di DB sudah tersedia */
        });
    });

    /* ==============================================================
       INIT
    ============================================================== */
    document.addEventListener('DOMContentLoaded', function () {
        initScrollReveal();
        initCounters();
        initButtonPress();
        muatDetail();   /* ← titik masuk utama */
    });

}());

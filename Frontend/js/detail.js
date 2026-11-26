/* ================================================================
   CARIEZ — detail.js
   Vanilla JS, tanpa library. Hanya animasikan transform + opacity.
   Semua IntersectionObserver di-unobserve setelah trigger sekali.
   ================================================================ */

(function () {
    'use strict';

    var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----------------------------------------------------------------
       1. NAVBAR — scrolled state
    ---------------------------------------------------------------- */
    var navbar = document.getElementById('dNavbar');

    if (navbar) {
        var onScroll = function () {
            if (window.scrollY > 10) {
                navbar.classList.add('is-scrolled');
            } else {
                navbar.classList.remove('is-scrolled');
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // jalankan sekali saat load
    }

    /* ----------------------------------------------------------------
       2. NAVBAR — burger mobile
    ---------------------------------------------------------------- */
    var burger  = document.getElementById('dBurger');
    var navMenu = document.getElementById('dNavMenu');

    if (burger && navMenu) {
        burger.addEventListener('click', function () {
            var isOpen = navMenu.classList.toggle('is-open');
            burger.classList.toggle('is-open', isOpen);
            burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Tutup menu saat klik di luar
        document.addEventListener('click', function (e) {
            if (!navbar.contains(e.target)) {
                navMenu.classList.remove('is-open');
                burger.classList.remove('is-open');
                burger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ----------------------------------------------------------------
       3. GALERI — crossfade thumbnail ke foto utama
       Teknik: dua <img> ditumpuk (A dan B), bergantian is-shown.
    ---------------------------------------------------------------- */
    var imgA    = document.getElementById('mainImgA');
    var imgB    = document.getElementById('mainImgB');
    var thumbs  = document.querySelectorAll('.d-thumb');
    var active  = 'A'; // lacak layer mana yang sedang aktif

    function switchImage(src) {
        if (!imgA || !imgB) return;

        if (active === 'A') {
            // Siapkan B dengan src baru, lalu swap visibility
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

    thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function () {
            var src = thumb.getAttribute('data-src');
            if (!src) return;

            // Update active state thumbnail
            thumbs.forEach(function (t) { t.classList.remove('d-thumb--active'); });
            thumb.classList.add('d-thumb--active');

            switchImage(src);
        });

        // Keyboard: Enter / Space
        thumb.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                thumb.click();
            }
        });
    });

    /* ----------------------------------------------------------------
       4. PEMILIH WARNA — terhubung langsung ke galeri utama
       ----------------------------------------------------------------
       colorVariants: mapping data-color-key → array foto.
       Indeks [0] = foto utama yang ditampilkan saat warna dipilih.
       Tambahkan path gambar nyata saat aset tiap warna tersedia.
       Selama foto belum ada, kunci "fallback" dipakai agar galeri
       tetap menampilkan gambar tanpa error.
    ---------------------------------------------------------------- */
    var COLOR_VARIANTS = {
        /*
         * FORMAT TIAP ENTRI:
         *   key        : nilai data-color-key pada tombol swatch
         *   hero       : path gambar utama yang tampil di galeri besar
         *   thumbs     : array path untuk 4 thumbnail (opsional)
         *                Jika thumbs tidak diisi, thumbnail lama dipertahankan.
         *
         * CARA MENAMBAH FOTO WARNA BARU:
         *   1. Letakkan file gambar di folder Img/Mobil_New/<nama-mobil>/
         *   2. Tambahkan key baru atau ganti nilai 'hero' di bawah.
         *   3. Tidak perlu mengubah HTML sama sekali.
         */
        gold: {
            hero: 'Img/Mobil_New/mazzda/WhatsApp Image 2026-11-19 at 10.26.15.jpeg',
            thumbs: [
                'Img/Mobil_New/mazzda/WhatsApp Image 2026-11-19 at 10.26.15.jpeg',
                'Img/Mobil_New/mazzda/Mazda MX5 ND.png',
                'Img/Mobil_New/mazzda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0965.webp',
                'Img/Mobil_New/mazzda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0830.webp'
            ]
        },
        gray: {
            /* Ganti dengan foto varian abu-abu saat tersedia */
            hero: 'Img/Mobil_New/mazzda/Mazda MX5 ND.png',
            thumbs: [
                'Img/Mobil_New/mazzda/Mazda MX5 ND.png',
                'Img/Mobil_New/mazzda/WhatsApp Image 2026-11-19 at 10.26.15.jpeg',
                'Img/Mobil_New/mazzda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0011.webp',
                'Img/Mobil_New/mazzda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0353.webp'
            ]
        },
        black: {
            /* Ganti dengan foto varian hitam saat tersedia */
            hero: 'Img/Mobil_New/mazzda/Mazda RX7 FD.png',
            thumbs: [
                'Img/Mobil_New/mazzda/Mazda RX7 FD.png',
                'Img/Mobil_New/mazzda/Mazda RX8.png',
                'Img/Mobil_New/mazzda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0502.webp',
                'Img/Mobil_New/mazzda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0534.webp'
            ]
        },
        white: {
            /* Ganti dengan foto varian putih saat tersedia */
            hero: 'Img/Mobil_New/mazzda/Mazda3 hatchback.png',
            thumbs: [
                'Img/Mobil_New/mazzda/Mazda3 hatchback.png',
                'Img/Mobil_New/mazzda/WhatsApp Image 2026-11-19 at 10.26.15.jpeg',
                'Img/Mobil_New/mazzda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0549.webp',
                'Img/Mobil_New/mazzda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0913.webp'
            ]
        },
        blue: {
            /* Ganti dengan foto varian biru saat tersedia */
            hero: 'Img/Mobil_New/mazzda/Mazda_Cosmo_Sport_110S_png._1967_Mazda_Cosmo_110_Sport-23.png',
            thumbs: [
                'Img/Mobil_New/mazzda/Mazda_Cosmo_Sport_110S_png._1967_Mazda_Cosmo_110_Sport-23.png',
                'Img/Mobil_New/mazzda/Mazda MX5 ND.png',
                'Img/Mobil_New/mazzda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0830.webp',
                'Img/Mobil_New/mazzda/Interior Mazda MX5/usnpx-26mazdamiata-jmv-0965.webp'
            ]
        }
    };

    /* Fallback jika key tidak ditemukan — pakai entri 'gold' */
    function getVariant(key) {
        return COLOR_VARIANTS[key] || COLOR_VARIANTS['gold'];
    }

    /* Update thumbnail strip sesuai varian warna yang dipilih */
    function updateThumbs(variant) {
        var thumbEls  = document.querySelectorAll('.d-thumb');
        var newSrcs   = variant.thumbs;
        if (!newSrcs || !newSrcs.length) return;

        thumbEls.forEach(function (thumb, i) {
            var src = newSrcs[i] || newSrcs[0];
            thumb.setAttribute('data-src', src);
            var img = thumb.querySelector('img');
            if (img) img.src = src;

            /* Aktifkan thumbnail pertama, nonaktifkan sisanya */
            if (i === 0) {
                thumb.classList.add('d-thumb--active');
            } else {
                thumb.classList.remove('d-thumb--active');
            }
        });
    }

    var swatches  = document.querySelectorAll('.d-swatch');
    var colorName = document.getElementById('colorName');

    swatches.forEach(function (swatch) {
        swatch.addEventListener('click', function () {
            var key     = swatch.getAttribute('data-color-key') || 'gold';
            var name    = swatch.getAttribute('data-name') || '';
            var variant = getVariant(key);

            /* — Ring aktif — */
            swatches.forEach(function (s) {
                s.classList.remove('d-swatch--active');
                s.setAttribute('aria-checked', 'false');
            });
            swatch.classList.add('d-swatch--active');
            swatch.setAttribute('aria-checked', 'true');

            /* — Nama warna: fade-out → ganti teks → fade-in — */
            if (colorName) {
                colorName.style.transition = 'opacity 0.18s ease';
                colorName.style.opacity    = '0';
                setTimeout(function () {
                    colorName.textContent   = name;
                    colorName.style.opacity = '1';
                }, 190);
            }

            /* — Galeri utama: crossfade ke foto hero varian — */
            switchImage(variant.hero);

            /* — Thumbnail strip: ganti ke set foto varian — */
            updateThumbs(variant);
        });
    });

    /* ----------------------------------------------------------------
       5. SCROLL REVEAL — sr-item dengan stagger
       IntersectionObserver: unobserve setelah elemen muncul sekali.
    ---------------------------------------------------------------- */
    function initScrollReveal() {
        var items = document.querySelectorAll('.sr-item');
        if (!items.length) return;

        if (!motionOK) {
            items.forEach(function (el) {
                el.classList.add('is-visible');
            });
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
                obs.unobserve(entry.target); // hemat memori
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -6% 0px'
        });

        items.forEach(function (el) { observer.observe(el); });
    }

    /* ----------------------------------------------------------------
       6. NUMBER COUNTER — angka naik saat kartu highlight masuk layar
       Mendukung integer dan desimal (data-decimal="1").
    ---------------------------------------------------------------- */
    function easeOut(t) {
        // ease-out cubic — terasa berat di akhir seperti pintu mobil Eropa
        return 1 - Math.pow(1 - t, 3);
    }

    function animateCounter(el) {
        var target   = parseFloat(el.getAttribute('data-target') || '0');
        var suffix   = el.getAttribute('data-suffix') || '';
        var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
        var duration = 1400; // ms
        var start    = null;

        function step(ts) {
            if (!start) start = ts;
            var elapsed  = ts - start;
            var progress = Math.min(elapsed / duration, 1);
            var value    = easeOut(progress) * target;

            el.textContent = value.toFixed(decimals) + suffix;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target.toFixed(decimals) + suffix;
            }
        }

        requestAnimationFrame(step);
    }

    function initCounters() {
        var counters = document.querySelectorAll('.d-counter');
        if (!counters.length) return;

        if (!motionOK) {
            counters.forEach(function (el) {
                var target   = parseFloat(el.getAttribute('data-target') || '0');
                var suffix   = el.getAttribute('data-suffix') || '';
                var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
                el.textContent = target.toFixed(decimals) + suffix;
            });
            return;
        }

        if (!('IntersectionObserver' in window)) {
            counters.forEach(function (el) {
                var target   = parseFloat(el.getAttribute('data-target') || '0');
                var suffix   = el.getAttribute('data-suffix') || '';
                var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
                el.textContent = target.toFixed(decimals) + suffix;
            });
            return;
        }

        var counterObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                animateCounter(entry.target);
                obs.unobserve(entry.target); // counter hanya berjalan sekali
            });
        }, { threshold: 0.4 });

        counters.forEach(function (el) { counterObserver.observe(el); });
    }

    /* ----------------------------------------------------------------
       7. TOMBOL — efek tekan scale(0.98) via JS (fallback :active)
       Diterapkan ke semua .d-btn dan .d-promo-card__btn secara global.
    ---------------------------------------------------------------- */
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

    /* ----------------------------------------------------------------
       8. REKOMENDASI — tombol panah (dekoratif, bisa diperluas)
    ---------------------------------------------------------------- */
    var recoPrev = document.getElementById('recoPrev');
    var recoNext = document.getElementById('recoNext');
    var recoGrid = document.querySelector('.d-reco__grid');

    if (recoPrev && recoNext && recoGrid) {
        // Scroll kartu rekomendasi kiri/kanan (opsional di mobile)
        recoNext.addEventListener('click', function () {
            recoGrid.scrollBy({ left: 320, behavior: 'smooth' });
        });
        recoPrev.addEventListener('click', function () {
            recoGrid.scrollBy({ left: -320, behavior: 'smooth' });
        });
    }

    /* ----------------------------------------------------------------
       9. INIT — jalankan semua setelah DOM siap
    ---------------------------------------------------------------- */
    document.addEventListener('DOMContentLoaded', function () {
        initScrollReveal();
        initCounters();
        initButtonPress();

        /* Ambil id mobil dari URL dan pasang ke link "Pesan Unit" */
        var params  = new URLSearchParams(window.location.search);
        var carId   = params.get('car');
        if (carId) {
            sessionStorage.setItem('id_mobil', carId);
            var btnPesan = document.getElementById('btnPesanUnit');
            if (btnPesan) btnPesan.href = 'pembayaran.xhtml?car=' + carId;
        }
    });

}());

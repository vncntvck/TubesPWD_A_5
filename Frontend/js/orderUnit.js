/* ================================================================
   CARIEZ — orderUnit.js
   Loads and locks the selected vehicle for the booking flow.
   ================================================================ */
(function () {
    'use strict';

    var params = new URLSearchParams(window.location.search);
    var idParam = params.get('car') || '';
    var carId = /^\d+$/.test(idParam) ? parseInt(idParam, 10) : 0;
    var apiBase = new URL('../backend/api/', window.location.href).href;
    var fallbackImage = 'Img/mobil_homepage.jpg';
    var biayaAdmin = 2500000;
    var persentaseBooking = 0.20;
    var state = {
        id: carId,
        data: null,
        totalHarga: null,
        uangMuka: null,
        ready: null
    };

    function setText(id, value) {
        var element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function formatRupiah(value) {
        var amount = Number(value);
        return Number.isFinite(amount)
            ? 'Rp ' + amount.toLocaleString('id-ID')
            : 'Belum tersedia';
    }

    function formatSpec(value, unit) {
        if (value === null || value === undefined || String(value).trim() === '') {
            return 'Belum tersedia';
        }
        var number = Number(value);
        return (Number.isFinite(number) ? number.toLocaleString('id-ID') : value) + unit;
    }

    function showError(message) {
        setText('footMsg', message);
        setText('formStatus', message);
        var next = document.getElementById('nextBtn');
        if (next) {
            next.setAttribute('aria-disabled', 'true');
            next.setAttribute('tabindex', '-1');
            next.removeAttribute('href');
        }
        var save = document.getElementById('saveDataButton');
        if (save) save.disabled = true;
    }

    function setImage(image, path, alt) {
        if (!image) return;
        var safePath = typeof path === 'string' ? path.replace(/\\/g, '/') : '';
        if (!safePath || safePath.indexOf('..') !== -1 || /^(?:[a-z]+:|\/)/i.test(safePath)) {
            safePath = fallbackImage;
        }
        image.alt = alt;
        image.onerror = function () {
            image.onerror = null;
            image.src = fallbackImage;
        };
        image.src = safePath;
    }

    function renderVehicle(vehicle) {
        var nama = [vehicle.merek, vehicle.model].filter(Boolean).join(' ') || 'Mobil #' + vehicle.id_mobil;
        var namaLengkap = [nama, vehicle.varian].filter(Boolean).join(' ');
        var subtitle = [vehicle.varian, vehicle.jenis_transmisi].filter(Boolean).join(' · ');
        var harga = Number(vehicle.harga);
        if (!Number.isFinite(harga) || harga <= 0) {
            throw new Error('Harga unit belum tersedia di database.');
        }

        var totalHarga = harga + biayaAdmin;
        var uangMuka = Math.round(totalHarga * persentaseBooking);

        setText('orderCarName', nama);
        setText('orderCarSubtitle', subtitle || 'Informasi varian belum tersedia');
        setText('orderCarEngine', formatSpec(vehicle.kapasitas_mesin, ' cc'));
        setText('orderCarPower', formatSpec(vehicle.tenaga, ' HP'));
        setText('orderCarTorque', formatSpec(vehicle.torsi, ' Nm'));
        setText('orderOtr', formatRupiah(harga));
        setText('orderAdmin', formatRupiah(biayaAdmin));
        setText('orderSubtotal', formatRupiah(totalHarga));
        setText('orderDownPayment', formatRupiah(uangMuka));
        setText('orderBookingFee', formatRupiah(uangMuka));

        setImage(document.getElementById('orderCarImage'), vehicle.foto_utama, namaLengkap);

        var carParam = encodeURIComponent(carId);
        var next = document.getElementById('nextBtn');
        if (next) {
            next.href = 'data_pembayaran.xhtml?car=' + carParam;
            next.removeAttribute('aria-disabled');
            next.removeAttribute('tabindex');
        }
        state.data = vehicle;
        state.totalHarga = totalHarga;
        state.uangMuka = uangMuka;
        sessionStorage.setItem('id_mobil', String(carId));
        sessionStorage.setItem('nama_mobil', namaLengkap);
        sessionStorage.setItem('harga_mobil', String(harga));
        sessionStorage.setItem('total_harga', String(totalHarga));
        sessionStorage.setItem('uang_muka', String(uangMuka));

        var save = document.getElementById('saveDataButton');
        if (save) save.disabled = false;
        return state;
    }

    if (!carId || carId < 1) {
        window.location.replace('catalog.xhtml');
        return;
    }

    document.querySelectorAll('[data-order-payment-link]').forEach(function (link) {
        link.href = 'pembayaran.xhtml?car=' + encodeURIComponent(carId);
    });

    state.ready = fetch(apiBase + 'detail_mobil.php?id=' + encodeURIComponent(carId))
        .then(function (response) {
            if (response.status === 404 || response.status === 400) {
                window.location.replace('catalog.xhtml');
                return null;
            }
            if (!response.ok) throw new Error('Data unit gagal dimuat.');
            return response.json();
        })
        .then(function (result) {
            if (!result) return null;
            if (!result.status || !result.data ||
                String(result.data.id_mobil) !== String(carId)) {
                window.location.replace('catalog.xhtml');
                return null;
            }
            return renderVehicle(result.data);
        })
        .catch(function (error) {
            showError(error.message || 'Data unit gagal dimuat. Coba muat ulang halaman.');
            return null;
        });

    window.orderUnit = state;
}());

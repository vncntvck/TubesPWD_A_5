/* ================================================================
   CARIEZ — ringkasanPembayaran.js
   Loads the exact vehicle and transaction passed in the order URL.
   ================================================================ */
function initializeOrderHistoryPage() {
    var refreshButton = document.getElementById('refreshOrder');
    var finishButton = document.getElementById('finishOrder');
    var lastUpdated = document.getElementById('lastUpdated');
    var orderMessage = document.getElementById('orderMessage');
    var params = new URLSearchParams(window.location.search);
    var orderParam = params.get('order') || '';
    var carParam = params.get('car') || '';
    var idTransaksi = /^\d+$/.test(orderParam) ? parseInt(orderParam, 10) : 0;
    var idMobil = /^\d+$/.test(carParam) ? parseInt(carParam, 10) : 0;
    var apiBase = new URL('../backend/api/', window.location.href).href;

    if (!idTransaksi || !idMobil) {
        window.location.replace('catalog.xhtml');
        return;
    }

    sessionStorage.setItem('id_transaksi', String(idTransaksi));
    sessionStorage.setItem('id_mobil', String(idMobil));

    function formatRupiah(value) {
        var amount = Number(value);
        return Number.isFinite(amount) ? 'Rp ' + amount.toLocaleString('id-ID') : 'Belum tersedia';
    }

    function setText(id, value) {
        var element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function formatSpec(value, unit) {
        if (value === null || value === undefined || String(value).trim() === '') {
            return 'Belum tersedia';
        }
        var number = Number(value);
        return (Number.isFinite(number) ? number.toLocaleString('id-ID') : value) + unit;
    }

    function setImage(vehicle) {
        var image = document.getElementById('orderCarImage');
        if (!image) return;
        var path = typeof vehicle.foto_utama === 'string'
            ? vehicle.foto_utama.replace(/\\/g, '/')
            : '';
        if (!path || path.indexOf('..') !== -1 || /^(?:[a-z]+:|\/)/i.test(path)) {
            path = 'Img/unit-belum-tersedia.svg';
        }
        image.alt = [vehicle.merek, vehicle.model].filter(Boolean).join(' ');
        image.onerror = function () {
            image.onerror = null;
            image.src = 'Img/unit-belum-tersedia.svg';
        };
        image.src = path;
    }

    function updateSummary(transaction, vehicle) {
        if (String(transaction.id_mobil) !== String(idMobil) ||
            String(vehicle.id_mobil) !== String(idMobil)) {
            window.location.replace('catalog.xhtml');
            return false;
        }

        var nama = [vehicle.merek, vehicle.model, vehicle.varian].filter(Boolean).join(' ');
        var subtotal = Number(transaction.total_harga);
        var hargaOtr = Number(vehicle.harga);
        var uangMuka = Number(transaction.uang_muka);
        if (!Number.isFinite(subtotal) || !Number.isFinite(hargaOtr) || !Number.isFinite(uangMuka)) {
            throw new Error('Ringkasan biaya pesanan tidak valid.');
        }

        setText('orderCarName', nama || 'Mobil #' + idMobil);
        setText('orderCarSubtitle', [vehicle.varian, vehicle.jenis_transmisi].filter(Boolean).join(' · ') || 'Informasi varian belum tersedia');
        setText('orderCarEngine', formatSpec(vehicle.kapasitas_mesin, ' cc'));
        setText('orderCarPower', formatSpec(vehicle.tenaga, ' HP'));
        setText('orderCarTorque', formatSpec(vehicle.torsi, ' Nm'));
        setText('orderOtr', formatRupiah(hargaOtr));
        setText('orderAdmin', formatRupiah(Math.max(0, subtotal - hargaOtr)));
        setText('orderSubtotal', formatRupiah(subtotal));
        setText('orderDownPayment', formatRupiah(uangMuka));
        setText('orderReference', 'PESANAN AKTIF · CRZ-' + String(idTransaksi).padStart(5, '0'));
        setText('orderSummaryName', nama || 'Mobil #' + idMobil);
        setText('lastUpdated', 'Status: ' + (transaction.status || 'Menunggu'));

        var statusElement = document.querySelector('.order-status');
        if (statusElement) statusElement.textContent = transaction.status || 'Menunggu';

        var methodElement = document.querySelector('.order-contact__box strong');
        if (methodElement && transaction.metode_pembayaran) {
            methodElement.textContent = transaction.metode_pembayaran;
        }

        setImage(vehicle);
        var paymentLink = document.getElementById('orderPaymentLink');
        if (paymentLink) paymentLink.href = 'pembayaran.xhtml?car=' + encodeURIComponent(idMobil);
        document.querySelectorAll('[data-order-car-link="data"]').forEach(function (link) {
            link.href = 'data_pembayaran.xhtml?car=' + encodeURIComponent(idMobil);
        });
        return true;
    }

    function muatTransaksi() {
        if (lastUpdated) lastUpdated.textContent = 'Memuat status pesanan...';

        return fetch(apiBase + 'transaksi.php?id=' + encodeURIComponent(idTransaksi))
            .then(function (response) {
                if (!response.ok) throw new Error('Data pesanan gagal dimuat.');
                return response.json();
            })
            .then(function (result) {
                if (!result.status || !result.data) throw new Error('Pesanan tidak ditemukan.');
                return fetch(apiBase + 'detail_mobil.php?id=' + encodeURIComponent(idMobil))
                    .then(function (response) {
                        if (!response.ok) throw new Error('Data unit gagal dimuat.');
                        return response.json();
                    })
                    .then(function (vehicleResult) {
                        if (!vehicleResult.status || !vehicleResult.data) {
                            throw new Error('Unit pesanan tidak ditemukan.');
                        }
                        updateSummary(result.data, vehicleResult.data);
                    });
            })
            .catch(function (error) {
                if (lastUpdated) lastUpdated.textContent = error.message || 'Gagal memuat status pesanan.';
            });
    }

    muatTransaksi();

    if (refreshButton) {
        refreshButton.addEventListener('click', muatTransaksi);
    }

    if (finishButton) {
        finishButton.addEventListener('click', function () {
            fetch(apiBase + 'transaksi.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_transaksi: idTransaksi, status: 'Selesai' })
            })
                .then(function (response) {
                    return response.json().then(function (result) {
                        if (!response.ok || !result.status) {
                            throw new Error(result.pesan || 'Gagal memperbarui status pesanan.');
                        }
                        sessionStorage.setItem('id_transaksi', String(idTransaksi));
                        sessionStorage.setItem('id_mobil', String(idMobil));
                        var query = new URLSearchParams({
                            order: String(idTransaksi),
                            car: String(idMobil)
                        });
                        window.location.assign('selesaiTransaksi.xhtml?' + query.toString());
                    });
                })
                .catch(function (error) {
                    if (orderMessage) orderMessage.textContent = error.message || 'Tidak dapat terhubung ke server.';
                });
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOrderHistoryPage);
} else {
    initializeOrderHistoryPage();
}

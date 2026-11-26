/* ================================================================
   CARIEZ — ringkasanPembayaran.js
   Memuat data transaksi dari session dan API backend.
   ================================================================ */
function initializeOrderHistoryPage() {
    var refreshButton = document.getElementById('refreshOrder');
    var finishButton  = document.getElementById('finishOrder');
    var lastUpdated   = document.getElementById('lastUpdated');
    var orderMessage  = document.getElementById('orderMessage');

    var apiBase = new URL('../backend/api/', window.location.href).href;

    /* Muat detail transaksi dari session */
    var idTransaksi = parseInt(sessionStorage.getItem('id_transaksi') || '0', 10);

    function formatWaktu() {
        return new Date().toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function muatTransaksi() {
        if (idTransaksi <= 0) {
            if (lastUpdated) lastUpdated.textContent = 'Status pesanan contoh (sesi belum tersambung)';
            return;
        }

        fetch(apiBase + 'transaksi.php?id=' + idTransaksi)
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (!res.status || !res.data) return;
                var t = res.data;

                /* Update status badge di panel */
                var statusEl = document.querySelector('.order-status');
                if (statusEl) statusEl.textContent = t.status || 'Menunggu';

                /* Update nomor pesanan */
                var nomorEl = document.querySelector('.order-panel__vehicle span');
                if (nomorEl) nomorEl.textContent = 'PESANAN AKTIF · CRZ-' + String(idTransaksi).padStart(5, '0');

                /* Update nama mobil */
                var mobilEl = document.querySelector('.order-panel__vehicle h3');
                if (mobilEl && t.merek) mobilEl.textContent = t.merek + ' ' + t.model + (t.varian ? ' ' + t.varian : '');

                /* Update metode pembayaran */
                var metodaEl = document.querySelector('.order-contact__box strong');
                if (metodaEl && t.metode_pembayaran) metodaEl.textContent = t.metode_pembayaran;

                if (lastUpdated) lastUpdated.textContent = 'Diperbarui: ' + formatWaktu();
            })
            .catch(function () {
                if (lastUpdated) lastUpdated.textContent = 'Gagal memuat status pesanan';
            });
    }

    muatTransaksi();

    if (refreshButton && lastUpdated) {
        refreshButton.addEventListener('click', function () {
            muatTransaksi();
            lastUpdated.textContent = 'Memperbarui...';
        });
    }

    if (finishButton) {
        finishButton.addEventListener('click', function () {
            if (idTransaksi > 0) {
                /* Update status ke Selesai */
                fetch(apiBase + 'transaksi.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_transaksi: idTransaksi, status: 'Selesai' })
                })
                    .then(function (r) { return r.json(); })
                    .then(function (res) {
                        if (orderMessage) {
                            orderMessage.textContent = res.status
                                ? 'Proses pesanan selesai. Terima kasih telah berbelanja di CARIEZ!'
                                : (res.pesan || 'Gagal mengupdate status.');
                        }
                    })
                    .catch(function () {
                        if (orderMessage) orderMessage.textContent = 'Tidak dapat terhubung ke server.';
                    });
            } else {
                if (orderMessage) orderMessage.textContent = 'Proses pesanan contoh ini sudah selesai. Terima kasih!';
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOrderHistoryPage);
} else {
    initializeOrderHistoryPage();
}

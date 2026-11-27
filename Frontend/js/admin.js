/* ================================================================
   CARIEZ Admin Dashboard — admin.js
   Single-page admin panel. Fetches data from backend API.
   ================================================================ */

(function () {
    'use strict';

    /* ---- API Base URL (relative to Frontend/) ---- */
    var API = new URL('../backend/api/', window.location.href).href;

    /* ---- Helpers ---- */
    function rupiah(angka) {
        if (!angka && angka !== 0) return '—';
        return 'Rp ' + Number(angka).toLocaleString('id-ID');
    }

    function tanggal(str) {
        if (!str) return '—';
        var d = new Date(str);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function safeText(val, fallback) {
        return (val !== null && val !== undefined && val !== '') ? val : (fallback || '—');
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }

    function el(id) { return document.getElementById(id); }

    /* ---- Toast ---- */
    var toastContainer = el('toastContainer');

    function showToast(message, type) {
        if (!toastContainer) return;
        type = type || 'info';
        var icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>'
        };
        var div = document.createElement('div');
        div.className = 'toast toast--' + type;
        div.innerHTML = (icons[type] || icons.info) + '<span>' + message + '</span>';
        toastContainer.appendChild(div);
        setTimeout(function () {
            div.style.opacity = '0';
            div.style.transition = 'opacity 0.3s ease';
            setTimeout(function () { div.remove(); }, 320);
        }, 3500);
    }

    /* ---- Badge builder ---- */
    function statusBadge(status) {
        var map = {
            'Tersedia':   'green',
            'Terjual':    'muted',
            'Diproses':   'blue',
            'Selesai':    'green',
            'Menunggu':   'yellow',
            'Dibatalkan': 'red',
            'Dikonfirmasi': 'green',
            'Ditolak':    'red',
            'Terverifikasi': 'green'
        };
        var cls = map[status] || 'muted';
        return '<span class="badge badge--' + cls + '">' + safeText(status) + '</span>';
    }

    function kondisiBadge(kondisi) {
        return kondisi === 'Baru'
            ? '<span class="badge badge--blue">' + kondisi + '</span>'
            : '<span class="badge badge--orange">' + kondisi + '</span>';
    }

    /* ============================================================
       NAVIGATION — Single Page App
       ============================================================ */
    var currentPage = 'dashboard';

    function navigate(page) {
        /* Deactivate all pages */
        document.querySelectorAll('.page').forEach(function (p) {
            p.classList.remove('is-active');
        });
        document.querySelectorAll('.sidebar__link').forEach(function (l) {
            l.classList.remove('is-active');
        });

        /* Activate target */
        var target = el('page-' + page);
        if (target) target.classList.add('is-active');

        var link = document.querySelector('.sidebar__link[data-page="' + page + '"]');
        if (link) link.classList.add('is-active');

        /* Update topbar title */
        var titles = {
            dashboard:   'Dashboard',
            mobil:       'Kelola Mobil',
            transaksi:   'Transaksi',
            pembayaran:  'Pembayaran',
            riwayat:     'Riwayat Servis',
            pengguna:   'Verifikasi KTP'
        };
        var topTitle = el('topbarTitle');
        if (topTitle) topTitle.textContent = titles[page] || page;

        currentPage = page;
        closeSidebar();

        /* Load data for the page */
        pageLoaders[page] && pageLoaders[page]();
    }

    /* ---- Sidebar links ---- */
    document.querySelectorAll('[data-page]').forEach(function (link) {
        link.addEventListener('click', function () {
            var page = link.getAttribute('data-page');
            if (page) navigate(page);
        });
    });

    /* ---- Mobile sidebar ---- */
    var sidebarEl  = el('sidebar');
    var sidebarOverlay = el('sidebarOverlay');
    var hamburger  = el('hamburger');

    function openSidebar() {
        if (sidebarEl) sidebarEl.classList.add('is-open');
        if (sidebarOverlay) sidebarOverlay.style.display = 'block';
    }

    function closeSidebar() {
        if (sidebarEl) sidebarEl.classList.remove('is-open');
        if (sidebarOverlay) sidebarOverlay.style.display = 'none';
    }

    if (hamburger) hamburger.addEventListener('click', openSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    /* ============================================================
       DASHBOARD PAGE
       ============================================================ */
    function loadDashboard() {
        /* Stats from mobil */
        fetch(API + 'mobil.php')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (!res.status) return;
                var stok = res.jumlah || 0;
                if (el('statStokMobil')) el('statStokMobil').textContent = stok;
            })
            .catch(function () {});

        /* Stats from transaksi */
        fetch(API + 'transaksi.php')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (!res.status || !Array.isArray(res.data)) return;
                var total    = res.data.length;
                var proses   = res.data.filter(function (t) { return t.status === 'Diproses'; }).length;
                var pendapatan = res.data
                    .filter(function (t) { return t.status === 'Selesai'; })
                    .reduce(function (acc, t) { return acc + Number(t.total_harga || 0); }, 0);

                if (el('statTotalTransaksi')) el('statTotalTransaksi').textContent = total;
                if (el('statDiproses'))      el('statDiproses').textContent       = proses;
                if (el('statPendapatan'))    el('statPendapatan').textContent      = rupiah(pendapatan);

                /* Recent transactions */
                var tbody = el('recentTransaksiBody');
                if (!tbody) return;
                tbody.innerHTML = '';
                var slice = res.data.slice(0, 6);
                if (slice.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="empty-state" style="padding:40px"><p>Belum ada transaksi</p></td></tr>';
                    return;
                }
                slice.forEach(function (t) {
                    tbody.insertAdjacentHTML('beforeend',
                        '<tr>' +
                        '<td><strong>#' + t.id_transaksi + '</strong></td>' +
                        '<td>' + safeText(t.username) + '</td>' +
                        '<td>' + safeText(t.merek) + ' ' + safeText(t.model) + '</td>' +
                        '<td>' + rupiah(t.total_harga) + '</td>' +
                        '<td>' + statusBadge(t.status) + '</td>' +
                        '</tr>'
                    );
                });
            })
            .catch(function () {});
    }

    /* ============================================================
       MOBIL PAGE
       ============================================================ */
    var daftarMobil = [];

    function loadMobil() {
        var tbody = el('mobilBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="8"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></td></tr>';

        fetch(API + 'mobil.php')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                daftarMobil = res.data || [];
                renderMobil(daftarMobil);
            })
            .catch(function () {
                tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><p>Gagal memuat data mobil.</p></td></tr>';
            });
    }

    function renderMobil(data) {
        var tbody = el('mobilBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>Tidak ada data mobil.</p></div></td></tr>';
            return;
        }

        data.forEach(function (m) {
            var imgSrc = m.foto_utama
                ? new URL(m.foto_utama.replace(/\\/g, '/'), window.location.href).href
                : '';
            tbody.insertAdjacentHTML('beforeend',
                '<tr>' +
                '<td><span class="td-muted">#' + m.id_mobil + '</span></td>' +
                '<td>' +
                (imgSrc ? '<img class="car-row-img" src="' + imgSrc + '" alt="" />' : '<div class="car-row-img" style="display:flex;align-items:center;justify-content:center;color:var(--text-muted)">?</div>') +
                '</td>' +
                '<td><div class="car-row-name">' + safeText(m.merek) + ' ' + safeText(m.model) + '</div><div class="car-row-sub">' + safeText(m.varian) + ' · ' + safeText(m.tahun_produksi) + '</div></td>' +
                '<td>' + kondisiBadge(m.kondisi || 'Bekas') + '</td>' +
                '<td>' + safeText(m.kategori) + '</td>' +
                '<td>' + rupiah(m.harga) + '</td>' +
                '<td>' + (m.kilometer ? Number(m.kilometer).toLocaleString('id-ID') + ' km' : '—') + '</td>' +
                '<td>' +
                '<div style="display:flex;gap:6px">' +
                '<button class="btn btn-secondary btn-sm" onclick="adminApp.editMobil(' + m.id_mobil + ')">Edit</button>' +
                '</div>' +
                '</td>' +
                '</tr>'
            );
        });
    }

    /* Filter mobil */
    var mobilSearch = el('mobilSearch');
    var mobilFilterKategori = el('mobilFilterKategori');

    function filterMobil() {
        var kata = mobilSearch ? mobilSearch.value.trim().toLowerCase() : '';
        var kategori = mobilFilterKategori ? mobilFilterKategori.value : 'all';
        var filtered = daftarMobil.filter(function (m) {
            var nama = (m.merek + ' ' + m.model + ' ' + m.varian).toLowerCase();
            var okKata = !kata || nama.includes(kata);
            var okKategori = kategori === 'all' || m.kategori === kategori;
            return okKata && okKategori;
        });
        renderMobil(filtered);
    }

    if (mobilSearch) mobilSearch.addEventListener('input', filterMobil);
    if (mobilFilterKategori) mobilFilterKategori.addEventListener('change', filterMobil);

    /* ============================================================
       TRANSAKSI PAGE
       ============================================================ */
    var daftarTransaksi = [];

    function loadTransaksi() {
        var tbody = el('transaksiBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></td></tr>';

        fetch(API + 'transaksi.php')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                daftarTransaksi = res.data || [];
                renderTransaksi(daftarTransaksi);
            })
            .catch(function () {
                tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>Gagal memuat data transaksi.</p></div></td></tr>';
            });
    }

    function renderTransaksi(data) {
        var tbody = el('transaksiBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>Tidak ada transaksi.</p></div></td></tr>';
            return;
        }

        data.forEach(function (t) {
            tbody.insertAdjacentHTML('beforeend',
                '<tr>' +
                '<td><strong>#' + t.id_transaksi + '</strong></td>' +
                '<td>' + safeText(t.username) + '<br><span class="td-muted">' + safeText(t.email) + '</span></td>' +
                '<td>' + safeText(t.merek) + ' ' + safeText(t.model) + '<br><span class="td-muted">' + safeText(t.varian) + '</span></td>' +
                '<td>' + rupiah(t.total_harga) + '</td>' +
                '<td>' + safeText(t.metode_pembayaran) + '</td>' +
                '<td>' + statusBadge(t.status) + '</td>' +
                '<td>' + tanggal(t.tanggal_transaksi) + '</td>' +
                '</tr>'
            );
        });
    }

    /* Filter transaksi */
    var transaksiSearch = el('transaksiSearch');
    var transaksiFilterStatus = el('transaksiFilterStatus');

    function filterTransaksi() {
        var kata   = transaksiSearch ? transaksiSearch.value.trim().toLowerCase() : '';
        var status = transaksiFilterStatus ? transaksiFilterStatus.value : 'all';
        var filtered = daftarTransaksi.filter(function (t) {
            var text = ((t.username || '') + ' ' + (t.merek || '') + ' ' + (t.model || '')).toLowerCase();
            return (!kata || text.includes(kata)) && (status === 'all' || t.status === status);
        });
        renderTransaksi(filtered);
    }

    if (transaksiSearch) transaksiSearch.addEventListener('input', filterTransaksi);
    if (transaksiFilterStatus) transaksiFilterStatus.addEventListener('change', filterTransaksi);

    /* ============================================================
       PEMBAYARAN PAGE
       ============================================================ */
    var daftarPembayaran = [];

    function loadPembayaran() {
        var tbody = el('pembayaranBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></td></tr>';

        fetch(API + 'pembayaran.php')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                daftarPembayaran = res.data || [];
                renderPembayaran(daftarPembayaran);
            })
            .catch(function () {
                tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Gagal memuat data pembayaran.</p></div></td></tr>';
            });
    }

    function renderPembayaran(data) {
        var tbody = el('pembayaranBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Tidak ada pembayaran.</p></div></td></tr>';
            return;
        }

        data.forEach(function (p) {
            tbody.insertAdjacentHTML('beforeend',
                '<tr>' +
                '<td><strong>#' + p.id_pembayaran + '</strong></td>' +
                '<td><span class="td-muted">#' + p.id_transaksi + '</span></td>' +
                '<td>' + safeText(p.username) + '</td>' +
                '<td>' + rupiah(p.jumlah_pembayaran) + '</td>' +
                '<td>' + safeText(p.metode_pembayaran) + '</td>' +
                '<td>' + statusBadge(p.status) + '</td>' +
                '</tr>'
            );
        });
    }

    var pembayaranFilterStatus = el('pembayaranFilterStatus');

    function filterPembayaran() {
        var status = pembayaranFilterStatus ? pembayaranFilterStatus.value : 'all';
        var filtered = status === 'all' ? daftarPembayaran : daftarPembayaran.filter(function (p) {
            return p.status === status;
        });
        renderPembayaran(filtered);
    }

    if (pembayaranFilterStatus) pembayaranFilterStatus.addEventListener('change', filterPembayaran);

    /* ============================================================
       VERIFIKASI KTP
       ============================================================ */
    var daftarKtp = [];
    var ktpFilterStatus = el('ktpFilterStatus');
    var ktpBody = el('ktpBody');

    function loadVerifikasiKtp() {
        if (!ktpBody) return;
        ktpBody.innerHTML = '<tr><td colspan="7"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></td></tr>';

        fetch(API + 'verifikasi_ktp.php', { credentials: 'same-origin' })
            .then(function (response) {
                return response.json().then(function (res) {
                    if (!response.ok || !res.status) {
                        throw new Error(res.pesan || 'Data KTP gagal dimuat.');
                    }
                    return res.data;
                });
            })
            .then(function (data) {
                daftarKtp = Array.isArray(data) ? data : [];
                filterVerifikasiKtp();
            })
            .catch(function (error) {
                ktpBody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>' +
                    escapeHtml(error.message || 'Data KTP gagal dimuat.') + '</p></div></td></tr>';
            });
    }

    function renderVerifikasiKtp(data) {
        if (!ktpBody) return;
        ktpBody.innerHTML = '';

        if (data.length === 0) {
            ktpBody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>Belum ada dokumen KTP.</p></div></td></tr>';
            return;
        }

        data.forEach(function (ktp) {
            var idPembeli = Number(ktp.id_pembeli);
            var viewLink = '<a class="btn btn-secondary btn-sm" href="' +
                API + 'lihat_ktp.php?id_pembeli=' + encodeURIComponent(idPembeli) +
                '" target="_blank" rel="noopener noreferrer">Lihat KTP</a>';
            var reviewActions = '';
            if (ktp.status_verifikasi === 'Menunggu') {
                reviewActions = '<button class="btn btn-primary btn-sm" data-ktp-id="' + idPembeli +
                    '" data-ktp-status="terverifikasi">Setujui</button>' +
                    ' <button class="btn btn-secondary btn-sm" data-ktp-id="' + idPembeli +
                    '" data-ktp-status="ditolak">Tolak</button>';
            }

            ktpBody.insertAdjacentHTML('beforeend',
                '<tr>' +
                '<td><strong>#' + idPembeli + '</strong></td>' +
                '<td>' + escapeHtml(safeText(ktp.nama_lengkap)) + '</td>' +
                '<td>' + escapeHtml(safeText(ktp.username)) + '<br><span class="td-muted">' +
                escapeHtml(safeText(ktp.email)) + '</span></td>' +
                '<td>' + escapeHtml(safeText(ktp.nik)) + '</td>' +
                '<td>' + viewLink + '</td>' +
                '<td>' + statusBadge(ktp.status_verifikasi) + '</td>' +
                '<td>' + reviewActions + '</td>' +
                '</tr>'
            );
        });
    }

    function filterVerifikasiKtp() {
        var status = ktpFilterStatus ? ktpFilterStatus.value : 'all';
        var filtered = status === 'all'
            ? daftarKtp
            : daftarKtp.filter(function (ktp) { return ktp.status_verifikasi === status; });
        renderVerifikasiKtp(filtered);
    }

    function updateStatusKtp(button) {
        var idPembeli = Number(button.getAttribute('data-ktp-id'));
        var status = button.getAttribute('data-ktp-status');
        if (!idPembeli || !status) return;
        button.disabled = true;

        fetch(API + 'verifikasi_ktp.php', {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_pembeli: idPembeli, status: status })
        })
            .then(function (response) {
                return response.json().then(function (res) {
                    if (!response.ok || !res.status) {
                        throw new Error(res.pesan || 'Status KTP gagal diperbarui.');
                    }
                    return res;
                });
            })
            .then(function (res) {
                showToast(res.pesan || 'Status KTP diperbarui.', 'success');
                loadVerifikasiKtp();
            })
            .catch(function (error) {
                showToast(error.message || 'Status KTP gagal diperbarui.', 'error');
                button.disabled = false;
            });
    }

    if (ktpFilterStatus) ktpFilterStatus.addEventListener('change', filterVerifikasiKtp);
    if (ktpBody) {
        ktpBody.addEventListener('click', function (event) {
            var button = event.target.closest('button[data-ktp-status]');
            if (button) updateStatusKtp(button);
        });
    }

    /* ============================================================
       RIWAYAT SERVIS PAGE
       ============================================================ */
    var daftarRiwayat = [];

    function loadRiwayat() {
        var tbody = el('riwayatBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></td></tr>';

        fetch(API + 'riwayat_servis.php')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                daftarRiwayat = res.data || [];
                renderRiwayat(daftarRiwayat);
            })
            .catch(function () {
                tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Gagal memuat riwayat servis.</p></div></td></tr>';
            });
    }

    function renderRiwayat(data) {
        var tbody = el('riwayatBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Tidak ada riwayat servis.</p></div></td></tr>';
            return;
        }

        data.forEach(function (r) {
            tbody.insertAdjacentHTML('beforeend',
                '<tr>' +
                '<td><strong>#' + r.id_riwayat_servis + '</strong></td>' +
                '<td><span class="td-muted">#' + r.id_mobil + '</span></td>' +
                '<td>' + tanggal(r.tanggal_servis) + '</td>' +
                '<td>' + safeText(r.deskripsi_servis) + '</td>' +
                '<td>' + rupiah(r.biaya_servis) + '</td>' +
                '<td>' + safeText(r.nama_bengkel) + '</td>' +
                '</tr>'
            );
        });
    }

    /* ============================================================
       TAMBAH RIWAYAT SERVIS — Modal
       ============================================================ */
    var modalTambahRiwayat = el('modalTambahRiwayat');

    function bukaModalRiwayat() {
        if (modalTambahRiwayat) modalTambahRiwayat.classList.add('is-open');
    }

    function tutupModalRiwayat() {
        if (modalTambahRiwayat) {
            modalTambahRiwayat.classList.remove('is-open');
            var form = el('formTambahRiwayat');
            if (form) form.reset();
        }
    }

    var btnTambahRiwayat = el('btnTambahRiwayat');
    if (btnTambahRiwayat) btnTambahRiwayat.addEventListener('click', bukaModalRiwayat);

    var btnTutupModalRiwayat = el('btnTutupModalRiwayat');
    if (btnTutupModalRiwayat) btnTutupModalRiwayat.addEventListener('click', tutupModalRiwayat);

    var btnBatalRiwayat = el('btnBatalRiwayat');
    if (btnBatalRiwayat) btnBatalRiwayat.addEventListener('click', tutupModalRiwayat);

    var formTambahRiwayat = el('formTambahRiwayat');
    if (formTambahRiwayat) {
        formTambahRiwayat.addEventListener('submit', function (e) {
            e.preventDefault();
            var payload = {
                id_mobil:         Number(el('rwIdMobil').value),
                tanggal_servis:   el('rwTanggal').value,
                deskripsi_servis: el('rwDeskripsi').value,
                biaya_servis:     Number(el('rwBiaya').value),
                nama_bengkel:     el('rwBengkel').value
            };

            fetch(API + 'riwayat_servis.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res.status) {
                        showToast('Riwayat servis berhasil ditambahkan.', 'success');
                        tutupModalRiwayat();
                        loadRiwayat();
                    } else {
                        showToast(res.pesan || 'Gagal menambahkan riwayat servis.', 'error');
                    }
                })
                .catch(function () { showToast('Koneksi gagal.', 'error'); });
        });
    }

    /* ============================================================
       EDIT MOBIL (placeholder — bisa dikembangkan)
       ============================================================ */
    function editMobil(idMobil) {
        showToast('Fitur edit mobil #' + idMobil + ' akan segera tersedia.', 'info');
    }

    /* ============================================================
       PAGE LOADERS MAP
       ============================================================ */
    var pageLoaders = {
        dashboard:  loadDashboard,
        mobil:      loadMobil,
        transaksi:  loadTransaksi,
        pembayaran: loadPembayaran,
        riwayat:    loadRiwayat,
        pengguna:   loadVerifikasiKtp
    };

    /* ============================================================
       LOGOUT
       ============================================================ */
    var btnLogout = el('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function () {
            fetch(new URL('../backend/api/logout.php', window.location.href).href, {
                method: 'POST',
                credentials: 'same-origin'
            }).finally(function () {
                window.location.href = 'login.xhtml';
            });
        });
    }

    /* ---- Expose globally for inline onclick ---- */
    window.adminApp = { editMobil: editMobil };

    /* ---- INIT ---- */
    navigate('dashboard');

}());

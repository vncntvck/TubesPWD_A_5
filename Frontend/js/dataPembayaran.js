/* ================================================================
   CARIEZ — dataPembayaran.js
   Menyambungkan form data pemesan ke backend transaksi API.
   ================================================================ */
function initializeOrdererDataPage() {
    var saveButton    = document.getElementById('saveDataButton');
    var formStatus    = document.getElementById('formStatus');
    var requiredFields = document.querySelectorAll('.data-card [required]');

    if (!saveButton || !formStatus) return;

    var apiBase = new URL('../backend/api/', window.location.href).href;

    saveButton.addEventListener('click', function () {
        /* 1. Validasi semua field wajib */
        for (var i = 0; i < requiredFields.length; i++) {
            if (!requiredFields[i].checkValidity()) {
                requiredFields[i].reportValidity();
                return;
            }
        }

        /* 2. Kumpulkan data form */
        var fullName    = (document.getElementById('fullName')    || {}).value || '';
        var nik         = (document.getElementById('nik')         || {}).value || '';
        var ktpFile     = document.getElementById('ktpFile');
        var whatsapp    = (document.getElementById('whatsapp')    || {}).value || '';
        var email       = (document.getElementById('email')       || {}).value || '';
        var birthDate   = (document.getElementById('birthDate')   || {}).value || '';
        var marital     = (document.getElementById('maritalStatus')|| {}).value || '';
        var street      = (document.getElementById('streetAddress')|| {}).value || '';
        var province    = (document.getElementById('province')    || {}).value || '';
        var city        = (document.getElementById('city')        || {}).value || '';
        var district    = (document.getElementById('district')    || {}).value || '';
        var postal      = (document.getElementById('postalCode')  || {}).value || '';
        var occupation  = (document.getElementById('occupation')  || {}).value || '';
        var company     = (document.getElementById('company')     || {}).value || '';
        var income      = (document.getElementById('monthlyIncome')|| {}).value || '';
        var duration    = (document.getElementById('employmentDuration')|| {}).value || '';

        /* 3. Ambil id_mobil dari sessionStorage / URL param (dipassing dari detail.xhtml) */
        var params      = new URLSearchParams(window.location.search);
        var idMobil     = parseInt(params.get('car') || sessionStorage.getItem('id_mobil') || '0', 10);
        var idPengguna  = parseInt(sessionStorage.getItem('id_pengguna') || '0', 10);
        var metodeBayar = sessionStorage.getItem('metode_pembayaran') || 'Virtual Account';
        var totalHarga  = parseFloat(sessionStorage.getItem('total_harga') || '0');
        var uangMuka    = parseFloat(sessionStorage.getItem('uang_muka') || '0');

        if (idPengguna <= 0) {
            formStatus.textContent = 'Silakan masuk ke akun sebelum mengirim data dan KTP.';
            formStatus.style.color = '#ef4444';
            return;
        }

        if (idMobil <= 0 || !ktpFile || !ktpFile.files || !ktpFile.files[0]) {
            formStatus.textContent = 'Data kendaraan atau file KTP belum tersedia.';
            formStatus.style.color = '#ef4444';
            return;
        }

        saveButton.disabled = true;
        formStatus.textContent = 'Mengunggah KTP dan menyimpan data...';
        formStatus.style.color = '';

        var alamat = street + ', ' + district + ', ' + city + ', ' + province + ' ' + postal;
        var dataKtp = new FormData();
        dataKtp.append('nama_lengkap', fullName);
        dataKtp.append('nomor_ktp', nik);
        dataKtp.append('alamat', alamat);
        dataKtp.append('bukti_ktp', ktpFile.files[0]);

        var payload = {
            id_pengguna:       idPengguna,
            id_mobil:          idMobil,
            metode_pembayaran: metodeBayar,
            total_harga:       totalHarga,
            uang_muka:         uangMuka,
            status:            'Menunggu',
            catatan_pemesan:   JSON.stringify({
                whatsapp: whatsapp, email: email,
                birthDate: birthDate, marital: marital,
                alamat: alamat,
                occupation: occupation, company: company, income: income, duration: duration
            })
        };

        var ktpBerhasilDiunggah = false;
        fetch(apiBase + 'upload_ktp.php', {
            method: 'POST',
            credentials: 'same-origin',
            body: dataKtp
        })
            .then(function (response) {
                return response.json().then(function (res) {
                    if (!response.ok || !res.status) {
                        throw new Error(res.pesan || 'KTP gagal diunggah.');
                    }
                    ktpBerhasilDiunggah = true;
                    return fetch(apiBase + 'transaksi.php', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                });
            })
            .then(function (response) {
                return response.json().then(function (res) {
                    if (!response.ok || !res.status) {
                        throw new Error(res.pesan || 'Transaksi gagal disimpan.');
                    }
                    sessionStorage.setItem('id_transaksi', res.data.id_transaksi);
                    formStatus.textContent = 'KTP dan data berhasil disimpan. Mengalihkan ke ringkasan pesanan...';
                    formStatus.style.color = '#22c55e';
                    setTimeout(function () {
                        window.location.assign('ringkasanPembayaran.xhtml');
                    }, 1200);
                });
            })
            .catch(function (error) {
                formStatus.textContent = ktpBerhasilDiunggah
                    ? 'KTP sudah tersimpan, tetapi transaksi gagal: ' + error.message
                    : error.message;
                formStatus.style.color = '#ef4444';
                saveButton.disabled = false;
            });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOrdererDataPage);
} else {
    initializeOrdererDataPage();
}

/* ================================================================
   CARIEZ — pembayaran.js
   Menyambungkan halaman pembayaran ke session storage dan flow.
   ================================================================ */
function initializePaymentPage() {
    var menuToggle = document.getElementById('menuToggle');
    var navMenu    = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-controls', 'navMenu');

        menuToggle.addEventListener('click', function () {
            var isOpen = navMenu.classList.toggle('buka');
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        var menuLinks = navMenu.querySelectorAll('a');
        for (var i = 0; i < menuLinks.length; i++) {
            menuLinks[i].addEventListener('click', function () {
                navMenu.classList.remove('buka');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        }
    }

    /* ---- Metode Pembayaran ---- */
    var paymentOptions = document.querySelectorAll('input[name="method"]');
    var summaryMethod  = document.getElementById('sumMethod');
    var paymentMethodLabels = {
        va:       'Virtual Account',
        transfer: 'Transfer Bank',
        qris:     'QRIS Instan'
    };

    function updateSelectedMethod(option) {
        var methodLabel = paymentMethodLabels[option.value];
        if (!summaryMethod || !methodLabel) return;
        summaryMethod.textContent = methodLabel;

        for (var j = 0; j < paymentOptions.length; j++) {
            paymentOptions[j].parentNode.classList.toggle('is-active', paymentOptions[j].checked);
        }

        /* Simpan metode ke session */
        sessionStorage.setItem('metode_pembayaran', methodLabel);
    }

    for (var k = 0; k < paymentOptions.length; k++) {
        paymentOptions[k].addEventListener('change', function () {
            updateSelectedMethod(this);
        });
    }

    var initialOption = document.querySelector('input[name="method"]:checked');
    if (initialOption) updateSelectedMethod(initialOption);

    /* ---- Simpan info kendaraan dari URL param ---- */
    var params  = new URLSearchParams(window.location.search);
    var carId   = params.get('car');
    if (carId) sessionStorage.setItem('id_mobil', carId);

    /* Ambil total dari halaman (harga OTR) */
    var totalEl = document.getElementById('totalAmount');
    if (totalEl) {
        var hargaText = totalEl.textContent.replace(/[^0-9]/g, '');
        if (hargaText) sessionStorage.setItem('uang_muka', hargaText);
    }

    /* Link ke data_pembayaran — sertakan car param */
    var nextBtn = document.getElementById('nextBtn');
    if (nextBtn && carId) {
        nextBtn.href = 'data_pembayaran.xhtml?car=' + carId;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePaymentPage);
} else {
    initializePaymentPage();
}
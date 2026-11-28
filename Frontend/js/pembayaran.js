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

}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePaymentPage);
} else {
    initializePaymentPage();
}
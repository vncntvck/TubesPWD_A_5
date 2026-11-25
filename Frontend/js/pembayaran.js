function initializePaymentPage() {
    var menuToggle = document.getElementById("menuToggle");
    var navMenu = document.getElementById("navMenu");

    if (menuToggle && navMenu) {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-controls", "navMenu");

        menuToggle.addEventListener("click", function () {
            var isOpen = navMenu.classList.toggle("buka");
            menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        var menuLinks = navMenu.querySelectorAll("a");
        for (var index = 0; index < menuLinks.length; index++) {
            menuLinks[index].addEventListener("click", function () {
                navMenu.classList.remove("buka");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        }
    }

    var paymentOptions = document.querySelectorAll('input[name="method"]');
    var summaryMethod = document.getElementById("sumMethod");
    var paymentMethodLabels = {
        va: "Virtual Account BCA",
        transfer: "Transfer Bank",
        qris: "QRIS Instan"
    };

    function updateSelectedMethod(option) {
        var methodLabel = paymentMethodLabels[option.value];
        if (!summaryMethod || !methodLabel) return;

        summaryMethod.textContent = methodLabel;
        for (var optionIndex = 0; optionIndex < paymentOptions.length; optionIndex++) {
            paymentOptions[optionIndex].parentNode.classList.toggle(
                "is-active",
                paymentOptions[optionIndex].checked
            );
        }
    }

    for (var optionIndex = 0; optionIndex < paymentOptions.length; optionIndex++) {
        paymentOptions[optionIndex].addEventListener("change", function () {
            updateSelectedMethod(this);
        });
    }

    var initialPaymentOption = document.querySelector('input[name="method"]:checked');
    if (initialPaymentOption) {
        updateSelectedMethod(initialPaymentOption);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePaymentPage);
} else {
    initializePaymentPage();
}
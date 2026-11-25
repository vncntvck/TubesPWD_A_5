function initializeOrderHistoryPage() {
    var refreshButton = document.getElementById("refreshOrder");
    var finishButton = document.getElementById("finishOrder");
    var lastUpdated = document.getElementById("lastUpdated");
    var orderMessage = document.getElementById("orderMessage");

    if (refreshButton && lastUpdated) {
        refreshButton.addEventListener("click", function () {
            lastUpdated.textContent = "Tampilan diperbarui: " + new Date().toLocaleString("id-ID");
        });
    }

    if (finishButton && orderMessage) {
        finishButton.addEventListener("click", function () {
            orderMessage.textContent = "Status pesanan ini masih berupa contoh dan belum terhubung ke sistem pemesanan.";
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeOrderHistoryPage);
} else {
    initializeOrderHistoryPage();
}

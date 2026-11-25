function initializeOrdererDataPage() {
    var saveButton = document.getElementById("saveDataButton");
    var formStatus = document.getElementById("formStatus");
    var requiredFields = document.querySelectorAll(".data-card [required]");

    if (!saveButton || !formStatus) return;

    saveButton.addEventListener("click", function () {
        for (var index = 0; index < requiredFields.length; index++) {
            if (!requiredFields[index].checkValidity()) {
                requiredFields[index].reportValidity();
                return;
            }
        }

        formStatus.textContent = "Data lengkap. Penyimpanan dan riwayat pemesanan belum terhubung ke server.";
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeOrdererDataPage);
} else {
    initializeOrdererDataPage();
}

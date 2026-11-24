var navbar = document.getElementById("navbar");
var menuToggle = document.getElementById("menuToggle");
var navMenu = document.getElementById("navMenu");
var tombolFilter = document.querySelectorAll(".filter-btn");
var semuaCard = document.querySelectorAll(".card");
var teksJumlah = document.getElementById("jumlahMobil");
var pesanKosong = document.getElementById("pesanKosong");
var teksTahun = document.getElementById("tahun");

var scrollProgress = null;
if (navbar) {
    scrollProgress = document.createElement("span");
    scrollProgress.className = "scroll-progress";
    scrollProgress.setAttribute("aria-hidden", "true");
    navbar.appendChild(scrollProgress);
}

var hero = document.getElementById("beranda");
var heroImage = hero ? hero.querySelector(".hero-image img") : null;
var motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

if (hero) {
    window.requestAnimationFrame(function () {
        hero.classList.add("is-ready");
    });
}

var revealTargets = document.querySelectorAll(
    ".strip, .koleksi h2, .koleksi .sub-judul, .filter, .grid-mobil .card, .tentang, .cta"
);

revealTargets.forEach(function (element, index) {
    element.classList.add("reveal");
    if (element.classList.contains("card")) {
        element.style.setProperty("--card-index", index % 6);
    }
});

if ("IntersectionObserver" in window && !motionReduced.matches) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
    });

    revealTargets.forEach(function (element) {
        revealObserver.observe(element);
    });
} else {
    revealTargets.forEach(function (element) {
        element.classList.add("is-visible");
    });
}

window.addEventListener("scroll", function () {
    if (navbar && window.scrollY > 20) {
        navbar.classList.add("scrolled");
    } else if (navbar) {
        navbar.classList.remove("scrolled");
    }

    var scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    var progress = scrollRange > 0 ? window.scrollY / scrollRange : 0;
    if (scrollProgress) {
        scrollProgress.style.transform = "scaleX(" + Math.min(1, Math.max(0, progress)) + ")";
    }

    if (heroImage && !motionReduced.matches) {
        var heroRect = hero.getBoundingClientRect();
        if (heroRect.bottom > 0 && heroRect.top < window.innerHeight) {
            var offset = Math.min(18, Math.max(-18, heroRect.top * -0.025));
            heroImage.style.transform = "translateY(" + offset + "px) scale(1.015)";
        }
    }
}, { passive: true });

if (menuToggle && navMenu) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-controls", "navMenu");

    menuToggle.addEventListener("click", function () {
        var terbuka = navMenu.classList.toggle("buka");
        menuToggle.setAttribute("aria-expanded", terbuka ? "true" : "false");
    });
}

if (navMenu) {
    var linkMenu = navMenu.querySelectorAll("a");
    for (var i = 0; i < linkMenu.length; i++) {
        linkMenu[i].addEventListener("click", function () {
            navMenu.classList.remove("buka");
            if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
        });
    }
}

function filterMobil(kategori) {
    var jumlah = 0;

    for (var i = 0; i < semuaCard.length; i++) {
        var kategoriCard = semuaCard[i].getAttribute("data-kategori");

        if (kategori === "semua" || kategori === kategoriCard) {
            semuaCard[i].classList.remove("sembunyi");
            jumlah++;
        } else {
            semuaCard[i].classList.add("sembunyi");
        }
    }

    teksJumlah.textContent = "Menampilkan " + jumlah + " mobil";

    if (jumlah === 0) {
        pesanKosong.style.display = "block";
    } else {
        pesanKosong.style.display = "none";
    }
}
for (var j = 0; j < tombolFilter.length; j++) {
    tombolFilter[j].addEventListener("click", function () {
        for (var k = 0; k < tombolFilter.length; k++) {
            tombolFilter[k].classList.remove("aktif");
        }
        this.classList.add("aktif");
        var kategoriDipilih = this.getAttribute("data-kategori");
        filterMobil(kategoriDipilih);
    });
}
for (var m = 0; m < semuaCard.length; m++) {
    semuaCard[m].addEventListener("click", function () {
        var namaMobil = this.querySelector("h4").textContent;
        alert("Terima kasih sudah tertarik dengan " + namaMobil + "!\nSilakan hubungi kami untuk info harga.");
    });
}
if (teksTahun) {
    var tahunSekarang = new Date().getFullYear();
    teksTahun.textContent = tahunSekarang;
}
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {

    /* ---------- 1. SEARCH ---------- */
    var toggle = document.getElementById('searchToggle');
    var bar    = document.getElementById('searchBar');
    var input  = document.getElementById('searchInput');
    var close  = document.getElementById('searchClose');

    function openSearch()  { bar.classList.add('open'); if (input) input.focus(); }
    function closeSearch() { if (bar) bar.classList.remove('open'); }

    if (toggle && bar) {
        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            if (bar.classList.contains('open')) closeSearch(); else openSearch();
        });
        bar.addEventListener('click', function (e) { e.stopPropagation(); });
        if (close) close.addEventListener('click', closeSearch);
        document.addEventListener('click', closeSearch);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeSearch();
        });
        if (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key !== 'Enter') return;
                var q = input.value.trim();
                if (q) window.location.href = 'catalog.xhtml?q=' + encodeURIComponent(q);
            });
        }
    }

    /* ---------- 2. NAVBAR SAAT SCROLL ---------- */
    var navbar = document.getElementById('navbar');
    function onScroll() {
        if (navbar) navbar.classList.toggle('is-scrolled', window.scrollY > 10);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- 3. ANIMASI MUNCUL (data-aos) ---------- */
    var items = document.querySelectorAll('[data-aos]');
    if ('IntersectionObserver' in window && items.length) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('aos-in');
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.15 });
        items.forEach(function (it) { io.observe(it); });
    } else {
        items.forEach(function (it) { it.classList.add('aos-in'); });
    }

    /* ---------- 4. COLLECTION DARI cars.js ---------- */
    var grid = document.getElementById('collectionGrid');
    if (grid && typeof CARS !== 'undefined') {
        var LIMIT = 6;   // jumlah mobil yang ditampilkan di beranda

        var el = function (tag, cls, text) {
            var e = document.createElement(tag);
            if (cls) e.className = cls;
            if (text !== undefined) e.textContent = text;
            return e;
        };

        Object.keys(CARS).slice(0, LIMIT).forEach(function (id) {
            var c = CARS[id];
            var card = el('div', 'car-card');

            var img = el('img', 'car-card__img');
            img.setAttribute('src', c.images && c.images[0] ? c.images[0] : '');
            img.setAttribute('alt', c.name);
            img.setAttribute('loading', 'lazy');
            card.appendChild(img);

            var info = el('div', 'car-card__info');
            info.appendChild(el('span', 'car-card__name', c.name));
            info.appendChild(el('span', 'car-card__price', c.price));
            card.appendChild(info);

            var link = el('a', 'car-card__link', 'Details');
            link.setAttribute('href', 'detail.xhtml?car=' + id);
            card.appendChild(link);

            grid.appendChild(card);
        });
    }
});
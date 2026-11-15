document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('carGrid');
    if (!grid || typeof CARS === 'undefined') return;

    var catSel = document.getElementById('category');
    var brandSel = document.getElementById('brand');
    var ids = Object.keys(CARS);
    var query = '';   // kata kunci dari ?q=

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    // isi pilihan filter dari data (nilai unik)
    function fill(sel, label, key) {
        if (!sel) return;
        sel.textContent = '';
        var first = el('option', '', label);
        first.setAttribute('value', 'all');
        sel.appendChild(first);
        var seen = {};
        ids.forEach(function (id) {
            var v = CARS[id][key];
            if (v && !seen[v]) {
                seen[v] = true;
                var o = el('option', '', v);
                o.setAttribute('value', v);
                sel.appendChild(o);
            }
        });
    }

    function card(id) {
        var c = CARS[id];
        var box = el('div', 'car-card');

        var img = el('img', 'car-card__img');
        img.setAttribute('src', c.images && c.images[0] ? c.images[0] : '');
        img.setAttribute('alt', c.name);
        img.setAttribute('loading', 'lazy');
        box.appendChild(img);

        var info = el('div', 'car-card__info');
        info.appendChild(el('span', 'car-card__name', c.name));
        info.appendChild(el('span', 'car-card__price', c.price));
        box.appendChild(info);

        var link = el('a', 'car-card__link', 'Details');
        link.setAttribute('href', 'detail.xhtml?car=' + id);
        box.appendChild(link);
        return box;
    }

    function render() {
        var cat = catSel ? catSel.value : 'all';
        var brand = brandSel ? brandSel.value : 'all';
        grid.textContent = '';

        var shown = ids.filter(function (id) {
            var c = CARS[id];
            var hay = (c.name + ' ' + c.brand + ' ' + c.type).toLowerCase();
            return (cat === 'all' || c.type === cat) && (brand === 'all' || c.brand === brand) && (!query || hay.indexOf(query) !== -1);
        });

        if (!shown.length) {
            grid.appendChild(el('p', 'car-grid__empty', 'Tidak ada mobil yang cocok dengan filter ini.'));
            return;
        }
        shown.forEach(function (id) { grid.appendChild(card(id)); });
    }

    fill(catSel, 'All Categories', 'type');
    fill(brandSel, 'All Brands', 'brand');

    // filter awal dari alamat (opsional)
    var params = new URLSearchParams(window.location.search);
    query = (params.get('q') || '').trim().toLowerCase();
    if (catSel && params.get('category')) catSel.value = params.get('category');
    if (brandSel && params.get('brand')) brandSel.value = params.get('brand');

    if (catSel) catSel.addEventListener('change', render);
    if (brandSel) brandSel.addEventListener('change', render);
    render();
});
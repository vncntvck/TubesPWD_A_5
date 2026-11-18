/* detail.js — halaman detail mobil dinamis untuk CARIEZ */

document.addEventListener('DOMContentLoaded', function () {
    if (typeof CARS === 'undefined') {
        console.error('Data mobil (CARS) belum dimuat.');
        return;
    }

//AMBIL ID DARI URL
    var params = new URLSearchParams(window.location.search);
    var carId = params.get('car');
    
    // Default fallback ke mobil pertama atau "mx5" jika parameter kosong/tidak ada
    var carKeys = Object.keys(CARS);
    if (!carId || !CARS[carId]) {
        carId = carKeys.length ? carKeys[0] : null;
    }

    var c = carId ? CARS[carId] : null;

// Kalau mobil tidak ditemukan
    if (!c) {
        var mainContainer = document.querySelector('main');
        if (mainContainer) {
            mainContainer.innerHTML = `
                <div class="wrap" style="padding: 4rem 2rem; text-align: center;">
                    <h2>Mobil Tidak Ditemukan</h2>
                    <p style="color: #6b6b6b; margin: 1rem 0 2rem;">Data mobil yang Anda cari tidak tersedia atau sudah terjual.</p>
                    <a href="catalog.xhtml" class="btn btn--solid" style="display: inline-flex; width: auto; padding: 0.75rem 1.5rem;">Kembali ke Katalog</a>
                </div>
            `;
        }
        document.title = 'Mobil Tidak Ditemukan | CARIEZ';
        return;
    }

// Update Informasi Utama
    document.title = c.name + ' | CARIEZ';

    // Brand & Nama Mobil
    var brandEl = document.querySelector('.info__brand');
    if (brandEl) brandEl.textContent = c.brand;

    var titleEl = document.querySelector('.info__title');
    if (titleEl) titleEl.textContent = c.name;

    // Deskripsi
    var descEl = document.querySelector('.info__desc');
    if (descEl) descEl.textContent = c.desc || 'Deskripsi mobil belum tersedia.';

    // Harga
    var priceEl = document.querySelector('.price');
    if (priceEl) priceEl.textContent = c.price;

    // Simulasi Cicilan (jika tersedia di data mobil)
    var installmentEl = document.getElementById('installment');
    if (installmentEl && c.installment) {
        installmentEl.textContent = c.installment;
    }

    var creditNoteEl = document.getElementById('creditNote');
    if (creditNoteEl && c.creditNote) {
        creditNoteEl.textContent = c.creditNote;
    }

// Galeri Gambar dan Thumbnail
    var images = (c.images && c.images.length) ? c.images : ['Img/logo/Logo CARIEZ.png'];
    var mainImg = document.getElementById('mainImg');
    var thumbsContainer = document.querySelector('.gallery__thumbs');

    if (mainImg) {
        mainImg.setAttribute('src', images[0]);
        mainImg.setAttribute('alt', c.name);
    }

    if (thumbsContainer) {
        thumbsContainer.innerHTML = '';
        images.forEach(function (src, index) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'thumb' + (index === 0 ? ' is-active' : '');
            btn.setAttribute('data-src', src);
            
            var img = document.createElement('img');
            img.setAttribute('src', src);
            img.setAttribute('alt', c.name + ' thumbnail ' + (index + 1));
            
            btn.appendChild(img);

            // Event klik thumbnail untuk mengganti gambar utama
            btn.addEventListener('click', function () {
                if (mainImg) mainImg.setAttribute('src', src);
                
                var allThumbs = thumbsContainer.querySelectorAll('.thumb');
                allThumbs.forEach(function (t) { t.classList.remove('is-active'); });
                btn.classList.add('is-active');
            });

            thumbsContainer.appendChild(btn);
        });
    }

// Ringkasan Statistik Mobil
    var statsContainer = document.querySelector('.stats');
    if (statsContainer && c.statsSummary) {
        statsContainer.innerHTML = '';
        c.statsSummary.forEach(function (stat) {
            var statDiv = document.createElement('div');
            statDiv.className = 'stat';

            var labelSpan = document.createElement('span');
            labelSpan.className = 'stat__label';
            labelSpan.textContent = stat.label;

            var valueStrong = document.createElement('strong');
            valueStrong.className = 'stat__value';
            valueStrong.innerHTML = stat.value + ' <small>' + stat.unit + '</small>';

            statDiv.appendChild(labelSpan);
            statDiv.appendChild(valueStrong);
            statsContainer.appendChild(statDiv);
        });
    }

// Detail Spesifikasi
    var specsContainer = document.querySelector('.specs');
    if (specsContainer && c.specifications) {
        specsContainer.innerHTML = '';
        
        // Baris judul/subtitle spesifikasi
        if (c.specTitle) {
            var titleRow = document.createElement('div');
            titleRow.className = 'specs__row';
            var titleSpan = document.createElement('span');
            titleSpan.textContent = c.specTitle;
            titleRow.appendChild(titleSpan);
            specsContainer.appendChild(titleRow);
        }

        c.specifications.forEach(function (spec) {
            var row = document.createElement('div');
            row.className = 'specs__row';

            var labelSpan = document.createElement('span');
            labelSpan.textContent = spec.label;

            var valSpan = document.createElement('span');
            valSpan.textContent = spec.value;

            row.appendChild(labelSpan);
            row.appendChild(valSpan);
            specsContainer.appendChild(row);
        });
    }

// FITUS KEUNGGULAN
    var featuresContainer = document.querySelector('.specs.specs--features');
    if (featuresContainer && c.features) {
        featuresContainer.innerHTML = '';
        c.features.forEach(function (feat) {
            var row = document.createElement('div');
            row.className = 'specs__row';

            var labelSpan = document.createElement('span');
            labelSpan.textContent = feat.category;

            var valSpan = document.createElement('span');
            valSpan.textContent = feat.description;

            row.appendChild(labelSpan);
            row.appendChild(valSpan);
            featuresContainer.appendChild(row);
        });
    }
});
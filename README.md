# TubesPWD_A_5

## Konfigurasi database XAMPP

Salin `.env.example` menjadi `backend/.env`, lalu sesuaikan nilainya dengan konfigurasi MySQL di XAMPP. Default template memakai host `127.0.0.1`, port `3306`, database `cariez`, dan user `root` tanpa password.

Pastikan database `cariez` sudah dibuat di phpMyAdmin. PHP native tidak membaca `.env` secara otomatis; proyek memuat file konfigurasi itu melalui `backend/config/koneksi.php`.

## Migrasi transaksi dan pembayaran

Setelah database lama `cariez` tersedia, backup database terlebih dahulu, lalu jalankan `backend/migration.sql` satu kali melalui phpMyAdmin. Migrasi ini menyesuaikan tabel `transaksi` dan `pembayaran` yang sudah ada; migrasi bukan skrip untuk membuat seluruh tabel aplikasi dari database kosong.

Migrasi memindahkan relasi transaksi dari `pembeli` ke `pengguna`, mengubah nama kolom dan status lama, serta menambahkan kolom `role` untuk akun baru. Akun baru mendapat role `user`. Setelah migrasi, role akun admin perlu ditetapkan manual di phpMyAdmin. Endpoint verifikasi KTP memeriksa role admin; halaman admin dan endpoint admin lainnya tetap perlu dilindungi.

Jalankan juga `backend/migration_feature_apis.sql` satu kali untuk menyiapkan tabel detail pemeriksaan dan kolom dokumen kendaraan yang digunakan endpoint terkait.

## Verifikasi KTP

Pemesan harus login untuk mengirim formulir pemesanan dengan foto KTP JPG/PNG (maksimal 5 MB). Admin yang sudah login dengan role `admin` dapat membuka menu **Verifikasi KTP**, melihat dokumen secara privat, lalu menyetujui atau menolaknya.
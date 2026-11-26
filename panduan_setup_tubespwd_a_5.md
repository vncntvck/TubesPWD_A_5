# TubesPWD_A_5

Panduan langkah demi langkah untuk menyiapkan database, menjalankan migrasi, dan menggunakan fitur verifikasi KTP pada proyek **TubesPWD_A_5**.

---

## 1. Siapkan Konfigurasi Database XAMPP

Lakukan pengaturan koneksi MySQL terlebih dahulu sebelum menjalankan skrip SQL apa pun:

1. **Salin file konfigurasi:** Salin file `.env.example` menjadi `backend/.env`.
2. **Sesuaikan kredensial MySQL:** Cocokkan isi `backend/.env` dengan pengaturan XAMPP Anda. Konfigurasi bawaan menggunakan:
   - **Host:** `127.0.0.1`
   - **Port:** `3306`
   - **Database:** `cariez`
   - **User:** `root` (tanpa password)
3. **Buat database:** Buka **phpMyAdmin**, lalu buat database baru bernama `cariez` (jika belum ada).
4. **Koneksi otomatis:** Tidak perlu mengubah pengaturan PHP native karena konfigurasi pada `.env` sudah dimuat secara otomatis melalui file `backend/config/koneksi.php`.

---

## 2. Backup & Jalankan Migrasi SQL

> **Catatan Penting:** Skrip migrasi hanya menyesuaikan struktur tabel yang sudah ada di database `cariez`, **bukan** skrip untuk membuat seluruh tabel dari nol.

1. **Backup database lama:** Jika database `cariez` sudah berisi data sebelumnya, lakukan *Export/Backup* terlebih dahulu melalui phpMyAdmin untuk keamanan data.
2. **Jalankan migrasi utama (`backend/migration.sql`):**
   - Buka database `cariez` di phpMyAdmin, masuk ke tab **SQL** atau **Import**, lalu jalankan `backend/migration.sql` **satu kali saja**.
   - Proses ini akan memindahkan relasi transaksi dari `pembeli` ke `pengguna`, menyesuaikan nama kolom serta status lama, dan menambahkan kolom `role` (akun baru otomatis mendapat role `user`).
3. **Jalankan migrasi fitur (`backend/migration_feature_apis.sql`):**
   - Jalankan file `backend/migration_feature_apis.sql` **satu kali saja** di phpMyAdmin untuk menyiapkan tabel detail pemeriksaan serta kolom dokumen kendaraan.
4. **Atur role admin secara manual:**
   - Buka tabel `pengguna` di phpMyAdmin, lalu ubah nilai kolom `role` menjadi `admin` pada akun yang ditunjuk sebagai administrator.
   - *Catatan keamanan:* Endpoint verifikasi KTP sudah memeriksa role `admin`, namun halaman admin serta endpoint admin lainnya tetap perlu dilindungi secara mandiri.

---

## 3. Alur Penggunaan (Pemesanan & Verifikasi KTP)

Setelah konfigurasi dan migrasi selesai, sistem dapat digunakan dengan alur berikut:

### A. Untuk Pemesan (`user`)
1. **Login** ke dalam sistem menggunakan akun pengguna.
2. Isi **formulir pemesanan** dengan lengkap.
3. Unggah **foto KTP** dengan ketentuan:
   - **Format:** `JPG` atau `PNG`
   - **Ukuran maksimal:** `5 MB`
4. Kirim formulir dan tunggu proses peninjauan dari admin.

### B. Untuk Administrator (`admin`)
1. **Login** menggunakan akun yang sudah memiliki role `admin`.
2. Buka menu **Verifikasi KTP**.
3. Tinjau dokumen foto KTP pemesan secara privat.
4. Pilih aksi **Setujui** atau **Tolak** sesuai hasil pemeriksaan.
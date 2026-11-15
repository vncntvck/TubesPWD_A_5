# TubesPWD_A_5

## Konfigurasi database XAMPP

Salin `.env.example` menjadi `.env`, lalu sesuaikan nilainya dengan konfigurasi MySQL di XAMPP. Default template memakai host `127.0.0.1`, port `3306`, database `cariez`, dan user `root` tanpa password.

Pastikan database `cariez` sudah dibuat di phpMyAdmin. File `.env` hanya menyimpan konfigurasi; PHP native tidak membacanya secara otomatis dan proyek ini belum memiliki backend atau loader `.env`.
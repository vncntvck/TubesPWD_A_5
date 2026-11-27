-- Tambahkan kolom BLOB untuk menyimpan berkas baru langsung di MariaDB.
-- Kolom path lama dipertahankan untuk kompatibilitas; API baru memakai kolom BLOB.
-- Jalankan satu kali setelah migration_feature_apis.sql.
-- Server MariaDB perlu max_allowed_packet minimal 16M untuk menerima file sampai 10 MB.

USE `cariez`;

ALTER TABLE `pembeli`
    ADD COLUMN IF NOT EXISTS `foto_ktp_data` MEDIUMBLOB NULL AFTER `foto_ktp`,
    ADD COLUMN IF NOT EXISTS `foto_ktp_mime` VARCHAR(100) NULL AFTER `foto_ktp_data`;

ALTER TABLE `bukti_pembayaran`
    ADD COLUMN IF NOT EXISTS `file_bukti_data` MEDIUMBLOB NULL AFTER `file_bukti`,
    ADD COLUMN IF NOT EXISTS `file_bukti_mime` VARCHAR(100) NULL AFTER `file_bukti_data`;

ALTER TABLE `dokumen_kendaraan`
    ADD COLUMN IF NOT EXISTS `file_dokumen_data` MEDIUMBLOB NULL AFTER `file_dokumen`,
    ADD COLUMN IF NOT EXISTS `file_dokumen_mime` VARCHAR(100) NULL AFTER `file_dokumen_data`;

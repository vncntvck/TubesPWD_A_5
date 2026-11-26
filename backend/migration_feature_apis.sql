-- Jalankan setelah migration.sql untuk menyiapkan tabel/kolom API inspeksi
-- dan dokumen kendaraan. Bisa dijalankan ulang pada MariaDB.

USE `cariez`;

CREATE TABLE IF NOT EXISTS `detail_pemeriksaan` (
    `id_detail`       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `id_pemeriksaan`  INT UNSIGNED NOT NULL,
    `nama_komponen`   VARCHAR(100) NOT NULL,
    `kondisi`         VARCHAR(60) NOT NULL,
    `keterangan`      TEXT NULL,
    INDEX `idx_detail_pemeriksaan_parent` (`id_pemeriksaan`),
    CONSTRAINT `fk_detail_pemeriksaan_parent`
        FOREIGN KEY (`id_pemeriksaan`)
        REFERENCES `pemeriksaan_mobil` (`id_pemeriksaan`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `dokumen_kendaraan`
    ADD COLUMN IF NOT EXISTS `tanggal_terbit` DATE NULL AFTER `nomor_dokumen`,
    ADD COLUMN IF NOT EXISTS `file_dokumen` VARCHAR(255) NULL AFTER `masa_berlaku`,
    ADD COLUMN IF NOT EXISTS `keterangan` TEXT NULL AFTER `file_dokumen`;

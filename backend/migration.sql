-- CARIEZ: migrasi transaksi dan pembayaran dari skema database lama.
-- Jalankan SATU KALI pada database cariez yang sudah memiliki tabel
-- pengguna, pembeli, mobil, transaksi, dan pembayaran.
-- Backup database sebelum menjalankan migrasi ini.

USE `cariez`;

-- Transaksi lama terhubung ke pembeli; aplikasi saat ini memakai id_pengguna.
ALTER TABLE `transaksi`
    ADD COLUMN `id_pengguna` INT UNSIGNED NULL AFTER `id_transaksi`,
    ADD COLUMN `uang_muka` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `total_harga`,
    ADD COLUMN `catatan_pemesan` TEXT NULL AFTER `status`;

UPDATE `transaksi` t
JOIN `pembeli` p ON p.`id_pembeli` = t.`id_pembeli`
SET t.`id_pengguna` = p.`id_pengguna`;

UPDATE `transaksi`
SET `metode_pembayaran` = 'Virtual Account'
WHERE `metode_pembayaran` IS NULL OR `metode_pembayaran` = '';

ALTER TABLE `transaksi`
    MODIFY COLUMN `metode_pembayaran` VARCHAR(100) NOT NULL DEFAULT 'Virtual Account',
    MODIFY COLUMN `status` ENUM(
        'Proses', 'Menunggu', 'Diproses', 'Selesai', 'Batal', 'Dibatalkan'
    ) NOT NULL DEFAULT 'Menunggu';

UPDATE `transaksi`
SET `status` = CASE `status`
    WHEN 'Proses' THEN 'Diproses'
    WHEN 'Batal' THEN 'Dibatalkan'
    ELSE `status`
END;

ALTER TABLE `transaksi`
    MODIFY COLUMN `status` ENUM('Menunggu', 'Diproses', 'Selesai', 'Dibatalkan')
        NOT NULL DEFAULT 'Menunggu',
    DROP FOREIGN KEY `fk_transaksi_pembeli`,
    DROP INDEX `idx_transaksi_pembeli`,
    DROP COLUMN `id_pembeli`,
    MODIFY COLUMN `id_pengguna` INT UNSIGNED NOT NULL,
    ADD INDEX `idx_transaksi_pengguna` (`id_pengguna`),
    ADD INDEX `idx_transaksi_status` (`status`),
    ADD CONSTRAINT `fk_transaksi_pengguna`
        FOREIGN KEY (`id_pengguna`) REFERENCES `pengguna` (`id_pengguna`)
        ON DELETE CASCADE ON UPDATE CASCADE;

-- Sesuaikan nama kolom dan status pembayaran tanpa menghapus riwayat.
ALTER TABLE `pembayaran`
    CHANGE COLUMN `metode` `metode_pembayaran`
        VARCHAR(100) NOT NULL DEFAULT 'Virtual Account',
    CHANGE COLUMN `jumlah_bayar` `jumlah_pembayaran`
        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `bukti_pembayaran` VARCHAR(500) NULL
        COMMENT 'URL atau path file bukti transfer';

ALTER TABLE `pembayaran`
    MODIFY COLUMN `status` ENUM(
        'Menunggu', 'Berhasil', 'Gagal', 'Dikonfirmasi', 'Ditolak'
    ) NOT NULL DEFAULT 'Menunggu';

UPDATE `pembayaran`
SET `status` = CASE `status`
    WHEN 'Berhasil' THEN 'Dikonfirmasi'
    WHEN 'Gagal' THEN 'Ditolak'
    ELSE `status`
END;

ALTER TABLE `pembayaran`
    MODIFY COLUMN `status` ENUM('Menunggu', 'Dikonfirmasi', 'Ditolak')
        NOT NULL DEFAULT 'Menunggu',
    ADD INDEX `idx_pembayaran_status` (`status`);

-- Akun baru otomatis menjadi user. Promosikan akun admin secara manual
-- setelah migrasi dengan UPDATE pengguna SET role = 'admin' WHERE username = '...';
ALTER TABLE `pengguna`
    ADD COLUMN `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user';
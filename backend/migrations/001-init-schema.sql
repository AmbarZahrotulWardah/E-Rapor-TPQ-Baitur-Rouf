-- =====================================================================
--  Migrasi 001 : Skema awal database E-Rapor TPQ Baitur Rouf Surabaya
--  Acuan       : Vault/design.md §5 (ERD) dan §6 (relasi antar tabel)
--  Dijalankan  : npm run db:migrate
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `e_rapor_tpq`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `e_rapor_tpq`;

-- ---------------------------------------------------------------------
-- Tabel users : seluruh akun (admin, ustadz, wali santri)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `nama`       VARCHAR(100)  NOT NULL,
  `email`      VARCHAR(100)  NOT NULL,
  `password`   VARCHAR(255)  NOT NULL COMMENT 'Hash bcrypt, bukan plain text',
  `role`       ENUM('admin','ustadz','wali_santri') NOT NULL DEFAULT 'ustadz',
  `aktif`      BOOLEAN       NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabel kelas : rombongan belajar beserta ustadz pengampu
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kelas` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `nama_kelas` VARCHAR(50)   NOT NULL,
  `id_ustadz`  INT           NULL,
  `keterangan` VARCHAR(255)  NULL,
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_kelas_nama` (`nama_kelas`),
  CONSTRAINT `fk_kelas_ustadz` FOREIGN KEY (`id_ustadz`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabel santri : data pribadi santri (FR-2)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `santri` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `nis`           VARCHAR(20)  NOT NULL COMMENT 'Nomor induk santri',
  `nama`          VARCHAR(100) NOT NULL,
  `tempat_lahir`  VARCHAR(100) NULL,
  `tanggal_lahir` DATE         NULL,
  `jenis_kelamin` ENUM('L','P') NULL,
  `alamat`        VARCHAR(255) NULL,
  `id_kelas`      INT          NULL,
  `id_wali`       INT          NULL,
  `status`        ENUM('aktif','lulus','pindah','berhenti') NOT NULL DEFAULT 'aktif',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_santri_nis` (`nis`),
  KEY `idx_santri_kelas` (`id_kelas`),
  KEY `idx_santri_wali`  (`id_wali`),
  CONSTRAINT `fk_santri_kelas` FOREIGN KEY (`id_kelas`)
    REFERENCES `kelas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_santri_wali`  FOREIGN KEY (`id_wali`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabel kriteria : kriteria SAW beserta bobot (FR-4)
-- Bobot disimpan di database agar dapat dikonfigurasi Admin.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kriteria` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `kode`       VARCHAR(10)   NOT NULL COMMENT 'C1, C2, dst',
  `nama`       VARCHAR(100)  NOT NULL,
  `bobot`      DECIMAL(4,2)  NOT NULL COMMENT 'Total seluruh bobot harus = 1',
  `jenis`      ENUM('benefit','cost') NOT NULL DEFAULT 'benefit',
  `kelompok`   ENUM('tajwid','akademik','lainnya') NOT NULL DEFAULT 'tajwid',
  `urutan`     INT           NOT NULL DEFAULT 0,
  `aktif`      BOOLEAN       NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_kriteria_kode` (`kode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabel nilai : skor mentah per kriteria per pertemuan (FR-3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `nilai` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `id_santri`    INT          NOT NULL,
  `id_kriteria`  INT          NOT NULL,
  `id_ustadz`    INT          NULL,
  `skor`         DECIMAL(5,2) NOT NULL COMMENT 'Nilai mentah 0-100',
  `pertemuan_ke` INT          NOT NULL DEFAULT 1,
  `periode`      VARCHAR(30)  NOT NULL COMMENT 'mis. Ganjil 2025/2026',
  `tanggal`      DATE         NOT NULL,
  `catatan`      VARCHAR(255) NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_nilai_unik` (`id_santri`,`id_kriteria`,`periode`,`pertemuan_ke`),
  KEY `idx_nilai_kriteria` (`id_kriteria`),
  KEY `idx_nilai_periode`  (`periode`),
  CONSTRAINT `fk_nilai_santri`   FOREIGN KEY (`id_santri`)
    REFERENCES `santri` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nilai_kriteria` FOREIGN KEY (`id_kriteria`)
    REFERENCES `kriteria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_nilai_ustadz`   FOREIGN KEY (`id_ustadz`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabel hasil_saw : output perhitungan SAW (FR-4)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hasil_saw` (
  `id`                 INT AUTO_INCREMENT PRIMARY KEY,
  `id_santri`          INT           NOT NULL,
  `periode`            VARCHAR(30)   NOT NULL,
  `nilai_akhir`        DECIMAL(7,6)  NOT NULL COMMENT 'Nilai preferensi Vi (0-1)',
  `predikat`           ENUM('Sangat Baik','Baik','Cukup','Kurang') NOT NULL,
  `ranking`            INT           NULL,
  `basis_normalisasi`  ENUM('skala_penuh','antar_santri') NOT NULL DEFAULT 'skala_penuh',
  `total_bobot`        DECIMAL(5,4)  NULL,
  `detail_normalisasi` JSON          NULL COMMENT 'Jejak matriks X, R, dan kontribusi',
  `generated_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_hasil_saw` (`id_santri`,`periode`,`basis_normalisasi`),
  KEY `idx_hasil_periode` (`periode`),
  CONSTRAINT `fk_hasil_santri` FOREIGN KEY (`id_santri`)
    REFERENCES `santri` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Data kriteria awal (Vault/ai.md §2) — total bobot = 1.00
-- ---------------------------------------------------------------------
INSERT INTO `kriteria` (`kode`,`nama`,`bobot`,`jenis`,`kelompok`,`urutan`) VALUES
  ('C1','Makhraj Huruf',        0.20,'benefit','tajwid',   1),
  ('C2','Tajwid',               0.25,'benefit','tajwid',   2),
  ('C3','Kelancaran Bacaan',    0.20,'benefit','tajwid',   3),
  ('C4','Hafalan',              0.15,'benefit','tajwid',   4),
  ('C5','Akademik (Tulis/Iqra)',0.20,'benefit','akademik', 5)
ON DUPLICATE KEY UPDATE
  `nama` = VALUES(`nama`),
  `bobot` = VALUES(`bobot`),
  `jenis` = VALUES(`jenis`),
  `kelompok` = VALUES(`kelompok`),
  `urutan` = VALUES(`urutan`);

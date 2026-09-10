const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { PREDIKAT_LIST, BASIS_NORMALISASI } = require('../utils/constants');

/**
 * Tabel `hasil_saw` — Vault/design.md §5.
 * Menyimpan hasil akhir perhitungan SAW per santri per periode.
 * Kolom `detail_normalisasi` (JSON) menyimpan matriks keputusan, hasil
 * normalisasi, dan kontribusi tiap kriteria — dipakai untuk transparansi
 * rapor dan verifikasi saat pengujian (Vault/ai.md §6).
 */
const HasilSAW = sequelize.define(
  'HasilSAW',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_santri: { type: DataTypes.INTEGER, allowNull: false },
    periode: { type: DataTypes.STRING(30), allowNull: false },
    nilai_akhir: {
      type: DataTypes.DECIMAL(7, 6),
      allowNull: false,
      comment: 'Nilai preferensi Vi hasil SAW (skala 0-1)',
    },
    predikat: { type: DataTypes.ENUM(...PREDIKAT_LIST), allowNull: false },
    ranking: { type: DataTypes.INTEGER, allowNull: true },
    basis_normalisasi: {
      type: DataTypes.ENUM(...Object.values(BASIS_NORMALISASI)),
      allowNull: false,
      defaultValue: BASIS_NORMALISASI.SKALA_PENUH,
    },
    total_bobot: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    detail_normalisasi: { type: DataTypes.JSON, allowNull: true },
    generated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'hasil_saw',
    timestamps: false,
    indexes: [{ unique: true, fields: ['id_santri', 'periode', 'basis_normalisasi'] }],
  }
);

module.exports = HasilSAW;

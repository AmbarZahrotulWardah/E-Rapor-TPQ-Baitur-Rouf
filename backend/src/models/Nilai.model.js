const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { SKOR_MIN, SKOR_MAX } = require('../utils/constants');

/**
 * Tabel `nilai` — Vault/design.md §5.
 * Satu baris = satu skor, satu kriteria, satu santri, satu pertemuan.
 * Nilai mentah inilah bahan baku perhitungan SAW.
 */
const Nilai = sequelize.define(
  'Nilai',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_santri: { type: DataTypes.INTEGER, allowNull: false },
    id_kriteria: { type: DataTypes.INTEGER, allowNull: false },
    id_ustadz: { type: DataTypes.INTEGER, allowNull: true },
    skor: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: { args: [SKOR_MIN], msg: `Skor minimal ${SKOR_MIN}` },
        max: { args: [SKOR_MAX], msg: `Skor maksimal ${SKOR_MAX}` },
      },
    },
    pertemuan_ke: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    periode: { type: DataTypes.STRING(30), allowNull: false },
    tanggal: { type: DataTypes.DATEONLY, allowNull: false },
    catatan: { type: DataTypes.STRING(255), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'nilai',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['id_santri'] },
      { fields: ['id_kriteria'] },
      { fields: ['periode'] },
      { unique: true, fields: ['id_santri', 'id_kriteria', 'periode', 'pertemuan_ke'] },
    ],
  }
);

module.exports = Nilai;

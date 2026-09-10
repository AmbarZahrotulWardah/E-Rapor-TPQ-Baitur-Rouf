const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { JENIS_KRITERIA } = require('../utils/constants');

/**
 * Tabel `kriteria` — Vault/design.md §5.
 * Bobot disimpan di database (bukan di-hardcode) sehingga Admin dapat
 * mengubah proporsi penilaian tanpa mengubah kode program (Decision Log D-1).
 */
const Kriteria = sequelize.define(
  'Kriteria',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    kode: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    nama: { type: DataTypes.STRING(100), allowNull: false },
    bobot: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Bobot tidak boleh kurang dari 0' },
        max: { args: [1], msg: 'Bobot tidak boleh lebih dari 1' },
      },
    },
    jenis: {
      type: DataTypes.ENUM(...Object.values(JENIS_KRITERIA)),
      allowNull: false,
      defaultValue: JENIS_KRITERIA.BENEFIT,
    },
    kelompok: {
      type: DataTypes.ENUM('tajwid', 'akademik', 'lainnya'),
      allowNull: false,
      defaultValue: 'tajwid',
      comment: 'Dipakai untuk filter grafik tajwid vs akademik (FR-6)',
    },
    urutan: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    aktif: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'kriteria',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    defaultScope: { order: [['urutan', 'ASC'], ['kode', 'ASC']] },
  }
);

module.exports = Kriteria;

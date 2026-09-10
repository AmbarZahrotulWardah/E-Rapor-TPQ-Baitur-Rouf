const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { JENIS_KELAMIN } = require('../utils/constants');

/** Tabel `santri` — Vault/design.md §5. */
const Santri = sequelize.define(
  'Santri',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nis: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nama: { type: DataTypes.STRING(100), allowNull: false },
    tempat_lahir: { type: DataTypes.STRING(100), allowNull: true },
    tanggal_lahir: { type: DataTypes.DATEONLY, allowNull: true },
    jenis_kelamin: { type: DataTypes.ENUM(...JENIS_KELAMIN), allowNull: true },
    alamat: { type: DataTypes.STRING(255), allowNull: true },
    id_kelas: { type: DataTypes.INTEGER, allowNull: true },
    id_wali: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM('aktif', 'lulus', 'pindah', 'berhenti'),
      allowNull: false,
      defaultValue: 'aktif',
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'santri',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ fields: ['id_kelas'] }, { fields: ['id_wali'] }],
  }
);

module.exports = Santri;

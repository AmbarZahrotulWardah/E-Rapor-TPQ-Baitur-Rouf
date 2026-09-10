const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/** Tabel `kelas` — Vault/design.md §5. */
const Kelas = sequelize.define(
  'Kelas',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nama_kelas: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    id_ustadz: { type: DataTypes.INTEGER, allowNull: true },
    keterangan: { type: DataTypes.STRING(255), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'kelas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Kelas;

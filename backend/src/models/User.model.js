const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { ROLE_LIST, ROLES } = require('../utils/constants');

/**
 * Tabel `users` — Vault/design.md §5.
 * Menyimpan seluruh akun (admin, ustadz, wali santri). Kolom password
 * disimpan dalam bentuk hash bcrypt, tidak pernah plain text.
 */
const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nama: { type: DataTypes.STRING(100), allowNull: false },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: { msg: 'Format email tidak valid' } },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: {
      type: DataTypes.ENUM(...ROLE_LIST),
      allowNull: false,
      defaultValue: ROLES.USTADZ,
    },
    aktif: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    defaultScope: { attributes: { exclude: ['password'] } },
    scopes: {
      withPassword: { attributes: { include: ['password'] } },
    },
  }
);

module.exports = User;

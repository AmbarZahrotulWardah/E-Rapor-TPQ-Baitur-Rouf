const { Sequelize } = require('sequelize');
const config = require('./env');
const logger = require('../utils/logger');

/**
 * Koneksi Sequelize ke MySQL.
 * `timezone: '+07:00'` menjaga tanggal pertemuan/tanggal lahir tetap sesuai
 * WIB saat dibaca kembali dari database.
 */
const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect,
  logging: config.db.logging ? (sql) => logger.debug(sql) : false,
  timezone: '+07:00',
  define: {
    underscored: true,
    freezeTableName: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

/** Memastikan koneksi database aktif; dipakai saat server start. */
const testConnection = async () => {
  await sequelize.authenticate();
  logger.info(
    `Koneksi database OK: ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.name}`
  );
  return true;
};

module.exports = { sequelize, testConnection };

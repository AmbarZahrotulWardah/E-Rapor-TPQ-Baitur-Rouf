require('dotenv').config();

/**
 * Konfigurasi terpusat aplikasi.
 * Seluruh nilai diambil dari variabel lingkungan (.env) agar tidak ada
 * kredensial maupun parameter bisnis yang di-hardcode di dalam kode.
 */

const toList = (value, fallback = []) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .concat(fallback.length && !value ? fallback : [])
    .filter((item, index, arr) => arr.indexOf(item) === index);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'e_rapor_tpq',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.DB_LOGGING === 'true',
  },

  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'dev-secret-jangan-dipakai-di-produksi-minimal-32-karakter',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,

  corsOrigin: toList(process.env.CORS_ORIGIN, [
    'http://localhost:5173',
    'http://localhost:3000',
  ]),

  saw: {
    /** Toleransi selisih total bobot terhadap 1 (menghindari galat floating point). */
    bobotTolerance: parseFloat(process.env.SAW_BOBOT_TOLERANCE || '0.001'),
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;

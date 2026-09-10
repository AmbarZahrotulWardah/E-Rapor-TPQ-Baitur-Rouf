const app = require('./app');
const config = require('./config/env');
const { testConnection, sequelize } = require('./config/database');
const logger = require('./utils/logger');

const start = async () => {
  try {
    await testConnection();

    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`Server berjalan di http://0.0.0.0:${config.port} (mode ${config.env})`);
      logger.info(`Endpoint API: http://localhost:${config.port}/api/v1`);
    });

    const tutup = async (sinyal) => {
      logger.warn(`Sinyal ${sinyal} diterima, menutup server...`);
      server.close(async () => {
        await sequelize.close();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => tutup('SIGINT'));
    process.on('SIGTERM', () => tutup('SIGTERM'));
  } catch (err) {
    logger.error('Gagal menjalankan server.', err.message);
    process.exit(1);
  }
};

start();

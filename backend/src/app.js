const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler.middleware');
const logger = require('./utils/logger');

const app = express();

/* ------------------------------ Middleware ------------------------------ */
app.use(
  cors({
    origin(origin, callback) {
      // Izinkan permintaan tanpa Origin (Postman, curl, unduhan PDF).
      if (!origin) return callback(null, true);
      if (config.corsOrigin.includes(origin) || config.corsOrigin.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} tidak diizinkan oleh kebijakan CORS.`));
    },
    exposedHeaders: ['Content-Disposition', 'X-Nama-File'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

/* --------------------------------- Route -------------------------------- */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server E-Rapor TPQ Baitur Rouf berjalan normal.',
    data: { env: config.env, waktu: new Date().toISOString() },
  });
});

app.use('/api/v1', routes);

/* --------------------------- Penanganan galat --------------------------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;

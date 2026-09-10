const config = require('../config/env');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const activeLevel = LEVELS[config.logLevel] ?? LEVELS.info;

const stamp = () => new Date().toISOString();

const write = (level, message, meta) => {
  if (LEVELS[level] > activeLevel) return;
  const suffix = meta === undefined ? '' : ` ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;
  // eslint-disable-next-line no-console
  const sink = level === 'error' || level === 'warn' ? console.error : console.log;
  sink(`[${stamp()}] [${level.toUpperCase()}] ${message}${suffix}`);
};

module.exports = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
};

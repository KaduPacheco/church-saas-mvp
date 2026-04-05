// src/utils/logger.js
// Logger simples e configurável.
// Em dev: mensagens coloridas no console.
// Em prod: pode ser substituído por Winston/Pino sem mudar a interface.

const env = require('../config/env');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();

  if (env.isProduction) {
    // Em produção: JSON para ser consumido por log aggregators
    return JSON.stringify({ timestamp, level, message, ...(data && { data }) });
  }

  // Em dev: formatado e colorido
  const colorMap = {
    INFO: colors.blue,
    WARN: colors.yellow,
    ERROR: colors.red,
    DEBUG: colors.gray,
  };

  const color = colorMap[level] || colors.reset;
  const time = `${colors.gray}${timestamp}${colors.reset}`;
  const tag = `${color}[${level}]${colors.reset}`;

  return `${time} ${tag} ${message}`;
}

const logger = {
  info(message, data) {
    console.log(formatMessage('INFO', message, data));
  },

  warn(message, data) {
    console.warn(formatMessage('WARN', message, data));
  },

  error(message, data) {
    console.error(formatMessage('ERROR', message, data));
    if (data instanceof Error && !env.isProduction) {
      console.error(data.stack);
    }
  },

  debug(message, data) {
    if (!env.isProduction) {
      console.log(formatMessage('DEBUG', message, data));
    }
  },
};

module.exports = logger;

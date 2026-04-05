// server.js
// Entry point da aplicação.
// Carrega variáveis de ambiente, importa o app e escuta na porta configurada.

const env = require('./src/config/env');
const app = require('./src/app');
const logger = require('./src/utils/logger');

// Importar database para forçar o teste de conexão na inicialização
require('./src/config/database');

const PORT = env.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📍 Ambiente: ${env.nodeEnv}`);
  logger.info(`🔗 API: http://localhost:${PORT}/api`);
  logger.info(`❤️  Health: http://localhost:${PORT}/api/health`);
});

// ── TRATAMENTO DE ERROS FATAIS ─────────────────────────────────────

// Rejeições de promise não tratadas
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Exceções não capturadas
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Sinal de desligamento gracioso
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Encerrando graciosamente...');
  server.close(() => {
    process.exit(0);
  });
});

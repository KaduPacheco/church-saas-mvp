// src/config/database.js
// Conexão com PostgreSQL via Knex.
// Exporta a instância pronta para uso nos services.

const knex = require('knex');
const knexConfig = require('../../knexfile');
const env = require('./env');

const config = knexConfig[env.nodeEnv] || knexConfig.development;
const db = knex(config);

// Testa conexão na inicialização
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ PostgreSQL conectado com sucesso');
  })
  .catch((err) => {
    console.error('❌ Falha ao conectar no PostgreSQL:', err.message);
    process.exit(1);
  });

module.exports = db;

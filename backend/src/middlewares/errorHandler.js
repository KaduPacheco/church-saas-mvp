// src/middlewares/errorHandler.js
// Middleware global de tratamento de erros.
// DEVE ser o ÚLTIMO middleware registrado no app.js.
// Captura erros de qualquer rota e retorna resposta padronizada.

const { AppError } = require('../utils/errors');
const response = require('../utils/response');
const logger = require('../utils/logger');
const env = require('../config/env');

function errorHandler(err, req, res, _next) {
  // 1. Erro da aplicação (classes customizadas)
  if (err instanceof AppError) {
    logger.warn(`${err.code}: ${err.message}`, {
      path: req.path,
      method: req.method,
    });

    return response.error(
      res,
      err.message,
      err.statusCode,
      err.code,
      err.details || null
    );
  }

  // 2. Erro do PostgreSQL / Knex
  if (err.code && typeof err.code === 'string' && err.code.length === 5) {
    return handleDatabaseError(err, req, res);
  }

  // 3. Erro de JSON inválido no body
  if (err.type === 'entity.parse.failed') {
    return response.error(res, 'JSON inválido no corpo da requisição', 400, 'INVALID_JSON');
  }

  // 4. Erro inesperado (bug)
  logger.error('Erro interno não tratado:', err);

  const message = env.isProduction
    ? 'Erro interno do servidor'
    : err.message || 'Erro interno do servidor';

  return response.error(res, message, 500, 'INTERNAL_ERROR');
}

function handleDatabaseError(err, req, res) {
  switch (err.code) {
    // Unique violation
    case '23505': {
      const detail = err.detail || '';
      let message = 'Registro duplicado';

      if (detail.includes('email')) message = 'Este e-mail já está em uso';
      else if (detail.includes('name')) message = 'Este nome já está em uso';
      else if (detail.includes('cnpj')) message = 'Este CNPJ já está cadastrado';

      logger.warn(`DB Unique Violation: ${detail}`, { path: req.path });
      return response.error(res, message, 409, 'CONFLICT');
    }

    // Foreign key violation
    case '23503': {
      logger.warn(`DB FK Violation: ${err.detail}`, { path: req.path });
      return response.error(
        res,
        'Não é possível realizar esta operação. Existem registros vinculados.',
        400,
        'FK_VIOLATION'
      );
    }

    // Not null violation
    case '23502': {
      logger.warn(`DB Not Null Violation: ${err.column}`, { path: req.path });
      return response.error(
        res,
        `O campo "${err.column}" é obrigatório`,
        422,
        'VALIDATION_ERROR'
      );
    }

    default: {
      logger.error(`Erro de banco não tratado (code: ${err.code}):`, err);
      return response.error(res, 'Erro ao processar dados', 500, 'DATABASE_ERROR');
    }
  }
}

module.exports = errorHandler;

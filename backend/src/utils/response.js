// src/utils/response.js
// Formatador de respostas padronizadas da API.
// Garante que toda resposta siga o mesmo formato.

/**
 * Resposta de sucesso
 * @param {object} res - Express response
 * @param {object} data - Dados retornados
 * @param {number} statusCode - HTTP status (default 200)
 * @param {object} meta - Metadados de paginação (opcional)
 * @param {object} summary - Resumo agregado (opcional)
 */
function success(res, data, statusCode = 200, meta = null, summary = null) {
  const response = {
    success: true,
    data,
  };

  if (meta) response.meta = meta;
  if (summary) response.summary = summary;

  return res.status(statusCode).json(response);
}

/**
 * Resposta de sucesso para criação (201)
 */
function created(res, data) {
  return success(res, data, 201);
}

/**
 * Resposta de erro
 * @param {object} res - Express response
 * @param {string} message - Mensagem de erro
 * @param {number} statusCode - HTTP status (default 500)
 * @param {string} code - Código do erro (ex: 'NOT_FOUND')
 * @param {array} details - Detalhes adicionais (ex: erros de validação)
 */
function error(res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) response.error.details = details;

  return res.status(statusCode).json(response);
}

module.exports = { success, created, error };

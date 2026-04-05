// src/middlewares/tenantIsolation.js
// Extrai church_id e congregation_id do req.user (preenchido pelo authenticate).
// Injeta req.churchId e req.congregationId para uso nos services.
// Garante que toda query será filtrada pelo tenant.

const { UnauthorizedError } = require('../utils/errors');

function tenantIsolation(req, _res, next) {
  if (!req.user || !req.user.churchId) {
    return next(new UnauthorizedError('Contexto de tenant não encontrado'));
  }

  // Injeta identificadores de tenant na request
  req.churchId = req.user.churchId;
  req.congregationId = req.user.congregationId || null;

  next();
}

module.exports = tenantIsolation;

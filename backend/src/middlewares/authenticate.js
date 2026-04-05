// src/middlewares/authenticate.js
// Valida o JWT do header Authorization.
// Se válido, injeta req.user com os dados decodificados.
// Se inválido ou ausente, retorna 401.

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('../utils/errors');

function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de acesso não fornecido');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.jwt.secret);

    // Injeta dados do usuário na request
    req.user = {
      userId: decoded.userId,
      churchId: decoded.churchId,
      congregationId: decoded.congregationId || null,
      profileId: decoded.profileId,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expirado'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token inválido'));
    }

    next(error);
  }
}

module.exports = authenticate;

// src/middlewares/requirePlatformAuth.js
// Valida o JWT do backoffice e injeta req.platformUser.
// Nao depende de churchId nem reutiliza tenantIsolation.

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('../utils/errors');

function requirePlatformAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de acesso da plataforma nao fornecido');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.platformJwt.secret);

    if (decoded.scope !== 'platform') {
      throw new UnauthorizedError('Token invalido para acesso ao backoffice');
    }

    req.platformUser = {
      userId: decoded.platformUserId,
      roleId: decoded.roleId,
      roleSlug: decoded.roleSlug,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token da plataforma expirado'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token da plataforma invalido'));
    }

    next(error);
  }
}

module.exports = requirePlatformAuth;

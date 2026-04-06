// src/middlewares/requirePlatformPermission.js
// Autoriza acesso a rotas do backoffice com base em permissoes da plataforma.

const { PLATFORM_PERMISSIONS } = require('../config/constants');
const { ForbiddenError } = require('../utils/errors');

function requirePlatformPermission(...requiredPermissions) {
  return (req, _res, next) => {
    const userPermissions = req.platformUser?.permissions || [];

    if (userPermissions.includes(PLATFORM_PERMISSIONS.PLATFORM_FULL)) {
      return next();
    }

    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `Sem permissao de plataforma. Necessario: ${requiredPermissions.join(' ou ')}`
        )
      );
    }

    next();
  };
}

module.exports = requirePlatformPermission;

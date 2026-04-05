// src/middlewares/authorize.js
// Verifica se o perfil do usuário tem a permissão necessária.
// Deve ser usado DEPOIS do authenticate e tenantIsolation.
//
// Uso: authorize('members:read') ou authorize('members:write', 'members:delete')
// Se 'admin:full' estiver nas permissões, libera qualquer coisa.

const { PERMISSIONS } = require('../config/constants');
const { ForbiddenError } = require('../utils/errors');

function authorize(...requiredPermissions) {
  return (req, _res, next) => {
    const userPermissions = req.user?.permissions || [];

    // admin:full = bypass total
    if (userPermissions.includes(PERMISSIONS.ADMIN_FULL)) {
      return next();
    }

    // Verifica se o usuário tem ALGUMA das permissões requeridas
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `Sem permissão. Necessário: ${requiredPermissions.join(' ou ')}`
        )
      );
    }

    next();
  };
}

module.exports = authorize;

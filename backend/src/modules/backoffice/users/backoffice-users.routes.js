const { Router } = require('express');
const controller = require('./backoffice-users.controller');
const validate = require('../../../middlewares/validate');
const requirePlatformAuth = require('../../../middlewares/requirePlatformAuth');
const requirePlatformPermission = require('../../../middlewares/requirePlatformPermission');
const { PLATFORM_PERMISSIONS } = require('../../../config/constants');
const {
  listPlatformUsersValidation,
  createPlatformUserValidation,
  updatePlatformUserValidation,
  updatePlatformUserStatusValidation,
  listEligibleTenantsValidation,
  tenantIdValidation,
  provisionTenantInitialAdminValidation,
} = require('./backoffice-users.validation');

const router = Router();

router.get(
  '/platform',
  requirePlatformAuth,
  requirePlatformPermission(
    PLATFORM_PERMISSIONS.PLATFORM_USERS_READ,
    PLATFORM_PERMISSIONS.PLATFORM_USERS_WRITE
  ),
  listPlatformUsersValidation,
  validate,
  controller.listPlatformUsers
);

router.get(
  '/platform/roles',
  requirePlatformAuth,
  requirePlatformPermission(
    PLATFORM_PERMISSIONS.PLATFORM_USERS_READ,
    PLATFORM_PERMISSIONS.PLATFORM_USERS_WRITE
  ),
  controller.listPlatformRoles
);

router.post(
  '/platform',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.PLATFORM_USERS_WRITE),
  createPlatformUserValidation,
  validate,
  controller.createPlatformUser
);

router.patch(
  '/platform/:id',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.PLATFORM_USERS_WRITE),
  updatePlatformUserValidation,
  validate,
  controller.updatePlatformUser
);

router.patch(
  '/platform/:id/status',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.PLATFORM_USERS_WRITE),
  updatePlatformUserStatusValidation,
  validate,
  controller.updatePlatformUserStatus
);

router.get(
  '/tenant-initial-admin/eligible-tenants',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.TENANT_INITIAL_ADMIN_WRITE),
  listEligibleTenantsValidation,
  validate,
  controller.listEligibleTenants
);

router.get(
  '/tenant-initial-admin/tenants/:tenantId/profiles',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.TENANT_INITIAL_ADMIN_WRITE),
  tenantIdValidation,
  validate,
  controller.listTenantInitialAdminProfiles
);

router.post(
  '/tenant-initial-admin',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.TENANT_INITIAL_ADMIN_WRITE),
  provisionTenantInitialAdminValidation,
  validate,
  controller.provisionTenantInitialAdmin
);

module.exports = router;

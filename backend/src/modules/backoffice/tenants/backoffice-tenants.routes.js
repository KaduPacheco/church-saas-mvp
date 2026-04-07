const { Router } = require('express');
const controller = require('./backoffice-tenants.controller');
const {
  createTenantOnboardingValidation,
  listTenantsValidation,
  tenantIdValidation,
  updateTenantStatusValidation,
  updateTenantUserStatusValidation,
} = require('./backoffice-tenants.validation');
const validate = require('../../../middlewares/validate');
const requirePlatformAuth = require('../../../middlewares/requirePlatformAuth');
const requirePlatformPermission = require('../../../middlewares/requirePlatformPermission');
const { PLATFORM_PERMISSIONS } = require('../../../config/constants');

const router = Router();

router.post(
  '/',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.TENANTS_WRITE),
  requirePlatformPermission(PLATFORM_PERMISSIONS.TENANT_INITIAL_ADMIN_WRITE),
  createTenantOnboardingValidation,
  validate,
  controller.createTenantOnboarding
);

router.get(
  '/',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.TENANTS_READ),
  listTenantsValidation,
  validate,
  controller.listTenants
);

router.get(
  '/:id',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.TENANTS_READ),
  tenantIdValidation,
  validate,
  controller.getTenantById
);

router.get(
  '/:id/congregations',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.CONGREGATIONS_READ),
  tenantIdValidation,
  validate,
  controller.listTenantCongregations
);

router.get(
  '/:id/users',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.USERS_READ),
  tenantIdValidation,
  validate,
  controller.listTenantUsers
);

router.patch(
  '/:id/status',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.TENANTS_WRITE),
  updateTenantStatusValidation,
  validate,
  controller.updateTenantStatus
);

router.patch(
  '/:id/users/:userId/status',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.USERS_WRITE),
  updateTenantUserStatusValidation,
  validate,
  controller.updateTenantUserStatus
);

module.exports = router;

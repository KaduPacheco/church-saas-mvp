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

module.exports = router;

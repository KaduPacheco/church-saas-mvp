const { Router } = require('express');
const controller = require('./roles.controller');
const {
  listRolesValidation,
  roleIdValidation,
  createRoleValidation,
  updateRoleValidation,
  updateRoleStatusValidation,
} = require('./roles.validation');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate');
const tenantIsolation = require('../../middlewares/tenantIsolation');
const authorize = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../config/constants');

const router = Router();

router.use(authenticate, tenantIsolation);

router.get(
  '/',
  authorize(PERMISSIONS.ROLES_READ),
  listRolesValidation,
  validate,
  controller.listRoles
);

router.get(
  '/:id',
  authorize(PERMISSIONS.ROLES_READ),
  roleIdValidation,
  validate,
  controller.getRoleById
);

router.post(
  '/',
  authorize(PERMISSIONS.ROLES_WRITE),
  createRoleValidation,
  validate,
  controller.createRole
);

router.put(
  '/:id',
  authorize(PERMISSIONS.ROLES_WRITE),
  updateRoleValidation,
  validate,
  controller.updateRole
);

router.patch(
  '/:id/status',
  authorize(PERMISSIONS.ROLES_DELETE),
  updateRoleStatusValidation,
  validate,
  controller.updateRoleStatus
);

module.exports = router;

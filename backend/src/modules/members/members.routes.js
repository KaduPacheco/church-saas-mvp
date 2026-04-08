const { Router } = require('express');
const controller = require('./members.controller');
const {
  listMembersValidation,
  memberIdValidation,
  createMemberValidation,
  updateMemberValidation,
  updateMemberStatusValidation,
} = require('./members.validation');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate');
const tenantIsolation = require('../../middlewares/tenantIsolation');
const authorize = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../config/constants');

const router = Router();

router.use(authenticate, tenantIsolation);

router.get(
  '/',
  authorize(PERMISSIONS.MEMBERS_READ),
  listMembersValidation,
  validate,
  controller.listMembers
);

router.get(
  '/:id',
  authorize(PERMISSIONS.MEMBERS_READ),
  memberIdValidation,
  validate,
  controller.getMemberById
);

router.post(
  '/',
  authorize(PERMISSIONS.MEMBERS_WRITE),
  createMemberValidation,
  validate,
  controller.createMember
);

router.put(
  '/:id',
  authorize(PERMISSIONS.MEMBERS_WRITE),
  updateMemberValidation,
  validate,
  controller.updateMember
);

router.patch(
  '/:id/status',
  authorize(PERMISSIONS.MEMBERS_DELETE),
  updateMemberStatusValidation,
  validate,
  controller.updateMemberStatus
);

module.exports = router;

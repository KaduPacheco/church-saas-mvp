const { Router } = require('express');
const controller = require('./backoffice-audit.controller');
const { listAuditLogsValidation } = require('./backoffice-audit.validation');
const validate = require('../../../middlewares/validate');
const requirePlatformAuth = require('../../../middlewares/requirePlatformAuth');
const requirePlatformPermission = require('../../../middlewares/requirePlatformPermission');
const { PLATFORM_PERMISSIONS } = require('../../../config/constants');

const router = Router();

router.get(
  '/',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.AUDIT_READ),
  listAuditLogsValidation,
  validate,
  controller.listAuditLogs
);

module.exports = router;

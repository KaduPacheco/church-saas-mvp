const { Router } = require('express');
const controller = require('./backoffice-dashboard.controller');
const requirePlatformAuth = require('../../../middlewares/requirePlatformAuth');
const requirePlatformPermission = require('../../../middlewares/requirePlatformPermission');
const { PLATFORM_PERMISSIONS } = require('../../../config/constants');

const router = Router();

router.get(
  '/summary',
  requirePlatformAuth,
  requirePlatformPermission(PLATFORM_PERMISSIONS.DASHBOARD_READ),
  controller.getSummary
);

module.exports = router;

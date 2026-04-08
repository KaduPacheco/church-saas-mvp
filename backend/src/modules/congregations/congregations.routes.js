const { Router } = require('express');
const controller = require('./congregations.controller');
const {
  listCongregationsValidation,
  congregationIdValidation,
  createCongregationValidation,
  updateCongregationValidation,
  updateCongregationStatusValidation,
} = require('./congregations.validation');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate');
const tenantIsolation = require('../../middlewares/tenantIsolation');
const authorize = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../config/constants');

const router = Router();

router.use(authenticate, tenantIsolation);

router.get(
  '/',
  authorize(PERMISSIONS.CHURCHES_READ),
  listCongregationsValidation,
  validate,
  controller.listCongregations
);

router.get(
  '/:id',
  authorize(PERMISSIONS.CHURCHES_READ),
  congregationIdValidation,
  validate,
  controller.getCongregationById
);

router.post(
  '/',
  authorize(PERMISSIONS.CHURCHES_WRITE),
  createCongregationValidation,
  validate,
  controller.createCongregation
);

router.put(
  '/:id',
  authorize(PERMISSIONS.CHURCHES_WRITE),
  updateCongregationValidation,
  validate,
  controller.updateCongregation
);

router.patch(
  '/:id/status',
  authorize(PERMISSIONS.CHURCHES_WRITE),
  updateCongregationStatusValidation,
  validate,
  controller.updateCongregationStatus
);

module.exports = router;

const { Router } = require('express');
const controller = require('./backoffice-auth.controller');
const { loginValidation } = require('./backoffice-auth.validation');
const validate = require('../../../middlewares/validate');
const requirePlatformAuth = require('../../../middlewares/requirePlatformAuth');

const router = Router();

router.post('/login', loginValidation, validate, controller.login);
router.get('/me', requirePlatformAuth, controller.getMe);

module.exports = router;

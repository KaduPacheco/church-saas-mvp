// src/modules/auth/auth.routes.js
// Rotas do módulo de autenticação.
// Rotas públicas: register, login, refresh
// Rotas protegidas: logout, me

const { Router } = require('express');
const controller = require('./auth.controller');
const { registerValidation, loginValidation, refreshValidation } = require('./auth.validation');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate');
const tenantIsolation = require('../../middlewares/tenantIsolation');

const router = Router();

// ── ROTAS PÚBLICAS ─────────────────────────────────────────────────

// POST /api/auth/register — Registrar nova igreja + admin
router.post('/register', registerValidation, validate, controller.register);

// POST /api/auth/login — Login com email/senha
router.post('/login', loginValidation, validate, controller.login);

// POST /api/auth/refresh — Renovar access token
router.post('/refresh', refreshValidation, validate, controller.refresh);

// ── ROTAS PROTEGIDAS ───────────────────────────────────────────────

// POST /api/auth/logout — Invalidar refresh token
router.post('/logout', authenticate, controller.logout);

// GET /api/auth/me — Dados do usuário logado
router.get('/me', authenticate, tenantIsolation, controller.getMe);

module.exports = router;

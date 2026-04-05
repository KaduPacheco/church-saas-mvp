// src/modules/auth/auth.validation.js
// Regras de validação para os endpoints de autenticação.
// Usa express-validator com mensagens em português.

const { body } = require('express-validator');

const registerValidation = [
  body('churchName')
    .trim()
    .notEmpty().withMessage('Nome da igreja é obrigatório')
    .isLength({ min: 3, max: 150 }).withMessage('Nome da igreja deve ter entre 3 e 150 caracteres'),

  body('name')
    .trim()
    .notEmpty().withMessage('Nome do administrador é obrigatório')
    .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha é obrigatória'),
];

const refreshValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token é obrigatório'),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshValidation,
};

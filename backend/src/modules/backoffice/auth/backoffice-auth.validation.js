const { body } = require('express-validator');

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('E-mail e obrigatorio')
    .isEmail()
    .withMessage('E-mail invalido')
    .normalizeEmail(),

  body('password').notEmpty().withMessage('Senha e obrigatoria'),
];

const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token e obrigatorio'),
];

module.exports = {
  loginValidation,
  refreshValidation,
};

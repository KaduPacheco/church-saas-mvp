const { body } = require('express-validator');

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail e obrigatorio')
    .isEmail().withMessage('E-mail invalido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha e obrigatoria'),
];

module.exports = {
  loginValidation,
};

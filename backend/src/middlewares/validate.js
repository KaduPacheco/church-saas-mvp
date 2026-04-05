// src/middlewares/validate.js
// Wrapper do express-validator.
// Coleta erros de validação e retorna 422 com a lista de campos inválidos.
// Uso: router.post('/rota', [...regras], validate, controller.acao)

const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

function validate(req, _res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return next(new ValidationError('Dados inválidos', details));
  }

  next();
}

module.exports = validate;

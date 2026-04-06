const { query } = require('express-validator');

const listAuditLogsValidation = [
  query('action')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Acao deve ter no maximo 120 caracteres'),

  query('targetType')
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage('Tipo de alvo deve ter no maximo 80 caracteres'),

  query('churchId')
    .optional()
    .isUUID().withMessage('Tenant invalido'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Pagina deve ser um numero maior que zero'),

  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Itens por pagina deve estar entre 1 e 100'),
];

module.exports = {
  listAuditLogsValidation,
};

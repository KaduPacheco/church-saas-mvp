const { body, param, query } = require('express-validator');
const { CHURCH_STATUS } = require('../../../config/constants');

const listTenantsValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Busca deve ter no maximo 150 caracteres'),

  query('status')
    .optional()
    .isIn(CHURCH_STATUS).withMessage('Status de tenant invalido'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Pagina deve ser um numero maior que zero'),

  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Itens por pagina deve estar entre 1 e 100'),
];

const tenantIdValidation = [
  param('id')
    .isUUID().withMessage('Tenant invalido'),
];

const tenantUserValidation = [
  ...tenantIdValidation,
  param('userId')
    .isUUID().withMessage('Usuario invalido'),
];

const updateTenantStatusValidation = [
  ...tenantIdValidation,
  body('status')
    .notEmpty().withMessage('Status e obrigatorio')
    .isIn(CHURCH_STATUS).withMessage('Status de tenant invalido'),
];

const updateTenantUserStatusValidation = [
  ...tenantUserValidation,
  body('isActive')
    .notEmpty().withMessage('isActive e obrigatorio')
    .isBoolean().withMessage('isActive deve ser booleano'),
];

module.exports = {
  listTenantsValidation,
  tenantIdValidation,
  tenantUserValidation,
  updateTenantStatusValidation,
  updateTenantUserStatusValidation,
};

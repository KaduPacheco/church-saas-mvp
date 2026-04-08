const { body, param, query } = require('express-validator');
const { CHURCH_STATUS } = require('../../../config/constants');

const createTenantOnboardingValidation = [
  body('churchName')
    .trim()
    .notEmpty().withMessage('Nome da igreja sede e obrigatorio')
    .isLength({ min: 3, max: 150 }).withMessage('Nome da igreja sede deve ter entre 3 e 150 caracteres'),

  body('churchEmail')
    .trim()
    .notEmpty().withMessage('E-mail institucional da igreja e obrigatorio')
    .isEmail().withMessage('E-mail institucional invalido')
    .normalizeEmail(),

  body('churchPhone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 }).withMessage('Telefone da igreja deve ter no maximo 20 caracteres'),

  body('churchDocument')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 }).withMessage('Documento da igreja deve ter no maximo 20 caracteres'),

  body('initialAdminName')
    .trim()
    .notEmpty().withMessage('Nome do admin inicial e obrigatorio')
    .isLength({ min: 3, max: 150 }).withMessage('Nome do admin inicial deve ter entre 3 e 150 caracteres'),

  body('initialAdminEmail')
    .trim()
    .notEmpty().withMessage('E-mail do admin inicial e obrigatorio')
    .isEmail().withMessage('E-mail do admin inicial invalido')
    .normalizeEmail(),

  body('initialAdminPassword')
    .notEmpty().withMessage('Senha inicial e obrigatoria')
    .isLength({ min: 6 }).withMessage('Senha inicial deve ter no minimo 6 caracteres'),
];

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
  createTenantOnboardingValidation,
  listTenantsValidation,
  tenantIdValidation,
  tenantUserValidation,
  updateTenantStatusValidation,
  updateTenantUserStatusValidation,
};

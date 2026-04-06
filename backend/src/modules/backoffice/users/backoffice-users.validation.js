const { body, param, query } = require('express-validator');

const PLATFORM_USER_STATUS = ['active', 'inactive'];

const listPlatformUsersValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Busca deve ter no maximo 150 caracteres'),

  query('status')
    .optional()
    .isIn(PLATFORM_USER_STATUS).withMessage('Status de usuario da plataforma invalido'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Pagina deve ser um numero maior que zero'),

  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Itens por pagina deve estar entre 1 e 100'),
];

const platformUserIdValidation = [
  param('id')
    .isUUID().withMessage('Usuario da plataforma invalido'),
];

const createPlatformUserValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('E-mail e obrigatorio')
    .isEmail().withMessage('E-mail invalido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha e obrigatoria')
    .isLength({ min: 6 }).withMessage('Senha deve ter no minimo 6 caracteres'),

  body('roleId')
    .notEmpty().withMessage('Papel da plataforma e obrigatorio')
    .isUUID().withMessage('Papel da plataforma invalido'),
];

const updatePlatformUserValidation = [
  ...platformUserIdValidation,
  body('name')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('E-mail e obrigatorio')
    .isEmail().withMessage('E-mail invalido')
    .normalizeEmail(),

  body('roleId')
    .notEmpty().withMessage('Papel da plataforma e obrigatorio')
    .isUUID().withMessage('Papel da plataforma invalido'),
];

const updatePlatformUserStatusValidation = [
  ...platformUserIdValidation,
  body('isActive')
    .notEmpty().withMessage('isActive e obrigatorio')
    .isBoolean().withMessage('isActive deve ser booleano'),
];

const listEligibleTenantsValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Busca deve ter no maximo 150 caracteres'),
];

const tenantIdValidation = [
  param('tenantId')
    .isUUID().withMessage('Igreja cliente invalida'),
];

const provisionTenantInitialAdminValidation = [
  body('tenantId')
    .notEmpty().withMessage('Igreja cliente e obrigatoria')
    .isUUID().withMessage('Igreja cliente invalida'),

  body('name')
    .trim()
    .notEmpty().withMessage('Nome do administrador inicial e obrigatorio')
    .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('E-mail e obrigatorio')
    .isEmail().withMessage('E-mail invalido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha e obrigatoria')
    .isLength({ min: 6 }).withMessage('Senha deve ter no minimo 6 caracteres'),

  body('permissionProfileId')
    .notEmpty().withMessage('Perfil tecnico inicial e obrigatorio')
    .isUUID().withMessage('Perfil tecnico inicial invalido'),
];

module.exports = {
  listPlatformUsersValidation,
  platformUserIdValidation,
  createPlatformUserValidation,
  updatePlatformUserValidation,
  updatePlatformUserStatusValidation,
  listEligibleTenantsValidation,
  tenantIdValidation,
  provisionTenantInitialAdminValidation,
};

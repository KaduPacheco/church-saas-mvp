const { body, param, query } = require('express-validator');

const ROLE_STATUS = ['active', 'inactive'];

const listRolesValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Busca deve ter no maximo 150 caracteres'),

  query('status')
    .optional()
    .isIn(ROLE_STATUS).withMessage('Status de cargo invalido'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Pagina deve ser um numero maior que zero'),

  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Itens por pagina deve estar entre 1 e 100'),
];

const roleIdValidation = [
  param('id')
    .isUUID().withMessage('Cargo ministerial invalido'),
];

const createRoleValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome do cargo ministerial e obrigatorio')
    .isLength({ min: 3, max: 100 }).withMessage('Nome do cargo ministerial deve ter entre 3 e 100 caracteres'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 65535 }).withMessage('Descricao invalida'),
];

const updateRoleValidation = [
  ...roleIdValidation,
  ...createRoleValidation,
];

const updateRoleStatusValidation = [
  ...roleIdValidation,
  body('status')
    .notEmpty().withMessage('Status e obrigatorio')
    .isIn(ROLE_STATUS).withMessage('Status de cargo invalido'),
];

module.exports = {
  ROLE_STATUS,
  listRolesValidation,
  roleIdValidation,
  createRoleValidation,
  updateRoleValidation,
  updateRoleStatusValidation,
};

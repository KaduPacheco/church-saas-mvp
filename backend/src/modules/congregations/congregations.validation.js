const { body, param, query } = require('express-validator');
const { CONGREGATION_STATUS } = require('../../config/constants');

const listCongregationsValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Busca deve ter no maximo 150 caracteres'),

  query('status')
    .optional()
    .isIn(CONGREGATION_STATUS).withMessage('Status de congregacao invalido'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Pagina deve ser um numero maior que zero'),

  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Itens por pagina deve estar entre 1 e 100'),
];

const congregationIdValidation = [
  param('id')
    .isUUID().withMessage('Congregacao invalida'),
];

const createCongregationValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome da congregacao e obrigatorio')
    .isLength({ min: 3, max: 150 }).withMessage('Nome da congregacao deve ter entre 3 e 150 caracteres'),

  body('address')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 }).withMessage('Endereco deve ter no maximo 255 caracteres'),

  body('status')
    .optional()
    .isIn(CONGREGATION_STATUS).withMessage('Status de congregacao invalido'),
];

const updateCongregationValidation = [
  ...congregationIdValidation,
  body('name')
    .trim()
    .notEmpty().withMessage('Nome da congregacao e obrigatorio')
    .isLength({ min: 3, max: 150 }).withMessage('Nome da congregacao deve ter entre 3 e 150 caracteres'),

  body('address')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 }).withMessage('Endereco deve ter no maximo 255 caracteres'),
];

const updateCongregationStatusValidation = [
  ...congregationIdValidation,
  body('status')
    .notEmpty().withMessage('Status e obrigatorio')
    .isIn(CONGREGATION_STATUS).withMessage('Status de congregacao invalido'),
];

module.exports = {
  listCongregationsValidation,
  congregationIdValidation,
  createCongregationValidation,
  updateCongregationValidation,
  updateCongregationStatusValidation,
};

const { body, param, query } = require('express-validator');
const {
  MEMBER_STATUS,
  MEMBER_GENDER,
  MEMBER_MARITAL_STATUS,
} = require('../../config/constants');

const listMembersValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Busca deve ter no maximo 150 caracteres'),

  query('status')
    .optional()
    .isIn(MEMBER_STATUS).withMessage('Status de membro invalido'),

  query('congregationId')
    .optional()
    .isUUID().withMessage('Congregacao invalida'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Pagina deve ser um numero maior que zero'),

  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Itens por pagina deve estar entre 1 e 100'),
];

const memberIdValidation = [
  param('id')
    .isUUID().withMessage('Membro invalido'),
];

const createMemberValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome do membro e obrigatorio')
    .isLength({ min: 3, max: 150 }).withMessage('Nome do membro deve ter entre 3 e 150 caracteres'),

  body('congregationId')
    .optional({ nullable: true })
    .isUUID().withMessage('Congregacao invalida'),

  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('E-mail invalido')
    .normalizeEmail(),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 }).withMessage('Telefone deve ter no maximo 20 caracteres'),

  body('document')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 }).withMessage('Documento deve ter no maximo 20 caracteres'),

  body('gender')
    .optional({ values: 'falsy' })
    .isIn(MEMBER_GENDER).withMessage('Genero invalido'),

  body('maritalStatus')
    .optional({ values: 'falsy' })
    .isIn(MEMBER_MARITAL_STATUS).withMessage('Estado civil invalido'),

  body('birthDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Data de nascimento invalida'),

  body('baptismDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Data de batismo invalida'),

  body('membershipDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Data de membresia invalida'),

  body('addressStreet')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 65535 }).withMessage('Logradouro invalido'),

  body('addressNumber')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 }).withMessage('Numero deve ter no maximo 20 caracteres'),

  body('addressNeighborhood')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Bairro deve ter no maximo 100 caracteres'),

  body('addressCity')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Cidade deve ter no maximo 100 caracteres'),

  body('addressState')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 2 }).withMessage('UF deve ter 2 caracteres'),

  body('addressZipcode')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 }).withMessage('CEP deve ter no maximo 20 caracteres'),
];

const updateMemberValidation = [
  ...memberIdValidation,
  ...createMemberValidation,
];

const updateMemberStatusValidation = [
  ...memberIdValidation,
  body('status')
    .notEmpty().withMessage('Status e obrigatorio')
    .isIn(MEMBER_STATUS).withMessage('Status de membro invalido'),
];

module.exports = {
  listMembersValidation,
  memberIdValidation,
  createMemberValidation,
  updateMemberValidation,
  updateMemberStatusValidation,
};

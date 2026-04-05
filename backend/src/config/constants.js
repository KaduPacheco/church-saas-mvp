// src/config/constants.js
// Valores fixos, enums e permissões do sistema.
// Fonte única de verdade para validações, seeds e API.

// ── PERMISSÕES GRANULARES ──────────────────────────────────────────

const PERMISSIONS = {
  MEMBERS_READ: 'members:read',
  MEMBERS_WRITE: 'members:write',
  MEMBERS_DELETE: 'members:delete',

  ROLES_READ: 'roles:read',
  ROLES_WRITE: 'roles:write',
  ROLES_DELETE: 'roles:delete',

  PROFILES_READ: 'profiles:read',
  PROFILES_WRITE: 'profiles:write',
  PROFILES_DELETE: 'profiles:delete',

  CHURCHES_READ: 'churches:read',
  CHURCHES_WRITE: 'churches:write',

  FINANCIAL_READ: 'financial:read',
  FINANCIAL_WRITE: 'financial:write',
  FINANCIAL_DELETE: 'financial:delete',

  DASHBOARD_READ: 'dashboard:read',

  ADMIN_FULL: 'admin:full',
};

// Catálogo agrupado por módulo (usado pelo endpoint GET /profiles/permissions)
const PERMISSIONS_CATALOG = [
  {
    module: 'Membros',
    permissions: [
      { key: PERMISSIONS.MEMBERS_READ, label: 'Visualizar membros' },
      { key: PERMISSIONS.MEMBERS_WRITE, label: 'Criar e editar membros' },
      { key: PERMISSIONS.MEMBERS_DELETE, label: 'Inativar e excluir membros' },
    ],
  },
  {
    module: 'Cargos',
    permissions: [
      { key: PERMISSIONS.ROLES_READ, label: 'Visualizar cargos' },
      { key: PERMISSIONS.ROLES_WRITE, label: 'Criar e editar cargos' },
      { key: PERMISSIONS.ROLES_DELETE, label: 'Excluir cargos' },
    ],
  },
  {
    module: 'Perfis de Acesso',
    permissions: [
      { key: PERMISSIONS.PROFILES_READ, label: 'Visualizar perfis' },
      { key: PERMISSIONS.PROFILES_WRITE, label: 'Criar e editar perfis' },
      { key: PERMISSIONS.PROFILES_DELETE, label: 'Excluir perfis' },
    ],
  },
  {
    module: 'Congregações',
    permissions: [
      { key: PERMISSIONS.CHURCHES_READ, label: 'Visualizar congregações' },
      { key: PERMISSIONS.CHURCHES_WRITE, label: 'Criar e editar congregações' },
    ],
  },
  {
    module: 'Financeiro',
    permissions: [
      { key: PERMISSIONS.FINANCIAL_READ, label: 'Visualizar transações e relatórios' },
      { key: PERMISSIONS.FINANCIAL_WRITE, label: 'Criar e editar transações' },
      { key: PERMISSIONS.FINANCIAL_DELETE, label: 'Cancelar transações' },
    ],
  },
  {
    module: 'Dashboard',
    permissions: [
      { key: PERMISSIONS.DASHBOARD_READ, label: 'Acessar painel de resumo' },
    ],
  },
  {
    module: 'Administração',
    permissions: [
      { key: PERMISSIONS.ADMIN_FULL, label: 'Acesso total (ignora todas as permissões)' },
    ],
  },
];

// Lista plana de todas as permissões válidas (para validação)
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// ── CARGOS MINISTERIAIS PADRÃO (seeds) ─────────────────────────────

const SYSTEM_ROLES = [
  { name: 'Pastor', description: 'Líder espiritual da igreja ou congregação' },
  { name: 'Obreiro', description: 'Apoio ativo no ministério e operações' },
  { name: 'Diácono', description: 'Serviço à comunidade e assistência' },
  { name: 'Diaconisa', description: 'Serviço à comunidade e assistência' },
  { name: 'Missionário', description: 'Evangelismo, missões e plantação de igrejas' },
  { name: 'Líder de Ministério', description: 'Coordena um ministério específico' },
  { name: 'Membro', description: 'Membro regular da comunidade' },
];

// ── PERFIS DE ACESSO PADRÃO (seeds) ────────────────────────────────

const SYSTEM_PROFILES = [
  {
    name: 'Administrador Geral',
    description: 'Acesso total ao sistema. Gerencia sede e todas as congregações.',
    permissions: [PERMISSIONS.ADMIN_FULL],
  },
  {
    name: 'Administrador de Congregação',
    description: 'Acesso total, restrito à sua congregação.',
    permissions: [
      PERMISSIONS.MEMBERS_READ, PERMISSIONS.MEMBERS_WRITE, PERMISSIONS.MEMBERS_DELETE,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.FINANCIAL_READ, PERMISSIONS.FINANCIAL_WRITE, PERMISSIONS.FINANCIAL_DELETE,
      PERMISSIONS.CHURCHES_READ,
      PERMISSIONS.DASHBOARD_READ,
    ],
  },
  {
    name: 'Operador',
    description: 'Pode cadastrar e editar membros e cargos. Sem acesso financeiro.',
    permissions: [
      PERMISSIONS.MEMBERS_READ, PERMISSIONS.MEMBERS_WRITE,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.CHURCHES_READ,
      PERMISSIONS.DASHBOARD_READ,
    ],
  },
  {
    name: 'Tesoureiro',
    description: 'Acesso completo ao financeiro. Pode consultar membros.',
    permissions: [
      PERMISSIONS.FINANCIAL_READ, PERMISSIONS.FINANCIAL_WRITE, PERMISSIONS.FINANCIAL_DELETE,
      PERMISSIONS.MEMBERS_READ,
      PERMISSIONS.DASHBOARD_READ,
    ],
  },
  {
    name: 'Visualizador',
    description: 'Apenas consulta. Não pode criar, editar nem excluir nada.',
    permissions: [
      PERMISSIONS.MEMBERS_READ,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.CHURCHES_READ,
      PERMISSIONS.DASHBOARD_READ,
    ],
  },
];

// ── CATEGORIAS FINANCEIRAS PADRÃO (seeds) ──────────────────────────

const SYSTEM_FINANCIAL_CATEGORIES = [
  // Entradas
  { name: 'Dízimo', type: 'income', description: 'Contribuição dizimal dos membros' },
  { name: 'Oferta', type: 'income', description: 'Ofertas coletadas no culto' },
  { name: 'Campanha', type: 'income', description: 'Campanhas especiais' },
  { name: 'Doação', type: 'income', description: 'Doações avulsas' },
  { name: 'Evento', type: 'income', description: 'Receita de eventos' },
  { name: 'Outras Entradas', type: 'income', description: 'Receitas não classificáveis' },
  // Saídas
  { name: 'Aluguel', type: 'expense', description: 'Aluguel de templo ou imóvel' },
  { name: 'Energia Elétrica', type: 'expense', description: 'Conta de luz' },
  { name: 'Água', type: 'expense', description: 'Conta de água' },
  { name: 'Manutenção', type: 'expense', description: 'Reparos e conservação' },
  { name: 'Material', type: 'expense', description: 'Materiais diversos' },
  { name: 'Salários', type: 'expense', description: 'Pagamento de pessoal' },
  { name: 'Missões', type: 'expense', description: 'Sustento missionário' },
  { name: 'Transporte', type: 'expense', description: 'Combustível e viagens' },
  { name: 'Outras Saídas', type: 'expense', description: 'Despesas não classificáveis' },
];

// ── ENUMERAÇÕES ────────────────────────────────────────────────────

const CHURCH_STATUS = ['active', 'inactive', 'suspended'];
const CHURCH_PLANS = ['free', 'basic', 'premium'];
const CONGREGATION_STATUS = ['active', 'inactive'];
const MEMBER_STATUS = ['active', 'inactive', 'transferred', 'deceased'];
const MEMBER_GENDER = ['male', 'female', 'other'];
const MEMBER_MARITAL_STATUS = ['single', 'married', 'widowed', 'divorced'];
const TRANSACTION_TYPES = ['income', 'expense'];
const PAYMENT_METHODS = ['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other'];
const TRANSACTION_STATUS = ['confirmed', 'pending', 'cancelled'];

module.exports = {
  PERMISSIONS,
  PERMISSIONS_CATALOG,
  ALL_PERMISSIONS,
  SYSTEM_ROLES,
  SYSTEM_PROFILES,
  SYSTEM_FINANCIAL_CATEGORIES,
  CHURCH_STATUS,
  CHURCH_PLANS,
  CONGREGATION_STATUS,
  MEMBER_STATUS,
  MEMBER_GENDER,
  MEMBER_MARITAL_STATUS,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  TRANSACTION_STATUS,
};

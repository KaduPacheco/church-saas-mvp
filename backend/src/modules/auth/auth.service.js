// src/modules/auth/auth.service.js
// Lógica de negócio de autenticação.
// NÃO conhece Express (req/res). Recebe dados limpos, retorna resultado ou lança erro.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const env = require('../../config/env');
const { SYSTEM_ROLES, SYSTEM_PROFILES, SYSTEM_FINANCIAL_CATEGORIES } = require('../../config/constants');
const { UnauthorizedError, ConflictError, NotFoundError } = require('../../utils/errors');
const logger = require('../../utils/logger');

// ── REGISTRO DE NOVA IGREJA ────────────────────────────────────────

async function register({ churchName, name, email, password }) {
  // Verifica se email já existe globalmente (simplificação do MVP)
  const existingUser = await db('users').where({ email }).first();
  if (existingUser) {
    throw new ConflictError('Este e-mail já está em uso');
  }

  // Usa transação para garantir atomicidade
  const result = await db.transaction(async (trx) => {
    // 1. Criar igreja (tenant)
    const [church] = await trx('churches')
      .insert({
        id: uuidv4(),
        name: churchName,
        plan: 'free',
        status: 'active',
        email,
      })
      .returning('*');

    const churchId = church.id;

    // 2. Criar cargos ministeriais padrão
    const rolesData = SYSTEM_ROLES.map((role) => ({
      id: uuidv4(),
      church_id: churchId,
      name: role.name,
      description: role.description,
      is_system: true,
      is_active: true,
    }));
    await trx('roles').insert(rolesData);

    // 3. Criar perfis de acesso padrão
    const profilesData = SYSTEM_PROFILES.map((profile) => ({
      id: uuidv4(),
      church_id: churchId,
      name: profile.name,
      description: profile.description,
      permissions: JSON.stringify(profile.permissions),
      is_system: true,
      is_active: true,
    }));
    await trx('permission_profiles').insert(profilesData);

    // 4. Criar categorias financeiras padrão
    const categoriesData = SYSTEM_FINANCIAL_CATEGORIES.map((cat) => ({
      id: uuidv4(),
      church_id: churchId,
      name: cat.name,
      type: cat.type,
      description: cat.description,
      is_system: true,
      is_active: true,
    }));
    await trx('financial_categories').insert(categoriesData);

    // 5. Buscar o perfil "Administrador Geral" recém-criado
    const adminProfile = await trx('permission_profiles')
      .where({ church_id: churchId, name: 'Administrador Geral' })
      .first();

    // 6. Criar usuário administrador
    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await trx('users')
      .insert({
        id: uuidv4(),
        church_id: churchId,
        congregation_id: null,
        permission_profile_id: adminProfile.id,
        member_id: null,
        name,
        email,
        password_hash: passwordHash,
        is_active: true,
      })
      .returning('*');

    return { church, user, adminProfile };
  });

  // 7. Gerar tokens
  const { church, user, adminProfile } = result;
  const tokens = generateTokens(user, church, adminProfile);

  // 8. Salvar refresh token no banco
  await saveRefreshToken(user.id, tokens.refreshToken);

  // 9. Atualizar last_login
  await db('users').where({ id: user.id }).update({ last_login: db.fn.now() });

  logger.info(`Nova igreja registrada: ${church.name} (${church.id})`);

  return {
    ...tokens,
    user: formatUserResponse(user, church, adminProfile),
  };
}

// ── LOGIN ──────────────────────────────────────────────────────────

async function login({ email, password }) {
  // Buscar usuário com perfil e igreja
  const user = await db('users')
    .where({ 'users.email': email, 'users.is_active': true })
    .first();

  if (!user) {
    throw new UnauthorizedError('Credenciais inválidas');
  }

  // Verificar igreja ativa
  const church = await db('churches')
    .where({ id: user.church_id })
    .first();

  if (!church || church.status !== 'active') {
    throw new UnauthorizedError('Igreja suspensa ou inativa. Contate o suporte.');
  }

  // Verificar senha
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Credenciais inválidas');
  }

  // Buscar perfil de acesso
  const profile = await db('permission_profiles')
    .where({ id: user.permission_profile_id })
    .first();

  // Gerar tokens
  const tokens = generateTokens(user, church, profile);

  // Salvar refresh token e atualizar last_login
  await db('users')
    .where({ id: user.id })
    .update({
      refresh_token: tokens.refreshToken,
      refresh_token_expires: getRefreshExpiration(),
      last_login: db.fn.now(),
      updated_at: db.fn.now(),
    });

  logger.info(`Login: ${user.name} (${church.name})`);

  return {
    ...tokens,
    user: formatUserResponse(user, church, profile),
  };
}

// ── REFRESH TOKEN ──────────────────────────────────────────────────

async function refresh({ refreshToken }) {
  // Decodificar refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch (err) {
    throw new UnauthorizedError('Refresh token inválido ou expirado');
  }

  // Buscar usuário
  const user = await db('users')
    .where({
      id: decoded.userId,
      church_id: decoded.churchId,
      is_active: true,
    })
    .first();

  if (!user) {
    throw new UnauthorizedError('Usuário não encontrado ou inativo');
  }

  // Verificar se o refresh token bate com o salvo no banco
  if (user.refresh_token !== refreshToken) {
    // Possível roubo de token: limpa tudo
    await db('users')
      .where({ id: user.id })
      .update({ refresh_token: null, refresh_token_expires: null });

    logger.warn(`Possível roubo de refresh token: user ${user.id}`);
    throw new UnauthorizedError('Refresh token inválido. Faça login novamente.');
  }

  // Buscar dados atualizados (perfil pode ter mudado)
  const church = await db('churches').where({ id: user.church_id }).first();
  const profile = await db('permission_profiles').where({ id: user.permission_profile_id }).first();

  if (!church || church.status !== 'active') {
    throw new UnauthorizedError('Igreja suspensa ou inativa');
  }

  // Gerar novos tokens (rotation)
  const tokens = generateTokens(user, church, profile);

  // Salvar novo refresh token
  await saveRefreshToken(user.id, tokens.refreshToken);

  return {
    ...tokens,
    user: formatUserResponse(user, church, profile),
  };
}

// ── LOGOUT ─────────────────────────────────────────────────────────

async function logout(userId) {
  await db('users')
    .where({ id: userId })
    .update({
      refresh_token: null,
      refresh_token_expires: null,
      updated_at: db.fn.now(),
    });

  logger.info(`Logout: user ${userId}`);
}

// ── GET ME (dados do usuário logado) ───────────────────────────────

async function getMe(userId, churchId) {
  const user = await db('users')
    .where({ 'users.id': userId, 'users.church_id': churchId })
    .first();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  const church = await db('churches').where({ id: churchId }).first();
  const profile = await db('permission_profiles').where({ id: user.permission_profile_id }).first();

  // Buscar cargo ministerial se o user tem membro vinculado
  let role = null;
  if (user.member_id) {
    const member = await db('members').where({ id: user.member_id }).first();
    if (member && member.role_id) {
      role = await db('roles').where({ id: member.role_id }).first();
    }
  }

  return formatUserResponse(user, church, profile, role);
}

// ── HELPERS INTERNOS ───────────────────────────────────────────────

function generateTokens(user, church, profile) {
  const permissions = typeof profile.permissions === 'string'
    ? JSON.parse(profile.permissions)
    : profile.permissions;

  const accessToken = jwt.sign(
    {
      userId: user.id,
      churchId: user.church_id,
      congregationId: user.congregation_id || null,
      profileId: profile.id,
      permissions,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      churchId: user.church_id,
    },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
}

async function saveRefreshToken(userId, refreshToken) {
  await db('users')
    .where({ id: userId })
    .update({
      refresh_token: refreshToken,
      refresh_token_expires: getRefreshExpiration(),
      updated_at: db.fn.now(),
    });
}

function getRefreshExpiration() {
  const days = parseInt(env.jwt.refreshExpiresIn) || 7;
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + days);
  return expiration;
}

function formatUserResponse(user, church, profile, role = null) {
  const permissions = typeof profile.permissions === 'string'
    ? JSON.parse(profile.permissions)
    : profile.permissions;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    churchId: church.id,
    churchName: church.name,
    congregationId: user.congregation_id || null,
    profileId: profile.id,
    profileName: profile.name,
    permissions,
    role: role ? { id: role.id, name: role.name } : null,
  };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};

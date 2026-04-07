// src/modules/auth/auth.service.js
// Lógica de negócio de autenticação.
// NÃO conhece Express (req/res). Recebe dados limpos, retorna resultado ou lança erro.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const env = require('../../config/env');
const tenantOnboardingService = require('../tenants/tenant-onboarding.service');
const { UnauthorizedError, NotFoundError } = require('../../utils/errors');
const logger = require('../../utils/logger');

// ── REGISTRO DE NOVA IGREJA ────────────────────────────────────────

async function register({ churchName, name, email, password }) {
  const result = await tenantOnboardingService.onboardTenant({
    churchName,
    churchEmail: email,
    initialAdminName: name,
    initialAdminEmail: email,
    initialAdminPassword: password,
  });

  // 7. Gerar tokens
  const { church, initialAdmin, adminProfile } = result;
  const tokens = generateTokens(initialAdmin, church, adminProfile);

  // 8. Salvar refresh token no banco
  await saveRefreshToken(initialAdmin.id, tokens.refreshToken);

  // 9. Atualizar last_login
  await db('users').where({ id: initialAdmin.id }).update({ last_login: db.fn.now() });

  logger.info(`Nova igreja registrada: ${church.name} (${church.id})`);

  return {
    ...tokens,
    user: formatUserResponse(initialAdmin, church, adminProfile),
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

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../../config/database');
const env = require('../../../config/env');
const { UnauthorizedError, NotFoundError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');
const auditService = require('../audit/audit.service');

async function login({ email, password, ipAddress = null, userAgent = null }) {
  const platformUser = await getPlatformUserRecordByEmail(email);

  if (!platformUser || !platformUser.is_active || !platformUser.role_is_active) {
    throw new UnauthorizedError('Credenciais invalidas');
  }

  const isValidPassword = await bcrypt.compare(password, platformUser.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Credenciais invalidas');
  }

  const permissions = parsePermissions(platformUser.permissions);
  const tokens = generateTokens(platformUser, permissions);

  await saveRefreshToken(platformUser.id, tokens.refreshToken, { updateLastLogin: true });

  await auditService.register({
    actorPlatformUserId: platformUser.id,
    action: 'platform.auth.login',
    targetType: 'platform_user',
    targetId: platformUser.id,
    targetLabel: platformUser.email,
    metadata: {
      role: platformUser.role_slug,
    },
    ipAddress,
    userAgent,
  });

  logger.info(`Login backoffice: ${platformUser.email}`);

  return {
    ...tokens,
    user: formatPlatformUserResponse(platformUser, permissions),
  };
}

async function refresh({ refreshToken }) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.platformJwt.refreshSecret);
  } catch (error) {
    throw new UnauthorizedError('Refresh token da plataforma invalido ou expirado');
  }

  if (decoded.scope !== 'platform' || !decoded.platformUserId) {
    throw new UnauthorizedError('Refresh token da plataforma invalido');
  }

  const platformUser = await getActivePlatformUserRecordById(decoded.platformUserId);

  if (!platformUser) {
    throw new UnauthorizedError('Usuario da plataforma nao encontrado ou inativo');
  }

  if (platformUser.refresh_token !== refreshToken) {
    await clearRefreshToken(platformUser.id);
    logger.warn(`Possivel roubo de refresh token de plataforma: user ${platformUser.id}`);
    throw new UnauthorizedError('Refresh token da plataforma invalido. Faca login novamente.');
  }

  const permissions = parsePermissions(platformUser.permissions);
  const tokens = generateTokens(platformUser, permissions);

  await saveRefreshToken(platformUser.id, tokens.refreshToken);

  return {
    ...tokens,
    user: formatPlatformUserResponse(platformUser, permissions),
  };
}

async function logout(platformUserId) {
  await clearRefreshToken(platformUserId);
  logger.info(`Logout backoffice: user ${platformUserId}`);
}

async function getMe(platformUserId) {
  const platformUser = await getActivePlatformUserRecordById(platformUserId);

  if (!platformUser) {
    throw new NotFoundError('Usuario da plataforma nao encontrado');
  }

  const permissions = parsePermissions(platformUser.permissions);
  return formatPlatformUserResponse(platformUser, permissions);
}

function generateTokens(platformUser, permissions) {
  const accessToken = jwt.sign(
    {
      scope: 'platform',
      platformUserId: platformUser.id,
      roleId: platformUser.role_id,
      roleSlug: platformUser.role_slug,
      permissions,
    },
    env.platformJwt.secret,
    { expiresIn: env.platformJwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    {
      scope: 'platform',
      platformUserId: platformUser.id,
    },
    env.platformJwt.refreshSecret,
    { expiresIn: env.platformJwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
}

async function saveRefreshToken(platformUserId, refreshToken, options = {}) {
  const updatePayload = {
    refresh_token: refreshToken,
    refresh_token_expires: getRefreshExpiration(),
    updated_at: db.fn.now(),
  };

  if (options.updateLastLogin) {
    updatePayload.last_login = db.fn.now();
  }

  await db('platform_users').where({ id: platformUserId }).update(updatePayload);
}

async function clearRefreshToken(platformUserId) {
  await db('platform_users').where({ id: platformUserId }).update({
    refresh_token: null,
    refresh_token_expires: null,
    updated_at: db.fn.now(),
  });
}

function getRefreshExpiration() {
  const days = parseInt(env.platformJwt.refreshExpiresIn, 10) || 7;
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + days);
  return expiration;
}

async function getPlatformUserRecordByEmail(email) {
  return db('platform_users as pu')
    .join('platform_roles as pr', 'pr.id', 'pu.role_id')
    .select(
      'pu.id',
      'pu.role_id',
      'pu.name',
      'pu.email',
      'pu.password_hash',
      'pu.refresh_token',
      'pu.is_active',
      'pu.last_login',
      'pr.slug as role_slug',
      'pr.name as role_name',
      'pr.is_active as role_is_active',
      'pr.permissions'
    )
    .where({ 'pu.email': email })
    .first();
}

async function getActivePlatformUserRecordById(platformUserId) {
  const platformUser = await db('platform_users as pu')
    .join('platform_roles as pr', 'pr.id', 'pu.role_id')
    .select(
      'pu.id',
      'pu.role_id',
      'pu.name',
      'pu.email',
      'pu.refresh_token',
      'pu.is_active',
      'pu.last_login',
      'pr.slug as role_slug',
      'pr.name as role_name',
      'pr.is_active as role_is_active',
      'pr.permissions'
    )
    .where({ 'pu.id': platformUserId, 'pu.is_active': true })
    .first();

  if (!platformUser || !platformUser.role_is_active) {
    return null;
  }

  return platformUser;
}

function parsePermissions(permissions) {
  if (Array.isArray(permissions)) {
    return permissions;
  }

  if (typeof permissions === 'string') {
    return JSON.parse(permissions);
  }

  return [];
}

function formatPlatformUserResponse(platformUser, permissions) {
  return {
    id: platformUser.id,
    name: platformUser.name,
    email: platformUser.email,
    roleId: platformUser.role_id,
    roleSlug: platformUser.role_slug,
    roleName: platformUser.role_name,
    permissions,
    lastLogin: platformUser.last_login || null,
  };
}

module.exports = {
  login,
  refresh,
  logout,
  getMe,
};

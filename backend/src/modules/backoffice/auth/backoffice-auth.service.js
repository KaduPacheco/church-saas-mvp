const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../../config/database');
const env = require('../../../config/env');
const { UnauthorizedError, NotFoundError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');
const auditService = require('../audit/audit.service');

async function login({ email, password, ipAddress = null, userAgent = null }) {
  const platformUser = await db('platform_users as pu')
    .join('platform_roles as pr', 'pr.id', 'pu.role_id')
    .select(
      'pu.id',
      'pu.role_id',
      'pu.name',
      'pu.email',
      'pu.password_hash',
      'pu.is_active',
      'pr.slug as role_slug',
      'pr.name as role_name',
      'pr.is_active as role_is_active',
      'pr.permissions'
    )
    .where({ 'pu.email': email })
    .first();

  if (!platformUser || !platformUser.is_active || !platformUser.role_is_active) {
    throw new UnauthorizedError('Credenciais invalidas');
  }

  const isValidPassword = await bcrypt.compare(password, platformUser.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Credenciais invalidas');
  }

  const permissions = parsePermissions(platformUser.permissions);
  const tokens = generateTokens(platformUser, permissions);

  await db('platform_users')
    .where({ id: platformUser.id })
    .update({
      refresh_token: tokens.refreshToken,
      refresh_token_expires: getRefreshExpiration(),
      last_login: db.fn.now(),
      updated_at: db.fn.now(),
    });

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

async function getMe(platformUserId) {
  const platformUser = await db('platform_users as pu')
    .join('platform_roles as pr', 'pr.id', 'pu.role_id')
    .select(
      'pu.id',
      'pu.role_id',
      'pu.name',
      'pu.email',
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

function getRefreshExpiration() {
  const days = parseInt(env.platformJwt.refreshExpiresIn, 10) || 7;
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + days);
  return expiration;
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
  getMe,
};

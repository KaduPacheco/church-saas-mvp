const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../../../config/database');
const {
  BadRequestError,
  ConflictError,
  NotFoundError,
} = require('../../../utils/errors');
const auditService = require('../audit/audit.service');

async function listPlatformUsers({ search, status, page = 1, perPage = 10 }) {
  const currentPage = Number.parseInt(page, 10) || 1;
  const currentPerPage = Number.parseInt(perPage, 10) || 10;
  const offset = (currentPage - 1) * currentPerPage;

  const baseQuery = db('platform_users as pu')
    .join('platform_roles as pr', 'pr.id', 'pu.role_id')
    .modify((queryBuilder) => {
      if (search) {
        queryBuilder.where((searchQuery) => {
          searchQuery
            .whereILike('pu.name', `%${search}%`)
            .orWhereILike('pu.email', `%${search}%`);
        });
      }

      if (status === 'active') {
        queryBuilder.where('pu.is_active', true);
      }

      if (status === 'inactive') {
        queryBuilder.where('pu.is_active', false);
      }
    });

  const [{ total }] = await baseQuery.clone().countDistinct('pu.id as total');

  const rows = await baseQuery
    .clone()
    .select(
      'pu.id',
      'pu.name',
      'pu.email',
      'pu.is_active',
      'pu.last_login',
      'pu.created_at',
      'pr.id as role_id',
      'pr.slug as role_slug',
      'pr.name as role_name',
      'pr.permissions as role_permissions'
    )
    .orderBy('pu.created_at', 'desc')
    .limit(currentPerPage)
    .offset(offset);

  return {
    data: rows.map(formatPlatformUser),
    meta: {
      page: currentPage,
      perPage: currentPerPage,
      total: parseCount(total),
      totalPages: Math.max(1, Math.ceil(parseCount(total) / currentPerPage)),
    },
  };
}

async function listPlatformRoles() {
  const roles = await db('platform_roles')
    .select('id', 'slug', 'name', 'description', 'permissions')
    .where({ is_active: true })
    .orderBy('name', 'asc');

  return roles.map((role) => ({
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    permissions: parsePermissions(role.permissions),
  }));
}

async function createPlatformUser({
  name,
  email,
  password,
  roleId,
  actorPlatformUserId,
  ipAddress = null,
  userAgent = null,
}) {
  const existingUser = await db('platform_users').where({ email }).first();
  if (existingUser) {
    throw new ConflictError('Ja existe um usuario da plataforma com este e-mail');
  }

  const role = await getActivePlatformRole(roleId);
  const passwordHash = await bcrypt.hash(password, 10);

  const [platformUser] = await db('platform_users')
    .insert({
      id: uuidv4(),
      role_id: role.id,
      name,
      email,
      password_hash: passwordHash,
      is_active: true,
    })
    .returning('*');

  await auditService.register({
    actorPlatformUserId,
    action: 'platform.platform_user.created',
    targetType: 'platform_user',
    targetId: platformUser.id,
    targetLabel: platformUser.email,
    metadata: {
      roleId: role.id,
      roleSlug: role.slug,
      roleName: role.name,
    },
    ipAddress,
    userAgent,
  });

  return getPlatformUserById(platformUser.id);
}

async function updatePlatformUser({
  platformUserId,
  name,
  email,
  roleId,
  actorPlatformUserId,
  ipAddress = null,
  userAgent = null,
}) {
  const existingUser = await getPlatformUserRecordById(platformUserId);
  const role = await getActivePlatformRole(roleId);

  const conflictingUser = await db('platform_users')
    .where({ email })
    .whereNot({ id: platformUserId })
    .first();

  if (conflictingUser) {
    throw new ConflictError('Ja existe um usuario da plataforma com este e-mail');
  }

  await db('platform_users')
    .where({ id: platformUserId })
    .update({
      name,
      email,
      role_id: role.id,
      updated_at: db.fn.now(),
    });

  await auditService.register({
    actorPlatformUserId,
    action: 'platform.platform_user.updated',
    targetType: 'platform_user',
    targetId: existingUser.id,
    targetLabel: email,
    metadata: {
      previousName: existingUser.name,
      newName: name,
      previousEmail: existingUser.email,
      newEmail: email,
      previousRoleSlug: existingUser.role_slug,
      newRoleSlug: role.slug,
    },
    ipAddress,
    userAgent,
  });

  return getPlatformUserById(platformUserId);
}

async function updatePlatformUserStatus({
  platformUserId,
  isActive,
  actorPlatformUserId,
  ipAddress = null,
  userAgent = null,
}) {
  const existingUser = await getPlatformUserRecordById(platformUserId);

  if (existingUser.id === actorPlatformUserId && !isActive) {
    throw new BadRequestError('Voce nao pode inativar a propria conta de plataforma');
  }

  if (existingUser.is_active === isActive) {
    return formatPlatformUser(existingUser);
  }

  await db('platform_users')
    .where({ id: platformUserId })
    .update({
      is_active: isActive,
      updated_at: db.fn.now(),
    });

  await auditService.register({
    actorPlatformUserId,
    action: 'platform.platform_user.status.updated',
    targetType: 'platform_user',
    targetId: existingUser.id,
    targetLabel: existingUser.email,
    metadata: {
      previousIsActive: existingUser.is_active,
      newIsActive: isActive,
    },
    ipAddress,
    userAgent,
  });

  return getPlatformUserById(platformUserId);
}

async function getPlatformUserById(platformUserId) {
  const row = await getPlatformUserRecordById(platformUserId);
  return formatPlatformUser(row);
}

async function getPlatformUserRecordById(platformUserId) {
  const platformUser = await db('platform_users as pu')
    .join('platform_roles as pr', 'pr.id', 'pu.role_id')
    .select(
      'pu.id',
      'pu.name',
      'pu.email',
      'pu.is_active',
      'pu.last_login',
      'pu.created_at',
      'pr.id as role_id',
      'pr.slug as role_slug',
      'pr.name as role_name',
      'pr.permissions as role_permissions'
    )
    .where({ 'pu.id': platformUserId })
    .first();

  if (!platformUser) {
    throw new NotFoundError('Usuario da plataforma nao encontrado');
  }

  return platformUser;
}

async function getActivePlatformRole(roleId) {
  const role = await db('platform_roles')
    .select('id', 'slug', 'name', 'permissions', 'is_active')
    .where({ id: roleId })
    .first();

  if (!role || !role.is_active) {
    throw new NotFoundError('Papel da plataforma nao encontrado');
  }

  return role;
}

function formatPlatformUser(platformUser) {
  return {
    id: platformUser.id,
    name: platformUser.name,
    email: platformUser.email,
    isActive: platformUser.is_active,
    lastLogin: platformUser.last_login || null,
    createdAt: platformUser.created_at,
    role: {
      id: platformUser.role_id,
      slug: platformUser.role_slug,
      name: platformUser.role_name,
      permissions: parsePermissions(platformUser.role_permissions),
    },
  };
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

function parseCount(value) {
  return Number.parseInt(value, 10) || 0;
}

module.exports = {
  listPlatformUsers,
  listPlatformRoles,
  createPlatformUser,
  updatePlatformUser,
  updatePlatformUserStatus,
};

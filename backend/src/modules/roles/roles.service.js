const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { NotFoundError, ConflictError, ForbiddenError } = require('../../utils/errors');

async function listRoles({
  churchId,
  actorCongregationId = null,
  search,
  status,
  page = 1,
  perPage = 10,
}) {
  const currentPage = Number.parseInt(page, 10) || 1;
  const currentPerPage = Number.parseInt(perPage, 10) || 10;
  const offset = (currentPage - 1) * currentPerPage;

  const countQuery = buildVisibleRolesQuery({
    churchId,
    search,
    status,
  });

  const [{ total }] = await countQuery.clone().count('roles.id as total');

  const roles = await buildVisibleRolesQuery({
    churchId,
    search,
    status,
  })
    .select(
      'roles.id',
      'roles.church_id',
      'roles.name',
      'roles.description',
      'roles.is_system',
      'roles.is_active',
      'roles.created_at',
      'roles.updated_at'
    )
    .select(
      db('members')
        .count('*')
        .whereRaw('members.church_id = roles.church_id')
        .whereRaw('members.role_id = roles.id')
        .as('members_count')
    )
    .orderBy('roles.name', 'asc')
    .limit(currentPerPage)
    .offset(offset);

  const summary = await buildRolesSummary({
    churchId,
    actorCongregationId,
    search,
    status,
  });

  return {
    data: roles.map(formatRole),
    meta: {
      page: currentPage,
      perPage: currentPerPage,
      total: parseCount(total),
      totalPages: Math.max(1, Math.ceil(parseCount(total) / currentPerPage)),
    },
    summary,
  };
}

async function getRoleById({ churchId, actorCongregationId = null, roleId }) {
  const role = await findVisibleRole({
    churchId,
    roleId,
  });

  if (!role) {
    throw new NotFoundError('Cargo ministerial nao encontrado');
  }

  return {
    ...formatRole(role),
    scope: actorCongregationId ? 'congregation' : 'tenant',
    scopeLabel: actorCongregationId ? 'Congregacao vinculada' : 'Sede / tenant completo',
  };
}

async function createRole({
  churchId,
  actorCongregationId = null,
  name,
  description = null,
}) {
  ensureTenantWideManagement(actorCongregationId);

  const normalizedName = normalizeRequiredText(name);
  const normalizedDescription = normalizeOptionalText(description);

  await ensureUniqueRoleName({
    churchId,
    name: normalizedName,
  });

  const [createdRole] = await db('roles')
    .insert({
      id: uuidv4(),
      church_id: churchId,
      name: normalizedName,
      description: normalizedDescription,
      is_system: false,
      is_active: true,
    })
    .returning('*');

  return getRoleById({
    churchId,
    roleId: createdRole.id,
  });
}

async function updateRole({
  churchId,
  actorCongregationId = null,
  roleId,
  name,
  description,
}) {
  ensureTenantWideManagement(actorCongregationId);

  const existingRole = await db('roles')
    .where({ id: roleId, church_id: churchId })
    .first();

  if (!existingRole) {
    throw new NotFoundError('Cargo ministerial nao encontrado');
  }

  ensureRoleCanBeManaged(existingRole, 'alterados');

  const normalizedName = normalizeRequiredText(name);
  const normalizedDescription =
    description === undefined
      ? existingRole.description
      : normalizeOptionalText(description);

  await ensureUniqueRoleName({
    churchId,
    name: normalizedName,
    excludeId: roleId,
  });

  await db('roles')
    .where({ id: roleId, church_id: churchId })
    .update({
      name: normalizedName,
      description: normalizedDescription,
      updated_at: db.fn.now(),
    });

  return getRoleById({
    churchId,
    roleId,
  });
}

async function updateRoleStatus({
  churchId,
  actorCongregationId = null,
  roleId,
  status,
}) {
  ensureTenantWideManagement(actorCongregationId);

  const existingRole = await db('roles')
    .where({ id: roleId, church_id: churchId })
    .first();

  if (!existingRole) {
    throw new NotFoundError('Cargo ministerial nao encontrado');
  }

  ensureRoleCanBeManaged(existingRole, 'inativados');

  const nextIsActive = status === 'active';

  if (Boolean(existingRole.is_active) === nextIsActive) {
    return getRoleById({
      churchId,
      roleId,
    });
  }

  await db('roles')
    .where({ id: roleId, church_id: churchId })
    .update({
      is_active: nextIsActive,
      updated_at: db.fn.now(),
    });

  return getRoleById({
    churchId,
    roleId,
  });
}

function buildVisibleRolesQuery({ churchId, search, status }) {
  return db('roles')
    .where({ church_id: churchId })
    .modify((queryBuilder) => {
      if (search) {
        queryBuilder.andWhereILike('name', `%${search}%`);
      }

      if (status) {
        queryBuilder.andWhere('is_active', status === 'active');
      }
    });
}

async function buildRolesSummary({
  churchId,
  actorCongregationId = null,
  search,
  status,
}) {
  const visibleRoles = await buildVisibleRolesQuery({
    churchId,
    search,
    status,
  })
    .clone()
    .select('id', 'is_active', 'is_system');

  const roleIds = visibleRoles.map((role) => role.id);
  const active = visibleRoles.filter((role) => Boolean(role.is_active)).length;
  const inactive = visibleRoles.length - active;
  const system = visibleRoles.filter((role) => Boolean(role.is_system)).length;
  const custom = visibleRoles.length - system;

  let linkedMembers = 0;

  if (roleIds.length > 0) {
    const [membersResult] = await db('members')
      .where({ church_id: churchId })
      .whereIn('role_id', roleIds)
      .count('* as total');

    linkedMembers = parseCount(membersResult?.total);
  }

  return {
    total: visibleRoles.length,
    active,
    inactive,
    system,
    custom,
    linkedMembers,
    scope: actorCongregationId ? 'congregation' : 'tenant',
    scopeLabel: actorCongregationId ? 'Congregacao vinculada' : 'Sede / tenant completo',
  };
}

async function findVisibleRole({ churchId, roleId }) {
  return db('roles')
    .select(
      'roles.id',
      'roles.church_id',
      'roles.name',
      'roles.description',
      'roles.is_system',
      'roles.is_active',
      'roles.created_at',
      'roles.updated_at'
    )
    .select(
      db('members')
        .count('*')
        .whereRaw('members.church_id = roles.church_id')
        .whereRaw('members.role_id = roles.id')
        .as('members_count')
    )
    .where({
      'roles.id': roleId,
      'roles.church_id': churchId,
    })
    .first();
}

async function ensureUniqueRoleName({ churchId, name, excludeId = null }) {
  const existingRole = await db('roles')
    .where({ church_id: churchId })
    .modify((queryBuilder) => {
      queryBuilder.whereRaw('LOWER(name) = LOWER(?)', [name]);

      if (excludeId) {
        queryBuilder.andWhereNot('id', excludeId);
      }
    })
    .first();

  if (existingRole) {
    throw new ConflictError('Ja existe um cargo ministerial com este nome neste tenant');
  }
}

function ensureTenantWideManagement(actorCongregationId) {
  if (actorCongregationId) {
    throw new ForbiddenError(
      'Usuarios vinculados a uma congregacao especifica nao podem gerenciar o catalogo de cargos ministeriais'
    );
  }
}

function ensureRoleCanBeManaged(role, action) {
  if (role.is_system) {
    throw new ForbiddenError(
      `Cargos ministeriais padrao do onboarding nao podem ser ${action}`
    );
  }
}

function formatRole(role) {
  return {
    id: role.id,
    churchId: role.church_id,
    name: role.name,
    description: role.description,
    isSystem: Boolean(role.is_system),
    isActive: Boolean(role.is_active),
    status: role.is_active ? 'active' : 'inactive',
    createdAt: role.created_at,
    updatedAt: role.updated_at,
    counts: {
      members: parseCount(role.members_count),
    },
  };
}

function parseCount(value) {
  return Number.parseInt(value, 10) || 0;
}

function normalizeRequiredText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const normalizedValue = value.trim();
  return normalizedValue || null;
}

module.exports = {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  updateRoleStatus,
  ensureUniqueRoleName,
  ensureTenantWideManagement,
  ensureRoleCanBeManaged,
};

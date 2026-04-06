const db = require('../../../config/database');
const { NotFoundError } = require('../../../utils/errors');
const auditService = require('../audit/audit.service');

async function listTenants({ search, status, page = 1, perPage = 10 }) {
  const currentPage = Number.parseInt(page, 10) || 1;
  const currentPerPage = Number.parseInt(perPage, 10) || 10;
  const offset = (currentPage - 1) * currentPerPage;

  const baseQuery = db('churches').modify((queryBuilder) => {
    if (search) {
      queryBuilder.where((searchQuery) => {
        searchQuery
          .whereILike('name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('document', `%${search}%`);
      });
    }

    if (status) {
      queryBuilder.where('status', status);
    }
  });

  const [{ total }] = await baseQuery.clone().count('* as total');

  const tenants = await baseQuery
    .clone()
    .select(
      'id',
      'name',
      'email',
      'phone',
      'document',
      'plan',
      'status',
      'created_at'
    )
    .select(
      db('congregations')
        .count('*')
        .whereRaw('congregations.church_id = churches.id')
        .as('congregations_count')
    )
    .select(
      db('users')
        .count('*')
        .whereRaw('users.church_id = churches.id')
        .as('users_count')
    )
    .select(
      db('members')
        .count('*')
        .whereRaw('members.church_id = churches.id')
        .as('members_count')
    )
    .orderBy('created_at', 'desc')
    .limit(currentPerPage)
    .offset(offset);

  return {
    data: tenants.map(formatTenantListItem),
    meta: {
      page: currentPage,
      perPage: currentPerPage,
      total: parseCount(total),
      totalPages: Math.max(1, Math.ceil(parseCount(total) / currentPerPage)),
    },
  };
}

async function getTenantById(tenantId) {
  const tenant = await db('churches')
    .select(
      'id',
      'name',
      'email',
      'phone',
      'document',
      'plan',
      'status',
      'created_at',
      'updated_at'
    )
    .select(
      db('congregations')
        .count('*')
        .whereRaw('congregations.church_id = churches.id')
        .as('congregations_count')
    )
    .select(
      db('users')
        .count('*')
        .whereRaw('users.church_id = churches.id')
        .as('users_count')
    )
    .select(
      db('members')
        .count('*')
        .whereRaw('members.church_id = churches.id')
        .as('members_count')
    )
    .where({ id: tenantId })
    .first();

  if (!tenant) {
    throw new NotFoundError('Tenant nao encontrado');
  }

  return formatTenantDetail(tenant);
}

async function updateTenantStatus({
  tenantId,
  status,
  actorPlatformUserId,
  ipAddress = null,
  userAgent = null,
}) {
  const tenant = await db('churches')
    .where({ id: tenantId })
    .first();

  if (!tenant) {
    throw new NotFoundError('Tenant nao encontrado');
  }

  if (tenant.status === status) {
    return getTenantById(tenantId);
  }

  await db('churches')
    .where({ id: tenantId })
    .update({
      status,
      updated_at: db.fn.now(),
    });

  await auditService.register({
    actorPlatformUserId,
    churchId: tenant.id,
    action: 'platform.tenant.status.updated',
    targetType: 'tenant',
    targetId: tenant.id,
    targetLabel: tenant.name,
    metadata: {
      previousStatus: tenant.status,
      newStatus: status,
    },
    ipAddress,
    userAgent,
  });

  return getTenantById(tenantId);
}

async function listTenantCongregations(tenantId) {
  await ensureTenantExists(tenantId);

  const congregations = await db('congregations')
    .select(
      'id',
      'church_id',
      'name',
      'address',
      'status',
      'created_at',
      'updated_at'
    )
    .where({ church_id: tenantId })
    .orderBy('name', 'asc');

  return congregations.map((congregation) => ({
    id: congregation.id,
    tenantId: congregation.church_id,
    name: congregation.name,
    address: congregation.address,
    status: congregation.status,
    createdAt: congregation.created_at,
    updatedAt: congregation.updated_at,
  }));
}

async function listTenantUsers(tenantId) {
  await ensureTenantExists(tenantId);

  const users = await db('users as u')
    .leftJoin('permission_profiles as pp', 'pp.id', 'u.permission_profile_id')
    .leftJoin('congregations as c', 'c.id', 'u.congregation_id')
    .select(
      'u.id',
      'u.church_id',
      'u.congregation_id',
      'u.name',
      'u.email',
      'u.is_active',
      'u.last_login',
      'u.created_at',
      'pp.id as profile_id',
      'pp.name as profile_name',
      'pp.permissions as profile_permissions',
      'c.name as congregation_name'
    )
    .where({ 'u.church_id': tenantId })
    .orderBy('u.name', 'asc');

  return users.map((user) => ({
    id: user.id,
    tenantId: user.church_id,
    name: user.name,
    email: user.email,
    isActive: user.is_active,
    lastLogin: user.last_login,
    createdAt: user.created_at,
    profile: {
      id: user.profile_id,
      name: user.profile_name,
      permissions: parsePermissions(user.profile_permissions),
    },
    scope: {
      type: user.congregation_id ? 'congregation' : 'tenant',
      congregationId: user.congregation_id,
      congregationName: user.congregation_name || null,
      label: user.congregation_id
        ? `Congregacao: ${user.congregation_name}`
        : 'Sede / tenant completo',
    },
  }));
}

async function updateTenantUserStatus({
  tenantId,
  userId,
  isActive,
  actorPlatformUserId,
  ipAddress = null,
  userAgent = null,
}) {
  const tenant = await ensureTenantExists(tenantId);

  const user = await db('users')
    .where({ id: userId, church_id: tenantId })
    .first();

  if (!user) {
    throw new NotFoundError('Usuario do tenant nao encontrado');
  }

  if (user.is_active === isActive) {
    const users = await listTenantUsers(tenantId);
    return users.find((tenantUser) => tenantUser.id === userId) || null;
  }

  await db('users')
    .where({ id: userId })
    .update({
      is_active: isActive,
      updated_at: db.fn.now(),
    });

  await auditService.register({
    actorPlatformUserId,
    churchId: tenant.id,
    action: 'platform.tenant.user.status.updated',
    targetType: 'tenant_user',
    targetId: user.id,
    targetLabel: user.email,
    metadata: {
      tenantId: tenant.id,
      tenantName: tenant.name,
      previousIsActive: user.is_active,
      newIsActive: isActive,
    },
    ipAddress,
    userAgent,
  });

  const users = await listTenantUsers(tenantId);
  return users.find((tenantUser) => tenantUser.id === userId) || null;
}

function formatTenantListItem(tenant) {
  return {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone,
    document: tenant.document,
    plan: tenant.plan,
    status: tenant.status,
    createdAt: tenant.created_at,
    counts: {
      congregations: parseCount(tenant.congregations_count),
      users: parseCount(tenant.users_count),
      members: parseCount(tenant.members_count),
    },
  };
}

function formatTenantDetail(tenant) {
  return {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone,
    document: tenant.document,
    plan: tenant.plan,
    status: tenant.status,
    createdAt: tenant.created_at,
    updatedAt: tenant.updated_at,
    counts: {
      congregations: parseCount(tenant.congregations_count),
      users: parseCount(tenant.users_count),
      members: parseCount(tenant.members_count),
    },
  };
}

function parseCount(value) {
  return Number.parseInt(value, 10) || 0;
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

async function ensureTenantExists(tenantId) {
  const tenant = await db('churches')
    .select('id', 'name')
    .where({ id: tenantId })
    .first();

  if (!tenant) {
    throw new NotFoundError('Tenant nao encontrado');
  }

  return tenant;
}

module.exports = {
  listTenants,
  getTenantById,
  updateTenantStatus,
  listTenantCongregations,
  listTenantUsers,
  updateTenantUserStatus,
};

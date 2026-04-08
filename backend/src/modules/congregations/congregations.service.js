const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { NotFoundError, ConflictError, ForbiddenError } = require('../../utils/errors');

async function listCongregations({
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

  const countQuery = buildVisibleCongregationsQuery({
    churchId,
    actorCongregationId,
    search,
    status,
  });

  const [{ total }] = await countQuery.clone().count('* as total');

  const congregations = await buildVisibleCongregationsQuery({
    churchId,
    actorCongregationId,
    search,
    status,
  })
    .select(
      'congregations.id',
      'congregations.church_id',
      'congregations.name',
      'congregations.address',
      'congregations.status',
      'congregations.created_at',
      'congregations.updated_at'
    )
    .select(
      db('users')
        .count('*')
        .whereRaw('users.church_id = congregations.church_id')
        .whereRaw('users.congregation_id = congregations.id')
        .as('users_count')
    )
    .select(
      db('members')
        .count('*')
        .whereRaw('members.church_id = congregations.church_id')
        .whereRaw('members.congregation_id = congregations.id')
        .as('members_count')
    )
    .orderBy('congregations.name', 'asc')
    .limit(currentPerPage)
    .offset(offset);

  const summary = await buildCongregationsSummary({
    churchId,
    actorCongregationId,
    search,
    status,
  });

  return {
    data: congregations.map(formatCongregation),
    meta: {
      page: currentPage,
      perPage: currentPerPage,
      total: parseCount(total),
      totalPages: Math.max(1, Math.ceil(parseCount(total) / currentPerPage)),
    },
    summary,
  };
}

async function getCongregationById({ churchId, actorCongregationId = null, congregationId }) {
  const congregation = await findVisibleCongregation({
    churchId,
    actorCongregationId,
    congregationId,
  });

  if (!congregation) {
    throw new NotFoundError('Congregacao nao encontrada');
  }

  return formatCongregation(congregation);
}

async function createCongregation({
  churchId,
  actorCongregationId = null,
  name,
  address = null,
  status = 'active',
}) {
  ensureTenantWideManagement(actorCongregationId);

  const normalizedName = normalizeRequiredText(name);
  const normalizedAddress = normalizeOptionalText(address);

  await ensureUniqueCongregationName({
    churchId,
    name: normalizedName,
  });

  const [createdCongregation] = await db('congregations')
    .insert({
      id: uuidv4(),
      church_id: churchId,
      name: normalizedName,
      address: normalizedAddress,
      status,
    })
    .returning('*');

  return getCongregationById({
    churchId,
    congregationId: createdCongregation.id,
  });
}

async function updateCongregation({
  churchId,
  actorCongregationId = null,
  congregationId,
  name,
  address = null,
}) {
  ensureTenantWideManagement(actorCongregationId);

  const congregation = await db('congregations')
    .where({ id: congregationId, church_id: churchId })
    .first();

  if (!congregation) {
    throw new NotFoundError('Congregacao nao encontrada');
  }

  const normalizedName = normalizeRequiredText(name);
  const normalizedAddress = normalizeOptionalText(address);

  await ensureUniqueCongregationName({
    churchId,
    name: normalizedName,
    excludeId: congregationId,
  });

  await db('congregations')
    .where({ id: congregationId, church_id: churchId })
    .update({
      name: normalizedName,
      address: normalizedAddress,
      updated_at: db.fn.now(),
    });

  return getCongregationById({
    churchId,
    congregationId,
  });
}

async function updateCongregationStatus({
  churchId,
  actorCongregationId = null,
  congregationId,
  status,
}) {
  ensureTenantWideManagement(actorCongregationId);

  const congregation = await db('congregations')
    .where({ id: congregationId, church_id: churchId })
    .first();

  if (!congregation) {
    throw new NotFoundError('Congregacao nao encontrada');
  }

  if (congregation.status === status) {
    return getCongregationById({
      churchId,
      congregationId,
    });
  }

  await db('congregations')
    .where({ id: congregationId, church_id: churchId })
    .update({
      status,
      updated_at: db.fn.now(),
    });

  return getCongregationById({
    churchId,
    congregationId,
  });
}

function buildVisibleCongregationsQuery({
  churchId,
  actorCongregationId = null,
  search,
  status,
}) {
  return db('congregations').where({ church_id: churchId }).modify((queryBuilder) => {
    if (actorCongregationId) {
      queryBuilder.andWhere('id', actorCongregationId);
    }

    if (search) {
      queryBuilder.andWhereILike('name', `%${search}%`);
    }

    if (status) {
      queryBuilder.andWhere('status', status);
    }
  });
}

async function buildCongregationsSummary({
  churchId,
  actorCongregationId = null,
  search,
  status,
}) {
  const visibleCongregations = await buildVisibleCongregationsQuery({
    churchId,
    actorCongregationId,
    search,
    status,
  })
    .clone()
    .select('id', 'status');

  const congregationIds = visibleCongregations.map((congregation) => congregation.id);
  const active = visibleCongregations.filter((congregation) => congregation.status === 'active').length;
  const inactive = visibleCongregations.filter((congregation) => congregation.status === 'inactive').length;

  let linkedUsers = 0;
  let linkedMembers = 0;

  if (congregationIds.length > 0) {
    const [usersResult] = await db('users')
      .where({ church_id: churchId })
      .whereIn('congregation_id', congregationIds)
      .count('* as total');

    const [membersResult] = await db('members')
      .where({ church_id: churchId })
      .whereIn('congregation_id', congregationIds)
      .count('* as total');

    linkedUsers = parseCount(usersResult?.total);
    linkedMembers = parseCount(membersResult?.total);
  }

  return {
    total: visibleCongregations.length,
    active,
    inactive,
    linkedUsers,
    linkedMembers,
    scope: actorCongregationId ? 'congregation' : 'tenant',
    scopeLabel: actorCongregationId ? 'Congregacao vinculada' : 'Sede / tenant completo',
  };
}

async function findVisibleCongregation({ churchId, actorCongregationId = null, congregationId }) {
  return db('congregations')
    .select(
      'congregations.id',
      'congregations.church_id',
      'congregations.name',
      'congregations.address',
      'congregations.status',
      'congregations.created_at',
      'congregations.updated_at'
    )
    .select(
      db('users')
        .count('*')
        .whereRaw('users.church_id = congregations.church_id')
        .whereRaw('users.congregation_id = congregations.id')
        .as('users_count')
    )
    .select(
      db('members')
        .count('*')
        .whereRaw('members.church_id = congregations.church_id')
        .whereRaw('members.congregation_id = congregations.id')
        .as('members_count')
    )
    .where({
      'congregations.id': congregationId,
      'congregations.church_id': churchId,
    })
    .modify((queryBuilder) => {
      if (actorCongregationId) {
        queryBuilder.andWhere('congregations.id', actorCongregationId);
      }
    })
    .first();
}

async function ensureUniqueCongregationName({ churchId, name, excludeId = null }) {
  const existingCongregation = await db('congregations')
    .where({ church_id: churchId })
    .modify((queryBuilder) => {
      queryBuilder.whereRaw('LOWER(name) = LOWER(?)', [name]);

      if (excludeId) {
        queryBuilder.andWhereNot('id', excludeId);
      }
    })
    .first();

  if (existingCongregation) {
    throw new ConflictError('Ja existe uma congregacao com este nome neste tenant');
  }
}

function ensureTenantWideManagement(actorCongregationId) {
  if (actorCongregationId) {
    throw new ForbiddenError(
      'Usuarios vinculados a uma congregacao especifica nao podem gerenciar o cadastro de congregacoes'
    );
  }
}

function formatCongregation(congregation) {
  return {
    id: congregation.id,
    churchId: congregation.church_id,
    name: congregation.name,
    address: congregation.address,
    status: congregation.status,
    createdAt: congregation.created_at,
    updatedAt: congregation.updated_at,
    counts: {
      users: parseCount(congregation.users_count),
      members: parseCount(congregation.members_count),
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
  listCongregations,
  getCongregationById,
  createCongregation,
  updateCongregation,
  updateCongregationStatus,
  ensureUniqueCongregationName,
  ensureTenantWideManagement,
};

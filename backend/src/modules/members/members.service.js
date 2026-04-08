const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');

async function listMembers({
  churchId,
  actorCongregationId = null,
  search,
  status,
  congregationId,
  page = 1,
  perPage = 10,
}) {
  const currentPage = Number.parseInt(page, 10) || 1;
  const currentPerPage = Number.parseInt(perPage, 10) || 10;
  const offset = (currentPage - 1) * currentPerPage;
  const effectiveCongregationId = await resolveCongregationScopeFilter({
    churchId,
    actorCongregationId,
    congregationId,
  });

  const countQuery = buildVisibleMembersQuery({
    churchId,
    actorCongregationId,
    search,
    status,
    congregationId: effectiveCongregationId,
  });

  const [{ total }] = await countQuery.clone().count('m.id as total');

  const members = await buildVisibleMembersQuery({
    churchId,
    actorCongregationId,
    search,
    status,
    congregationId: effectiveCongregationId,
  })
    .select(
      'm.id',
      'm.church_id',
      'm.congregation_id',
      'm.role_id',
      'm.name',
      'm.email',
      'm.phone',
      'm.document',
      'm.status',
      'm.gender',
      'm.marital_status',
      'm.birth_date',
      'm.baptism_date',
      'm.membership_date',
      'm.address_street',
      'm.address_number',
      'm.address_neighborhood',
      'm.address_city',
      'm.address_state',
      'm.address_zipcode',
      'm.observations',
      'm.created_at',
      'm.updated_at',
      'c.name as congregation_name',
      'r.name as role_name',
      'r.is_active as role_is_active',
      'r.is_system as role_is_system'
    )
    .orderBy('m.name', 'asc')
    .limit(currentPerPage)
    .offset(offset);

  const summary = await buildMembersSummary({
    churchId,
    actorCongregationId,
    search,
    status,
    congregationId: effectiveCongregationId,
  });

  return {
    data: members.map(formatMember),
    meta: {
      page: currentPage,
      perPage: currentPerPage,
      total: parseCount(total),
      totalPages: Math.max(1, Math.ceil(parseCount(total) / currentPerPage)),
    },
    summary,
  };
}

async function getMemberById({ churchId, actorCongregationId = null, memberId }) {
  const member = await findVisibleMember({
    churchId,
    actorCongregationId,
    memberId,
  });

  if (!member) {
    throw new NotFoundError('Membro nao encontrado');
  }

  return formatMember(member);
}

async function createMember({
  churchId,
  actorCongregationId = null,
  name,
  congregationId = null,
  roleId = null,
  email,
  phone,
  document,
  gender,
  maritalStatus,
  birthDate,
  baptismDate,
  membershipDate,
  addressStreet,
  addressNumber,
  addressNeighborhood,
  addressCity,
  addressState,
  addressZipcode,
  observations,
}) {
  const targetCongregationId = await resolveMutationCongregationId({
    churchId,
    actorCongregationId,
    congregationId,
  });
  const targetRoleId = await resolveMutationRoleId({
    churchId,
    roleId,
  });

  const [createdMember] = await db('members')
    .insert({
      id: uuidv4(),
      church_id: churchId,
      congregation_id: targetCongregationId,
      role_id: targetRoleId,
      name: normalizeRequiredText(name),
      email: normalizeOptionalEmail(email),
      phone: normalizeOptionalText(phone),
      document: normalizeOptionalText(document),
      status: 'active',
      gender: normalizeOptionalText(gender),
      marital_status: normalizeOptionalText(maritalStatus),
      birth_date: normalizeOptionalDate(birthDate),
      baptism_date: normalizeOptionalDate(baptismDate),
      membership_date: normalizeOptionalDate(membershipDate),
      address_street: normalizeOptionalText(addressStreet),
      address_number: normalizeOptionalText(addressNumber),
      address_neighborhood: normalizeOptionalText(addressNeighborhood),
      address_city: normalizeOptionalText(addressCity),
      address_state: normalizeOptionalState(addressState),
      address_zipcode: normalizeOptionalText(addressZipcode),
      observations: normalizeOptionalText(observations),
    })
    .returning('*');

  return getMemberById({
    churchId,
    actorCongregationId,
    memberId: createdMember.id,
  });
}

async function updateMember({
  churchId,
  actorCongregationId = null,
  memberId,
  name,
  congregationId,
  roleId,
  email,
  phone,
  document,
  gender,
  maritalStatus,
  birthDate,
  baptismDate,
  membershipDate,
  addressStreet,
  addressNumber,
  addressNeighborhood,
  addressCity,
  addressState,
  addressZipcode,
  observations,
}) {
  const existingMember = await findVisibleMember({
    churchId,
    actorCongregationId,
    memberId,
  });

  if (!existingMember) {
    throw new NotFoundError('Membro nao encontrado');
  }

  const targetCongregationId = await resolveMutationCongregationId({
    churchId,
    actorCongregationId,
    congregationId:
      congregationId === undefined ? existingMember.congregation_id : congregationId,
  });
  const targetRoleId = await resolveMutationRoleId({
    churchId,
    roleId: roleId === undefined ? existingMember.role_id : roleId,
    currentRoleId: existingMember.role_id,
  });

  await db('members')
    .where({ id: memberId, church_id: churchId })
    .update({
      congregation_id: targetCongregationId,
      role_id: targetRoleId,
      name: normalizeRequiredText(name),
      email: email === undefined ? existingMember.email : normalizeOptionalEmail(email),
      phone: phone === undefined ? existingMember.phone : normalizeOptionalText(phone),
      document: document === undefined ? existingMember.document : normalizeOptionalText(document),
      gender: gender === undefined ? existingMember.gender : normalizeOptionalText(gender),
      marital_status:
        maritalStatus === undefined
          ? existingMember.marital_status
          : normalizeOptionalText(maritalStatus),
      birth_date:
        birthDate === undefined ? existingMember.birth_date : normalizeOptionalDate(birthDate),
      baptism_date:
        baptismDate === undefined
          ? existingMember.baptism_date
          : normalizeOptionalDate(baptismDate),
      membership_date:
        membershipDate === undefined
          ? existingMember.membership_date
          : normalizeOptionalDate(membershipDate),
      address_street:
        addressStreet === undefined
          ? existingMember.address_street
          : normalizeOptionalText(addressStreet),
      address_number:
        addressNumber === undefined
          ? existingMember.address_number
          : normalizeOptionalText(addressNumber),
      address_neighborhood:
        addressNeighborhood === undefined
          ? existingMember.address_neighborhood
          : normalizeOptionalText(addressNeighborhood),
      address_city:
        addressCity === undefined ? existingMember.address_city : normalizeOptionalText(addressCity),
      address_state:
        addressState === undefined
          ? existingMember.address_state
          : normalizeOptionalState(addressState),
      address_zipcode:
        addressZipcode === undefined
          ? existingMember.address_zipcode
          : normalizeOptionalText(addressZipcode),
      observations:
        observations === undefined
          ? existingMember.observations
          : normalizeOptionalText(observations),
      updated_at: db.fn.now(),
    });

  return getMemberById({
    churchId,
    actorCongregationId,
    memberId,
  });
}

async function updateMemberStatus({
  churchId,
  actorCongregationId = null,
  memberId,
  status,
}) {
  const existingMember = await findVisibleMember({
    churchId,
    actorCongregationId,
    memberId,
  });

  if (!existingMember) {
    throw new NotFoundError('Membro nao encontrado');
  }

  if (existingMember.status === status) {
    return formatMember(existingMember);
  }

  await db('members')
    .where({ id: memberId, church_id: churchId })
    .update({
      status,
      updated_at: db.fn.now(),
    });

  return getMemberById({
    churchId,
    actorCongregationId,
    memberId,
  });
}

function buildVisibleMembersQuery({
  churchId,
  actorCongregationId = null,
  search,
  status,
  congregationId = null,
}) {
  return db('members as m')
    .leftJoin('congregations as c', 'c.id', 'm.congregation_id')
    .leftJoin('roles as r', 'r.id', 'm.role_id')
    .where({ 'm.church_id': churchId })
    .modify((queryBuilder) => {
      if (actorCongregationId) {
        queryBuilder.andWhere('m.congregation_id', actorCongregationId);
      } else if (congregationId) {
        queryBuilder.andWhere('m.congregation_id', congregationId);
      }

      if (status) {
        queryBuilder.andWhere('m.status', status);
      }

      if (search) {
        queryBuilder.andWhere((searchQuery) => {
          searchQuery
            .whereILike('m.name', `%${search}%`)
            .orWhereILike('m.email', `%${search}%`)
            .orWhereILike('m.phone', `%${search}%`)
            .orWhereILike('m.document', `%${search}%`);
        });
      }
    });
}

async function buildMembersSummary({
  churchId,
  actorCongregationId = null,
  search,
  status,
  congregationId = null,
}) {
  const visibleMembers = await buildVisibleMembersQuery({
    churchId,
    actorCongregationId,
    search,
    status,
    congregationId,
  })
    .clone()
    .select('m.status');

  return {
    total: visibleMembers.length,
    active: visibleMembers.filter((member) => member.status === 'active').length,
    inactive: visibleMembers.filter((member) => member.status === 'inactive').length,
    transferred: visibleMembers.filter((member) => member.status === 'transferred').length,
    deceased: visibleMembers.filter((member) => member.status === 'deceased').length,
    scope: actorCongregationId ? 'congregation' : 'tenant',
    scopeLabel: actorCongregationId ? 'Congregacao vinculada' : 'Sede / tenant completo',
  };
}

async function findVisibleMember({
  churchId,
  actorCongregationId = null,
  memberId,
}) {
  return buildVisibleMembersQuery({
    churchId,
    actorCongregationId,
  })
    .select(
      'm.id',
      'm.church_id',
      'm.congregation_id',
      'm.role_id',
      'm.name',
      'm.email',
      'm.phone',
      'm.document',
      'm.status',
      'm.gender',
      'm.marital_status',
      'm.birth_date',
      'm.baptism_date',
      'm.membership_date',
      'm.address_street',
      'm.address_number',
      'm.address_neighborhood',
      'm.address_city',
      'm.address_state',
      'm.address_zipcode',
      'm.observations',
      'm.created_at',
      'm.updated_at',
      'c.name as congregation_name',
      'r.name as role_name',
      'r.is_active as role_is_active',
      'r.is_system as role_is_system'
    )
    .andWhere('m.id', memberId)
    .first();
}

async function resolveCongregationScopeFilter({
  churchId,
  actorCongregationId = null,
  congregationId,
}) {
  if (actorCongregationId) {
    if (congregationId && congregationId !== actorCongregationId) {
      throw new ForbiddenError(
        'Usuarios vinculados a uma congregacao especifica nao podem consultar membros de outra congregacao'
      );
    }

    return actorCongregationId;
  }

  if (!congregationId) {
    return null;
  }

  await ensureCongregationBelongsToTenant(churchId, congregationId);
  return congregationId;
}

async function resolveMutationCongregationId({
  churchId,
  actorCongregationId = null,
  congregationId,
}) {
  if (actorCongregationId) {
    if (!congregationId || congregationId !== actorCongregationId) {
      throw new ForbiddenError(
        'Usuarios vinculados a uma congregacao especifica so podem operar membros da propria congregacao'
      );
    }

    return actorCongregationId;
  }

  if (!congregationId) {
    return null;
  }

  await ensureCongregationBelongsToTenant(churchId, congregationId);
  return congregationId;
}

async function ensureCongregationBelongsToTenant(churchId, congregationId) {
  const congregation = await db('congregations')
    .where({ id: congregationId, church_id: churchId })
    .first();

  if (!congregation) {
    throw new NotFoundError('Congregacao nao encontrada no tenant atual');
  }

  return congregation;
}

async function resolveMutationRoleId({
  churchId,
  roleId,
  currentRoleId = null,
}) {
  if (!roleId) {
    return null;
  }

  const role = await ensureRoleBelongsToTenant(churchId, roleId);

  if (!role.is_active && role.id !== currentRoleId) {
    throw new ForbiddenError(
      'Nao e permitido atribuir um cargo ministerial inativo a um membro'
    );
  }

  return role.id;
}

async function ensureRoleBelongsToTenant(churchId, roleId) {
  const role = await db('roles')
    .where({ id: roleId, church_id: churchId })
    .first();

  if (!role) {
    throw new NotFoundError('Cargo ministerial nao encontrado no tenant atual');
  }

  return role;
}

function formatMember(member) {
  return {
    id: member.id,
    churchId: member.church_id,
    congregationId: member.congregation_id,
    roleId: member.role_id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    document: member.document,
    status: member.status,
    gender: member.gender,
    maritalStatus: member.marital_status,
    birthDate: member.birth_date,
    baptismDate: member.baptism_date,
    membershipDate: member.membership_date,
    observations: member.observations,
    createdAt: member.created_at,
    updatedAt: member.updated_at,
    congregation: member.congregation_id
      ? {
          id: member.congregation_id,
          name: member.congregation_name,
        }
      : null,
    role: member.role_id
      ? {
          id: member.role_id,
          name: member.role_name,
          status: member.role_is_active ? 'active' : 'inactive',
          isSystem: Boolean(member.role_is_system),
        }
      : null,
    address: {
      street: member.address_street,
      number: member.address_number,
      neighborhood: member.address_neighborhood,
      city: member.address_city,
      state: member.address_state,
      zipcode: member.address_zipcode,
      label: buildAddressLabel(member),
    },
  };
}

function buildAddressLabel(member) {
  const parts = [
    member.address_street,
    member.address_number,
    member.address_neighborhood,
    member.address_city,
    member.address_state,
    member.address_zipcode,
  ].filter(Boolean);

  return parts.join(', ') || null;
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

function normalizeOptionalEmail(value) {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue || null;
}

function normalizeOptionalDate(value) {
  if (!value) {
    return null;
  }

  return value;
}

function normalizeOptionalState(value) {
  const normalizedValue = normalizeOptionalText(value);
  return normalizedValue ? normalizedValue.toUpperCase() : null;
}

module.exports = {
  listMembers,
  getMemberById,
  createMember,
  updateMember,
  updateMemberStatus,
  ensureCongregationBelongsToTenant,
  ensureRoleBelongsToTenant,
  resolveCongregationScopeFilter,
  resolveMutationCongregationId,
  resolveMutationRoleId,
};

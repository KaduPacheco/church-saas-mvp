const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const {
  SYSTEM_FINANCIAL_CATEGORIES,
  SYSTEM_PROFILES,
  SYSTEM_ROLES,
} = require('../../config/constants');
const { ConflictError, NotFoundError } = require('../../utils/errors');

async function onboardTenant({
  churchName,
  churchEmail,
  churchPhone = null,
  churchDocument = null,
  churchPlan = 'free',
  churchStatus = 'active',
  initialAdminName,
  initialAdminEmail,
  initialAdminPassword,
}) {
  await ensureChurchEmailAvailable(churchEmail);
  await ensureTenantUserEmailAvailable(initialAdminEmail);

  return db.transaction(async (trx) => {
    const [church] = await trx('churches')
      .insert({
        id: uuidv4(),
        name: churchName,
        plan: churchPlan,
        status: churchStatus,
        email: churchEmail,
        phone: churchPhone,
        document: churchDocument,
      })
      .returning('*');

    await seedTenantBase(trx, church.id);

    const adminProfile = await trx('permission_profiles')
      .where({
        church_id: church.id,
        name: 'Administrador Geral',
      })
      .first();

    if (!adminProfile) {
      throw new NotFoundError('Perfil tecnico inicial nao encontrado para a nova igreja cliente');
    }

    const passwordHash = await bcrypt.hash(initialAdminPassword, 10);

    const [initialAdmin] = await trx('users')
      .insert({
        id: uuidv4(),
        church_id: church.id,
        congregation_id: null,
        permission_profile_id: adminProfile.id,
        member_id: null,
        name: initialAdminName,
        email: initialAdminEmail,
        password_hash: passwordHash,
        is_active: true,
      })
      .returning('*');

    return { church, initialAdmin, adminProfile };
  });
}

async function seedTenantBase(trx, churchId) {
  const rolesData = SYSTEM_ROLES.map((role) => ({
    id: uuidv4(),
    church_id: churchId,
    name: role.name,
    description: role.description,
    is_system: true,
    is_active: true,
  }));

  await trx('roles').insert(rolesData);

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

  const categoriesData = SYSTEM_FINANCIAL_CATEGORIES.map((category) => ({
    id: uuidv4(),
    church_id: churchId,
    name: category.name,
    type: category.type,
    description: category.description,
    is_system: true,
    is_active: true,
  }));

  await trx('financial_categories').insert(categoriesData);
}

async function ensureChurchEmailAvailable(email) {
  const existingChurch = await db('churches').where({ email }).first();

  if (existingChurch) {
    throw new ConflictError('Ja existe uma igreja cliente com este e-mail institucional');
  }
}

async function ensureTenantUserEmailAvailable(email) {
  const existingUser = await db('users').where({ email }).first();

  if (existingUser) {
    throw new ConflictError('Ja existe um usuario da igreja com este e-mail');
  }
}

module.exports = {
  onboardTenant,
};

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const {
  SYSTEM_FINANCIAL_CATEGORIES,
  SYSTEM_PROFILES,
  SYSTEM_ROLES,
} = require('../../config/constants');
const { ConflictError, NotFoundError } = require('../../utils/errors');

const INITIAL_ADMIN_PROFILE_NAME = 'Administrador Geral';

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
  const input = normalizeOnboardingInput({
    churchName,
    churchEmail,
    churchPhone,
    churchDocument,
    churchPlan,
    churchStatus,
    initialAdminName,
    initialAdminEmail,
    initialAdminPassword,
  });

  return db.transaction(async (trx) => {
    await ensureChurchEmailAvailable(trx, input.churchEmail);

    const church = await createChurch(trx, input);

    await seedTenantBase(trx, church.id);

    const { initialAdmin, adminProfile } = await provisionInitialAdminWithTrx(trx, {
      churchId: church.id,
      initialAdminName: input.initialAdminName,
      initialAdminEmail: input.initialAdminEmail,
      initialAdminPassword: input.initialAdminPassword,
    });

    return { church, initialAdmin, adminProfile };
  });
}

async function provisionInitialAdminForExistingTenant({
  churchId,
  initialAdminName,
  initialAdminEmail,
  initialAdminPassword,
}) {
  const input = normalizeInitialAdminProvisionInput({
    churchId,
    initialAdminName,
    initialAdminEmail,
    initialAdminPassword,
  });

  return db.transaction(async (trx) => {
    const church = await getChurchOrFail(trx, input.churchId);
    const { initialAdmin, adminProfile } = await provisionInitialAdminWithTrx(trx, input);

    return { church, initialAdmin, adminProfile };
  });
}

async function createChurch(trx, {
  churchName,
  churchEmail,
  churchPhone,
  churchDocument,
  churchPlan,
  churchStatus,
}) {
  try {
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

    return church;
  } catch (error) {
    if (isUniqueViolation(error, 'churches_email_unique', 'email')) {
      throw new ConflictError('Ja existe uma igreja cliente com este e-mail institucional');
    }

    throw error;
  }
}

async function findInitialAdminProfile(trx, churchId) {
  return trx('permission_profiles')
    .where({
      church_id: churchId,
      name: INITIAL_ADMIN_PROFILE_NAME,
    })
    .first();
}

async function getChurchOrFail(trx, churchId) {
  const church = await trx('churches')
    .where({ id: churchId })
    .first();

  if (!church) {
    throw new NotFoundError('Tenant nao encontrado');
  }

  return church;
}

async function provisionInitialAdminWithTrx(trx, {
  churchId,
  initialAdminName,
  initialAdminEmail,
  initialAdminPassword,
  adminProfileId = null,
}) {
  await ensureTenantUserEmailAvailable(trx, initialAdminEmail);

  let adminProfile = null;

  if (adminProfileId) {
    adminProfile = await trx('permission_profiles')
      .where({ id: adminProfileId, church_id: churchId })
      .first();
  }

  if (!adminProfile) {
    adminProfile = await findInitialAdminProfile(trx, churchId);
  }

  if (!adminProfile) {
    throw new NotFoundError('Perfil tecnico inicial nao encontrado para a nova igreja cliente');
  }

  const initialAdmin = await createInitialAdmin(trx, {
    churchId,
    adminProfileId: adminProfile.id,
    initialAdminName,
    initialAdminEmail,
    initialAdminPassword,
  });

  return { initialAdmin, adminProfile };
}

async function createInitialAdmin(trx, {
  churchId,
  adminProfileId,
  initialAdminName,
  initialAdminEmail,
  initialAdminPassword,
}) {
  const passwordHash = await bcrypt.hash(initialAdminPassword, 10);

  try {
    const [initialAdmin] = await trx('users')
      .insert({
        id: uuidv4(),
        church_id: churchId,
        congregation_id: null,
        permission_profile_id: adminProfileId,
        member_id: null,
        name: initialAdminName,
        email: initialAdminEmail,
        password_hash: passwordHash,
        is_active: true,
      })
      .returning('*');

    return initialAdmin;
  } catch (error) {
    if (isUniqueViolation(error, 'users_email_unique', 'email')) {
      throw new ConflictError('Ja existe um usuario da igreja com este e-mail');
    }

    throw error;
  }
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

async function ensureChurchEmailAvailable(trx, email) {
  const existingChurch = await trx('churches').where({ email }).first();

  if (existingChurch) {
    throw new ConflictError('Ja existe uma igreja cliente com este e-mail institucional');
  }
}

async function ensureTenantUserEmailAvailable(trx, email) {
  const existingUser = await trx('users').where({ email }).first();

  if (existingUser) {
    throw new ConflictError('Ja existe um usuario da igreja com este e-mail');
  }
}

function normalizeOnboardingInput({
  churchName,
  churchEmail,
  churchPhone,
  churchDocument,
  churchPlan,
  churchStatus,
  initialAdminName,
  initialAdminEmail,
  initialAdminPassword,
}) {
  return {
    churchName: normalizeRequiredText(churchName),
    churchEmail: normalizeEmail(churchEmail),
    churchPhone: normalizeOptionalText(churchPhone),
    churchDocument: normalizeOptionalText(churchDocument),
    churchPlan,
    churchStatus,
    initialAdminName: normalizeRequiredText(initialAdminName),
    initialAdminEmail: normalizeEmail(initialAdminEmail),
    initialAdminPassword,
  };
}

function normalizeInitialAdminProvisionInput({
  churchId,
  initialAdminName,
  initialAdminEmail,
  initialAdminPassword,
}) {
  return {
    churchId,
    initialAdminName: normalizeRequiredText(initialAdminName),
    initialAdminEmail: normalizeEmail(initialAdminEmail),
    initialAdminPassword,
  };
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

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

function isUniqueViolation(error, constraint, column = null) {
  if (error?.code !== '23505') {
    return false;
  }

  if (error?.constraint === constraint) {
    return true;
  }

  if (column && typeof error?.detail === 'string') {
    return error.detail.includes(`(${column})=`);
  }

  return false;
}

module.exports = {
  onboardTenant,
  provisionInitialAdminForExistingTenant,
};

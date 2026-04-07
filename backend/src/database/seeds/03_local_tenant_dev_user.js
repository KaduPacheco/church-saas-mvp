const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const {
  SYSTEM_FINANCIAL_CATEGORIES,
  SYSTEM_PROFILES,
  SYSTEM_ROLES,
} = require('../../config/constants');

const DEV_TENANT = {
  churchName: 'Igreja Teste Local',
  churchEmail: 'tenant.local@teste.com',
  churchPhone: '21999999999',
  churchDocument: '00.000.000/0001-00',
  userName: 'Administrador Tenant Local',
  userEmail: 'igreja@teste.com',
  userPassword: '12345678',
  profileName: 'Administrador Geral',
};

exports.seed = async function (knex) {
  if ((process.env.NODE_ENV || 'development') !== 'development') {
    console.log('Seed 03_local_tenant_dev_user ignorada fora de development.');
    return;
  }

  await knex.transaction(async (trx) => {
    const church = await findOrCreateChurch(trx);
    await ensureTenantBase(trx, church.id);

    const adminProfile = await trx('permission_profiles')
      .where({
        church_id: church.id,
        name: DEV_TENANT.profileName,
      })
      .first();

    if (!adminProfile) {
      throw new Error('Perfil Administrador Geral nao encontrado para o tenant local.');
    }

    const passwordHash = await bcrypt.hash(DEV_TENANT.userPassword, 10);
    const existingUser = await trx('users')
      .where({ email: DEV_TENANT.userEmail })
      .first();

    if (existingUser) {
      await trx('users')
        .where({ id: existingUser.id })
        .update({
          church_id: church.id,
          congregation_id: null,
          permission_profile_id: adminProfile.id,
          member_id: null,
          name: DEV_TENANT.userName,
          password_hash: passwordHash,
          is_active: true,
          updated_at: trx.fn.now(),
        });

      return;
    }

    await trx('users').insert({
      id: uuidv4(),
      church_id: church.id,
      congregation_id: null,
      permission_profile_id: adminProfile.id,
      member_id: null,
      name: DEV_TENANT.userName,
      email: DEV_TENANT.userEmail,
      password_hash: passwordHash,
      is_active: true,
    });
  });
};

async function findOrCreateChurch(trx) {
  const existingChurch = await trx('churches')
    .where({ email: DEV_TENANT.churchEmail })
    .first();

  if (existingChurch) {
    await trx('churches')
      .where({ id: existingChurch.id })
      .update({
        name: DEV_TENANT.churchName,
        phone: DEV_TENANT.churchPhone,
        document: DEV_TENANT.churchDocument,
        status: 'active',
        updated_at: trx.fn.now(),
      });

    return {
      ...existingChurch,
      name: DEV_TENANT.churchName,
      phone: DEV_TENANT.churchPhone,
      document: DEV_TENANT.churchDocument,
      status: 'active',
    };
  }

  const [createdChurch] = await trx('churches')
    .insert({
      id: uuidv4(),
      name: DEV_TENANT.churchName,
      plan: 'free',
      status: 'active',
      email: DEV_TENANT.churchEmail,
      phone: DEV_TENANT.churchPhone,
      document: DEV_TENANT.churchDocument,
    })
    .returning('*');

  return createdChurch;
}

async function ensureTenantBase(trx, churchId) {
  await ensureRoles(trx, churchId);
  await ensureProfiles(trx, churchId);
  await ensureFinancialCategories(trx, churchId);
}

async function ensureRoles(trx, churchId) {
  const existingNames = new Set(
    (await trx('roles').where({ church_id: churchId }).select('name')).map((role) => role.name)
  );

  const missingRoles = SYSTEM_ROLES
    .filter((role) => !existingNames.has(role.name))
    .map((role) => ({
      id: uuidv4(),
      church_id: churchId,
      name: role.name,
      description: role.description,
      is_system: true,
      is_active: true,
    }));

  if (missingRoles.length > 0) {
    await trx('roles').insert(missingRoles);
  }
}

async function ensureProfiles(trx, churchId) {
  const existingNames = new Set(
    (await trx('permission_profiles').where({ church_id: churchId }).select('name'))
      .map((profile) => profile.name)
  );

  const missingProfiles = SYSTEM_PROFILES
    .filter((profile) => !existingNames.has(profile.name))
    .map((profile) => ({
      id: uuidv4(),
      church_id: churchId,
      name: profile.name,
      description: profile.description,
      permissions: JSON.stringify(profile.permissions),
      is_system: true,
      is_active: true,
    }));

  if (missingProfiles.length > 0) {
    await trx('permission_profiles').insert(missingProfiles);
  }
}

async function ensureFinancialCategories(trx, churchId) {
  const existingCategoryKeys = new Set(
    (await trx('financial_categories')
      .where({ church_id: churchId })
      .select('name', 'type'))
      .map((category) => `${category.type}:${category.name}`)
  );

  const missingCategories = SYSTEM_FINANCIAL_CATEGORIES
    .filter((category) => !existingCategoryKeys.has(`${category.type}:${category.name}`))
    .map((category) => ({
      id: uuidv4(),
      church_id: churchId,
      name: category.name,
      type: category.type,
      description: category.description,
      is_system: true,
      is_active: true,
    }));

  if (missingCategories.length > 0) {
    await trx('financial_categories').insert(missingCategories);
  }
}

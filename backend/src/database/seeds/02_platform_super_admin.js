const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const email = process.env.BACKOFFICE_SUPER_ADMIN_EMAIL;
  const password = process.env.BACKOFFICE_SUPER_ADMIN_PASSWORD;
  const name = process.env.BACKOFFICE_SUPER_ADMIN_NAME || 'Platform Super Admin';

  if (!email || !password) {
    console.log('Seed 02_platform_super_admin ignorada: variaveis BACKOFFICE_SUPER_ADMIN_EMAIL/BACKOFFICE_SUPER_ADMIN_PASSWORD ausentes.');
    return;
  }

  const role = await knex('platform_roles')
    .where({ slug: 'super_admin' })
    .first();

  if (!role) {
    throw new Error('Role super_admin nao encontrada. Execute a seed de platform_roles antes desta.');
  }

  const existingUser = await knex('platform_users')
    .where({ email })
    .first();

  const passwordHash = await bcrypt.hash(password, 10);

  if (existingUser) {
    await knex('platform_users')
      .where({ id: existingUser.id })
      .update({
        role_id: role.id,
        name,
        password_hash: passwordHash,
        is_active: true,
        updated_at: knex.fn.now(),
      });

    return;
  }

  await knex('platform_users').insert({
    id: uuidv4(),
    role_id: role.id,
    name,
    email,
    password_hash: passwordHash,
    is_active: true,
  });
};

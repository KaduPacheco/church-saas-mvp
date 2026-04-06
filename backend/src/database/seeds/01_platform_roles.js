const { v4: uuidv4 } = require('uuid');

const PLATFORM_ROLES = [
  {
    slug: 'super_admin',
    name: 'Super Admin',
    description: 'Acesso total ao backoffice da plataforma.',
    permissions: ['platform:*'],
  },
  {
    slug: 'operator',
    name: 'Operator',
    description: 'Opera tenants, usuarios administrativos e visoes globais.',
    permissions: [
      'platform:dashboard:read',
      'platform:tenants:read',
      'platform:tenants:write',
      'platform:congregations:read',
      'platform:users:read',
      'platform:users:write',
      'platform:tenant-initial-admin:write',
      'platform:audit:read',
    ],
  },
  {
    slug: 'support',
    name: 'Support',
    description: 'Consulta tenants e usuarios para suporte operacional.',
    permissions: [
      'platform:dashboard:read',
      'platform:tenants:read',
      'platform:congregations:read',
      'platform:users:read',
      'platform:audit:read',
    ],
  },
  {
    slug: 'analyst',
    name: 'Analyst',
    description: 'Consulta indicadores globais e trilha de auditoria.',
    permissions: [
      'platform:dashboard:read',
      'platform:tenants:read',
      'platform:congregations:read',
      'platform:audit:read',
    ],
  },
];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  for (const role of PLATFORM_ROLES) {
    await knex('platform_roles')
      .insert({
        id: uuidv4(),
        slug: role.slug,
        name: role.name,
        description: role.description,
        permissions: JSON.stringify(role.permissions),
        is_system: true,
        is_active: true,
      })
      .onConflict('slug')
      .merge({
        name: role.name,
        description: role.description,
        permissions: JSON.stringify(role.permissions),
        is_system: true,
        is_active: true,
        updated_at: knex.fn.now(),
      });
  }
};

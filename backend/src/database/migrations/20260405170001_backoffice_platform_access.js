/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('platform_roles', (table) => {
      table.uuid('id').primary();
      table.string('slug', 50).notNullable().unique();
      table.string('name', 100).notNullable();
      table.text('description');
      table.jsonb('permissions').notNullable().defaultTo('[]');
      table.boolean('is_system').notNullable().defaultTo(true);
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamps(true, true);

      table.index(['is_active']);
    })
    .createTable('platform_users', (table) => {
      table.uuid('id').primary();
      table.uuid('role_id').notNullable()
        .references('id').inTable('platform_roles');
      table.string('name', 150).notNullable();
      table.string('email', 100).notNullable().unique();
      table.string('password_hash').notNullable();
      table.text('refresh_token');
      table.datetime('refresh_token_expires');
      table.boolean('is_active').notNullable().defaultTo(true);
      table.datetime('last_login');
      table.timestamps(true, true);

      table.index(['role_id', 'is_active']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('platform_users')
    .dropTableIfExists('platform_roles');
};

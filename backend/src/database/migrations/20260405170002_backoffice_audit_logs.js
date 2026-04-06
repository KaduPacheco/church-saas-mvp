/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('audit_logs', (table) => {
      table.uuid('id').primary();
      table.uuid('actor_platform_user_id').nullable()
        .references('id').inTable('platform_users')
        .onDelete('SET NULL');
      table.uuid('church_id').nullable()
        .references('id').inTable('churches')
        .onDelete('SET NULL');
      table.string('action', 120).notNullable();
      table.string('target_type', 80).notNullable();
      table.uuid('target_id').nullable();
      table.string('target_label', 150);
      table.jsonb('metadata').notNullable().defaultTo('{}');
      table.string('ip_address', 45);
      table.string('user_agent', 255);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

      table.index(['created_at']);
      table.index(['action', 'created_at']);
      table.index(['actor_platform_user_id', 'created_at']);
      table.index(['church_id', 'created_at']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('audit_logs');
};

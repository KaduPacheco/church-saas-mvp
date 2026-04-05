/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    // 3. Tabela de Cargos Ministeriais (Função na igreja)
    .createTable('roles', (table) => {
      table.uuid('id').primary();
      table.uuid('church_id').notNullable()
        .references('id').inTable('churches')
        .onDelete('CASCADE');
        
      table.string('name', 100).notNullable();
      table.text('description');
      table.boolean('is_system').defaultTo(false); // Cargos padrão que vêm junto não podem ser deletados
      table.boolean('is_active').defaultTo(true);
      
      table.timestamps(true, true);
      
      table.index('church_id');
    })

    // 4. Tabela de Perfis de Acesso (Permissões no software)
    .createTable('permission_profiles', (table) => {
      table.uuid('id').primary();
      table.uuid('church_id').notNullable()
        .references('id').inTable('churches')
        .onDelete('CASCADE');
        
      table.string('name', 100).notNullable();
      table.text('description');
      table.jsonb('permissions').defaultTo('[]'); // JSON com as roles (ex: "members:read")
      table.boolean('is_system').defaultTo(false); // Admin padrão
      table.boolean('is_active').defaultTo(true);
      
      table.timestamps(true, true);
      
      table.index('church_id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('permission_profiles')
    .dropTableIfExists('roles');
};

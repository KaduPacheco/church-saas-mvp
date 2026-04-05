/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    // 5. Tabela de Membros (Cadastro de Paroquianos/Fieis/Membros)
    .createTable('members', (table) => {
      table.uuid('id').primary();
      table.uuid('church_id').notNullable()
        .references('id').inTable('churches')
        .onDelete('CASCADE');
      table.uuid('congregation_id').nullable() // Pode pertencer à sede se for null
        .references('id').inTable('congregations')
        .onDelete('SET NULL');
      table.uuid('role_id').nullable()
        .references('id').inTable('roles')
        .onDelete('SET NULL');
        
      table.string('name', 150).notNullable();
      table.string('email', 100);
      table.string('phone', 20);
      table.string('document', 20);
      
      table.string('status', 50).notNullable().defaultTo('active'); // active, inactive, transferred
      table.string('gender', 20); // male, female, other
      table.string('marital_status', 20);
      
      table.date('birth_date');
      table.date('baptism_date');
      table.date('membership_date'); // Data em que virou membro oficial
      
      table.text('address_street');
      table.string('address_number', 20);
      table.string('address_neighborhood', 100);
      table.string('address_city', 100);
      table.string('address_state', 2);
      table.string('address_zipcode', 20);
      
      table.timestamps(true, true);
      
      table.index(['church_id', 'congregation_id', 'status']); // Facilita as buscas por congregação
    })

    // 6. Tabela de Usuários (Acesso ao Sistema)
    // Nem todo membro acessa, e o admin principal nem precisa ser membro formal.
    .createTable('users', (table) => {
      table.uuid('id').primary();
      table.uuid('church_id').notNullable()
        .references('id').inTable('churches')
        .onDelete('CASCADE');
      table.uuid('congregation_id').nullable() // Pode estar vinculado apenas a uma congregação (Admin Local)
        .references('id').inTable('congregations')
        .onDelete('SET NULL');
      table.uuid('permission_profile_id').notNullable()
        .references('id').inTable('permission_profiles');
      table.uuid('member_id').nullable() // Vínculo com a pessoa, caso exista
        .references('id').inTable('members')
        .onDelete('SET NULL');
        
      table.string('name', 150).notNullable();
      table.string('email', 100).notNullable(); // Acesso via email globalmente único idealmente
      table.string('password_hash').notNullable();
      
      table.text('refresh_token'); // Rotação de sessão
      table.datetime('refresh_token_expires');
      table.boolean('is_active').defaultTo(true);
      table.datetime('last_login');
      
      table.timestamps(true, true);
      
      table.unique(['email']); // Garante email único de login
      table.index(['church_id', 'is_active']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('users')
    .dropTableIfExists('members');
};

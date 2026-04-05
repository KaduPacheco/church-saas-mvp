/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    // 1. Tabela de Igrejas (Tenants)
    .createTable('churches', (table) => {
      table.uuid('id').primary().defaultTo(knex.fn.uuid()); // Recomenda-se uuid nativo no banco futuramente, aqui cuidamos no código
      table.string('name', 150).notNullable();
      table.string('plan', 50).notNullable().defaultTo('free'); // free, basic, premium
      table.string('status', 50).notNullable().defaultTo('active'); // active, inactive
      table.string('email', 100).notNullable().unique();
      table.string('phone', 20);
      table.string('document', 20); // CNPJ opcional no MVP
      
      table.timestamps(true, true); // created_at e updated_at nativos
    })
    
    // 2. Tabela de Congregações
    // Toda congregação pertence obrigatoriamente a uma igreja matriz (tenant)
    .createTable('congregations', (table) => {
      table.uuid('id').primary();
      table.uuid('church_id').notNullable()
        .references('id').inTable('churches')
        .onDelete('CASCADE'); // Se a igreja for deletada, caem as congregações
      table.string('name', 150).notNullable();
      table.string('address', 255);
      table.string('status', 50).notNullable().defaultTo('active');
      
      table.timestamps(true, true);
      
      // Índice composto para queries de performance (isolamento de tenant)
      table.index(['church_id', 'status']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('congregations')
    .dropTableIfExists('churches');
};

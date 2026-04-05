/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    // 7. Categorias Financeiras
    .createTable('financial_categories', (table) => {
      table.uuid('id').primary();
      table.uuid('church_id').notNullable()
        .references('id').inTable('churches')
        .onDelete('CASCADE');
        
      table.string('name', 100).notNullable();
      table.string('type', 20).notNullable(); // 'income' (dízimo/oferta) ou 'expense' (luz/aluguel)
      table.text('description');
      
      table.boolean('is_system').defaultTo(false); // Se a categoria foi gerada no startup da Igreja
      table.boolean('is_active').defaultTo(true);
      
      table.timestamps(true, true);
      
      table.index(['church_id', 'type']);
    })

    // 8. Tabela de Transações Financeiras (Livro Caixa)
    .createTable('financial_transactions', (table) => {
      table.uuid('id').primary();
      table.uuid('church_id').notNullable()
        .references('id').inTable('churches')
        .onDelete('CASCADE');
      table.uuid('congregation_id').nullable() // Caixa independente se for o caso
        .references('id').inTable('congregations')
        .onDelete('SET NULL');
      table.uuid('category_id').notNullable()
        .references('id').inTable('financial_categories');
      
      // Quem cadastrou
      table.uuid('user_id').nullable()
        .references('id').inTable('users')
        .onDelete('SET NULL');
      
      // Quem fez a oferta/dízimo (opcional)
      table.uuid('member_id').nullable()
        .references('id').inTable('members')
        .onDelete('SET NULL');

      table.string('type', 20).notNullable(); // Repete o tipo (income/expense) por consistência e simplificação de query
      table.decimal('amount', 12, 2).notNullable(); // Foco em moeda com 2 decimais
      table.date('transaction_date').notNullable();
      table.string('payment_method', 50).notNullable(); // cash, pix, card...
      
      table.text('description');
      table.string('status', 20).notNullable().defaultTo('confirmed'); // pending, confirmed, cancelled
      
      // Para soft delete seguro (financeiro não se exclui, cancela e documenta motivo)
      table.text('cancellation_reason');
      table.datetime('cancelled_at');
      
      table.timestamps(true, true);
      
      // Índices pesados para extração do Dashboard
      table.index(['church_id', 'congregation_id', 'transaction_date']);
      table.index(['church_id', 'type', 'status']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('financial_transactions')
    .dropTableIfExists('financial_categories');
};

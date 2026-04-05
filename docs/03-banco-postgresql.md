# 03 - Banco PostgreSQL

## Arquitetura de Tabelas, Chaves e Índices

O banco de dados utilizado é o PostgreSQL, e as interações/migrações são gerenciadas pelo **Knex.js**.

### O que já está implementado em Migrations

**Tabelas Base (Tenant e Estrutura)**
1. `churches` e `congregations`: Gerencia Sede e Congregações no mesmo schema.
2. `roles` (cargos) e `permission_profiles` (perfis de permissão): Utilizados no sistema de RBAC.

**Pessoas (Acesso e CRM)**
3. `users` (acesso do sistema) e `members` (cadastro real do membro, batismos, consagrações).

**Financeiro**
4. `financial_categories` e `financial_transactions`: Entidades do livro de caixa, categorizadas ativamente.

### Observações de Integridade
- Todas chaves primárias são UUIDs gerenciados nativamente pelas extensions do Postgres (`uuid-ossp` ou similar via knex), evitando predição de dados e conflitos no setup Single DB / Multi-tenant.
- Soft Deletes costumam ser aplicados quando conveniente, assim como Constraints Restritivas ou de Cascading:
  * Exemplo de restrição: `financial_transactions` obriga um relacionamento restrito a `financial_categories`, sendo impossível apagar uma categoria ligada a uma transação existente.

# 04 - Backend Node.js

## Estrutura Técnica do Backend

O backend Node.js utiliza Express, construído de forma modularizada:

```text
/backend
├── src/
│   ├── config/          # DB, envs, constantes globais
│   ├── middlewares/      # auth, tenant, errorHandler, etc
│   ├── modules/
│   │   ├── auth/         # controllers, services, validations (Login, JWT)
│   │   ├── churches/     # Gestão da Sede e Congregações
│   │   ├── members/      # Cadastro/Edição de membros da igreja
│   │   ├── roles/        # Cargos e permissões
│   │   └── financial/    # Livro Caixa, Dashboard, Transações
│   ├── database/
│   │   ├── migrations/   # Arquivos de Migrations Knex
│   │   └── seeds/        # Dados base iniciais
│   ├── utils/            # Helpers, responseFormatter
│   └── app.js            # Inicialização Express Rest
├── .env                  # Variáveis locais
├── package.json
└── knexfile.js           # Setup Knex (host, port, user)
```

## Stack Tecnológica Utilizada
| Camada | Pacotes |
|---------|---------|
| Core | `express` |
| Banco | `knex`, `pg` |
| Segurança | `bcryptjs`, `jsonwebtoken`, `cors`, `helmet` |
| Validações | `express-validator` |
| Utilitários | `dotenv`, `uuid` |

## Ciclo de Vida do Middleware
Cada requisição passa por um filtro rigoroso até processar o "Service":
1. Rota recebe.
2. `authenticate`: Valida integridade do Token.
3. `tenantIsolation`: Busca o local ID e injeta.
4. `authorize`: Valida regra de permissão do usuário de realizar ação na rota baseada na `role_id`.
5. Validação (`express-validator` para schemas do corpo/query param).
6. Chega em `Service` propriamente e finalmente à resposta (formatada padrão `responseFormatter`). Caso algo quebre, capta no `errorHandler`.

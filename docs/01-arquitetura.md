# 01 - Arquitetura

## Visao Geral
O projeto e um SaaS multi-tenant para gestao de igrejas com:

- backend em Node.js + Express
- frontend em Vue 3 + Vite + Pinia + Vue Router
- PostgreSQL com Knex
- isolamento logico por tenant no mesmo banco

O repositorio possui duas camadas de acesso coexistindo:

1. Tenant
- usada pela igreja cliente
- focada na operacao da igreja
- autenticacao em `/api/auth/*`

2. Plataforma / Backoffice
- usada pelo operador do SaaS
- focada em administracao global
- autenticacao em `/api/backoffice/*`

## Decisoes de Arquitetura

### 1. Multi-tenancy
- o tenant principal e a igreja sede em `churches`
- as congregacoes ficam em tabela propria `congregations`
- os dados operacionais do tenant continuam isolados por `church_id`

Observacao importante:
- a documentacao antiga citava auto-referencia em `churches`
- o codigo real usa `churches` + `congregations`
- esta versao foi ajustada para refletir a implementacao real

### 2. Separacao entre tenant e backoffice
- o backoffice nao reutiliza `tenantIsolation`
- permissao de plataforma nao reutiliza `permission_profiles`
- `admin:full` do tenant nao concede acesso ao backoffice
- perfil ministerial nao concede acesso tecnico ao backoffice

### 3. API por namespace
- tenant: `/api/auth/*`
- backoffice: `/api/backoffice/*`

Namespaces entregues no MVP do backoffice:
- `/api/backoffice/auth/*`
- `/api/backoffice/dashboard/*`
- `/api/backoffice/tenants/*`
- `/api/backoffice/audit/*`

### 4. Sessao isolada no frontend
Tenant:
- `access_token`
- `refresh_token`

Backoffice:
- `backoffice_access_token`
- `backoffice_refresh_token`

Isso evita colisao entre sessao da igreja e sessao da plataforma.

### 5. Auditoria persistida
As acoes criticas do backoffice sao gravadas em `audit_logs`, com:

- ator
- acao
- alvo
- tenant relacionado quando houver
- timestamp
- metadados minimos

## Documentacao detalhada do backoffice
Para aprofundamento da camada plataforma, consulte:

- [11 - Backoffice](./11-backoffice.md)
- [11 - Backoffice - Visao Geral](./11-backoffice-visao-geral.md)
- [12 - Backoffice - Arquitetura](./12-backoffice-arquitetura.md)
- [13 - Backoffice - Autenticacao e Autorizacao](./13-backoffice-autenticacao-e-autorizacao.md)
- [14 - Backoffice - Backend](./14-backoffice-backend.md)
- [15 - Backoffice - Frontend](./15-backoffice-frontend.md)
- [16 - Backoffice - Gestao de Tenants](./16-backoffice-gestao-de-tenants.md)
- [17 - Backoffice - Usuarios Administrativos](./17-backoffice-usuarios-administrativos.md)
- [18 - Backoffice - Dashboard](./18-backoffice-dashboard.md)
- [19 - Backoffice - Auditoria](./19-backoffice-auditoria.md)
- [20 - Backoffice - Fluxos](./20-backoffice-fluxos.md)
- [21 - Backoffice - Execucao Local](./21-backoffice-execucao-local.md)
- [22 - Backoffice - Roadmap](./22-backoffice-roadmap.md)
- [23 - Fluxo de Criacao de Usuarios](./23-fluxo-de-criacao-de-usuarios.md)

## Estado Atual do MVP

Tenant:
- login tenant funcional
- dashboard tenant inicial
- guardas e store proprios

Backoffice:
- login de plataforma
- dashboard global basico
- listagem e detalhe de tenants
- supervisao de congregacoes por tenant
- supervisao de usuarios administrativos por tenant
- ativacao/inativacao segura de usuarios do tenant
- auditoria persistida com tela simples de consulta

Observacao:
- a documentacao antiga que sugeria auto-referencia em `churches` foi substituida pela modelagem real, com `churches` para sede e `congregations` em tabela propria

# 12 - Backoffice - Arquitetura

## Objetivo
Explicar como o backoffice se encaixa na arquitetura geral do sistema sem quebrar a camada tenant.

## Visao arquitetural
O sistema opera com duas trilhas funcionais separadas:

### Camada tenant
- autenticacao em `/api/auth/*`
- autorizacao por `permission_profiles`
- isolamento por `church_id`
- uso de `tenantIsolation`

### Camada plataforma
- autenticacao em `/api/backoffice/auth/*`
- autorizacao por permissoes de plataforma
- sem dependencia de `church_id`
- sem uso de `tenantIsolation`

## Backend
Namespace dedicado:

- `/api/backoffice/auth/*`
- `/api/backoffice/dashboard/*`
- `/api/backoffice/tenants/*`
- `/api/backoffice/audit/*`

Montagem atual:
- `backend/src/app.js` monta `/api/auth` e `/api/backoffice` lado a lado

## Frontend
Rotas atuais do backoffice:

- `/backoffice/login`
- `/backoffice`
- `/backoffice/tenants`
- `/backoffice/tenants/:id`
- `/backoffice/audit`
- `/backoffice/users`

Layout dedicado:
- `BackofficeAuthLayout.vue`
- `BackofficeLayout.vue`

## Sessao isolada
Tenant:
- `access_token`
- `refresh_token`

Backoffice:
- `backoffice_access_token`
- `backoffice_refresh_token`

Essa separacao evita colisao entre sessao da igreja e sessao da plataforma.

## Relacao com o modelo de dados
- `churches` representa o tenant principal, isto e, a igreja sede
- `congregations` representa as unidades vinculadas ao tenant
- `users` continua sendo a identidade tecnica da area tenant
- `platform_users` representa a identidade da plataforma
- `platform_roles` define papel e permissoes de plataforma
- `audit_logs` registra acoes criticas do backoffice

## Decisoes tecnicas importantes
- `tenantIsolation` nao e reutilizado na plataforma
- `permission_profiles` nao define acesso ao backoffice
- `admin:full` do tenant nao concede acesso global
- o status do tenant reaproveita `churches.status` com `active`, `inactive` e `suspended`

## Fluxo arquitetural resumido
1. usuario de plataforma autentica em `/api/backoffice/auth/login`
2. backend emite token com `scope: 'platform'`
3. frontend armazena tokens em chaves proprias
4. rotas `/backoffice/*` exigem autenticacao e permissao de plataforma
5. consultas globais usam leitura agregada das tabelas existentes

## Limitacoes atuais
- nao ha modulo grafico de administracao de papeis de plataforma

## Configuracao de ambiente do frontend
- `VITE_API_BASE_URL` configura a API do tenant
- `VITE_BACKOFFICE_API_BASE_URL` configura a API do backoffice
- em desenvolvimento local, o backoffice ainda tem fallback seguro para `http://<hostname-atual>:4000/api/backoffice`
- fora de `dev`, sem variavel definida, o cliente usa `/api/backoffice` no host atual

# 15 - Backoffice - Frontend

## Objetivo
Documentar a estrutura real do frontend do backoffice, sua sessao isolada e o fluxo de navegacao.

## Estrutura atual
Arquivos principais:

- `frontend/src/router/index.js`
- `frontend/src/layouts/BackofficeAuthLayout.vue`
- `frontend/src/layouts/BackofficeLayout.vue`
- `frontend/src/stores/backoffice-auth.store.js`
- `frontend/src/services/backoffice-api.js`
- `frontend/src/services/backoffice-auth.service.js`
- `frontend/src/services/backoffice-dashboard.service.js`
- `frontend/src/services/backoffice-tenants.service.js`
- `frontend/src/services/backoffice-audit.service.js`
- `frontend/src/services/backoffice-users.service.js`

Views atuais:
- `BackofficeLoginView.vue`
- `BackofficeHomeView.vue`
- `BackofficeTenantsListView.vue`
- `BackofficeTenantDetailView.vue`
- `BackofficeAuditView.vue`
- `BackofficeUsersView.vue`

## Rotas do backoffice
- `/backoffice/login`
- `/backoffice`
- `/backoffice/tenants`
- `/backoffice/tenants/:id`
- `/backoffice/audit`
- `/backoffice/users`

## Layouts

### `BackofficeAuthLayout`
- usado no login
- separa visualmente o acesso interno da plataforma

### `BackofficeLayout`
- usado nas rotas protegidas
- exibe navegacao lateral
- mostra usuario autenticado
- centraliza o logout

## Store de autenticacao
Store:
- `backoffice-auth.store.js`

Responsabilidades:
- carregar tokens do `localStorage`
- executar login
- buscar usuario autenticado via `/auth/me`
- verificar permissoes
- limpar sessao no logout

## Chaves de sessao
- `backoffice_access_token`
- `backoffice_refresh_token`

Elas sao separadas das chaves tenant:
- `access_token`
- `refresh_token`

## Guardas de rota
Metadados usados no router:
- `requiresPlatformAuth`
- `platformGuestOnly`
- `platformPermission`
- `platformPermissionsAny`

Comportamento atual:
- rota protegida sem token redireciona para `/backoffice/login`
- usuario autenticado no login e redirecionado para `/backoffice`
- se faltar `user` em memoria, o router chama `fetchUser()`
- se a permissao nao existir, o usuario volta para a home do backoffice
- a rota `/backoffice/users` aceita acesso quando o operador possui ao menos uma das permissoes da aba

## Cliente HTTP
Arquivo:
- `frontend/src/services/backoffice-api.js`

Comportamento:
- `baseURL` fixa em `http://localhost:4000/api/backoffice`
- inclui `Authorization` quando existe token
- em `401`, limpa sessao do backoffice e redireciona para login

## Fluxo de login
1. usuario acessa `/backoffice/login`
2. formulario envia `email` e `password`
3. store salva `accessToken` e `refreshToken`
4. store salva `user`
5. frontend navega para `/backoffice`

## Fluxo de logout
1. usuario clica em `Sair`
2. store remove as chaves do backoffice
3. sessao em memoria e limpa
4. frontend navega para `/backoffice/login`

## Limitacoes atuais
- o cliente HTTP do backoffice nao usa variavel de ambiente para `baseURL`
- o refresh token existe na store, mas ainda nao ha fluxo automatico de renovacao
- ainda nao ha telas separadas para congregacoes e usuarios; a visualizacao acontece dentro do detalhe do tenant
- a aba `Usuarios` do backoffice nao faz a gestao rotineira dos usuarios internos da igreja; ela trata apenas usuarios da plataforma e o provisionamento do admin inicial do tenant

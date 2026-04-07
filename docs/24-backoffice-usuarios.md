# 24 - Backoffice - Usuarios

## Objetivo
Documentar a aba `Usuarios` do backoffice deixando explicito:

- quais contas pertencem a plataforma
- onde acontece o onboarding correto do tenant
- quais limites continuam protegendo a area operacional da igreja

Este documento reflete o que esta implementado no codigo atual.

## Visao geral da aba
A aba `Usuarios` trata duas frentes administrativas diferentes:

1. `Usuarios da plataforma`
2. `Onboarding do tenant`

Essa separacao preserva a arquitetura do sistema:
- `platform_users` operam o SaaS
- `users` operam a igreja cliente
- o backoffice nao vira modulo rotineiro de usuarios internos da igreja

## O que a aba faz

### Frente A - Usuarios da plataforma
Permite:
- listar usuarios da plataforma
- filtrar por nome, e-mail e status
- criar usuario da plataforma
- editar informacoes basicas
- ativar e inativar usuario da plataforma
- visualizar papel e permissoes da plataforma

Essas contas:
- vivem em `platform_users`
- usam `platform_roles`
- acessam o backoffice
- nao sao usuarios da igreja

### Frente B - Onboarding do tenant
Permite:
- criar a igreja cliente no backoffice
- criar o admin inicial do tenant na mesma operacao
- registrar o nascimento do tenant com vinculo tecnico correto

Esse fluxo:
- cria a igreja sede em `churches`
- cria a base inicial do tenant
- cria a conta em `users`
- vincula o usuario ao `church_id` correto
- usa automaticamente o perfil `Administrador Geral`
- cria a conta com `congregation_id = null`
- cria a conta com `member_id = null`

## O que a aba nao faz
- nao cria usuarios comuns do tenant como fluxo rotineiro
- nao cria membros
- nao atribui cargo ministerial
- nao usa `roles` como permissao tecnica
- nao redefine senha de usuarios do tenant
- nao substitui o painel da igreja para gestao interna

## Estrutura no frontend

### Rota
- `/backoffice/users`

### Arquivos principais
- `frontend/src/views/backoffice/BackofficeUsersView.vue`
- `frontend/src/components/backoffice/users/PlatformUsersSection.vue`
- `frontend/src/components/backoffice/users/TenantOnboardingSection.vue`
- `frontend/src/services/backoffice-users.service.js`
- `frontend/src/services/backoffice-tenants.service.js`

### Integracao com layout
A navegacao lateral do backoffice continua com a entrada:
- `Usuarios`

Essa entrada aparece quando o operador possui pelo menos uma das permissoes ligadas a essa pagina.

## Estrutura no backend

### Namespaces
- `/api/backoffice/users/*`
- `/api/backoffice/tenants`

### Arquivos principais
- `backend/src/modules/backoffice/users/backoffice-users.routes.js`
- `backend/src/modules/backoffice/users/backoffice-users.controller.js`
- `backend/src/modules/backoffice/users/backoffice-users.service.js`
- `backend/src/modules/backoffice/users/backoffice-users.validation.js`
- `backend/src/modules/backoffice/tenants/backoffice-tenants.routes.js`
- `backend/src/modules/backoffice/tenants/backoffice-tenants.controller.js`
- `backend/src/modules/backoffice/tenants/backoffice-tenants.service.js`
- `backend/src/modules/tenants/tenant-onboarding.service.js`

## Endpoints implementados

### Usuarios da plataforma
- `GET /api/backoffice/users/platform`
- `GET /api/backoffice/users/platform/roles`
- `POST /api/backoffice/users/platform`
- `PATCH /api/backoffice/users/platform/:id`
- `PATCH /api/backoffice/users/platform/:id/status`

### Onboarding do tenant
- `POST /api/backoffice/tenants`

## Permissoes de plataforma usadas

### Permissoes especificas da aba
- `platform:platform-users:read`
- `platform:platform-users:write`
- `platform:tenant-initial-admin:write`

### Permissoes complementares
- `platform:tenants:write`
- `platform:users:read`
- `platform:users:write`

As permissoes `platform:users:*` continuam ligadas a supervisao dos usuarios do tenant no detalhe da igreja cliente e nao foram reutilizadas para o CRUD de `platform_users`.

## Regras de negocio aplicadas

### 1. Usuario de plataforma nao e usuario da igreja
O CRUD de usuarios da plataforma atua apenas em:
- `platform_users`

### 2. Usuario da igreja nao acessa o backoffice por padrao
O onboarding do tenant cria a primeira conta em:
- `users`

Essa conta continua pertencendo ao tenant e nao recebe acesso de plataforma.

### 3. Cargo ministerial nao define permissao tecnica
O onboarding do tenant nao usa:
- `roles`
- `member_id`

O acesso tecnico e definido apenas por:
- `permission_profile_id`

### 4. Membro nao vira usuario automaticamente
O fluxo nao cria membros nem faz vinculo automatico com `users.member_id`.

### 5. O backoffice nao vira modulo comum de usuarios do tenant
O backoffice usa a permissao de onboarding para criar a igreja cliente e seu admin inicial juntos.

A criacao rotineira dos demais usuarios internos continua fora desta aba.

## Fluxo implementado para usuarios da plataforma

1. operador acessa a aba `Usuarios`
2. seleciona `Usuarios da plataforma`
3. consulta a lista
4. pode criar ou editar conta
5. pode ativar ou inativar conta
6. o sistema grava auditoria

## Fluxo implementado para onboarding do tenant

1. operador acessa a aba `Usuarios`
2. seleciona `Onboarding do tenant`
3. informa os dados da igreja sede
4. informa os dados do admin inicial
5. sistema cria a igreja cliente em `churches`
6. sistema cria a base inicial do tenant
7. sistema cria o primeiro usuario em `users`
8. sistema registra auditoria do onboarding

## Auditoria

### Eventos registrados
- `platform.platform_user.created`
- `platform.platform_user.updated`
- `platform.platform_user.status.updated`
- `platform.tenant.onboarded`

### Campos principais registrados
- ator da plataforma
- acao
- alvo
- tenant relacionado, quando existir
- metadados minimos da alteracao

## Integracao com a documentacao existente
Esta aba complementa:

- `17-backoffice-usuarios-administrativos.md`
- `23-fluxo-de-criacao-de-usuarios.md`
- `25-fluxo-de-onboarding-do-tenant.md`

## Limitacoes atuais
- `POST /api/auth/register` continua existindo como fluxo legado reaproveitando a mesma logica de onboarding
- nao existe reset de senha para usuarios da plataforma nem do tenant
- a gestao de usuarios internos do tenant continua fora desta aba

## Proximo passo recomendado
O proximo refinamento arquitetural recomendado e:

1. implementar a gestao de usuarios internos no painel da igreja
2. adicionar reset de acesso com auditoria
3. manter o onboarding do tenant como responsabilidade do backoffice

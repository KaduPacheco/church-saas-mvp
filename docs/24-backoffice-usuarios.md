# 24 - Backoffice - Usuarios

## Objetivo
Documentar a nova aba `Usuarios` do backoffice, deixando explicito:

- quais contas pertencem a plataforma
- quais contas pertencem ao tenant
- qual fluxo pode ser executado pelo backoffice
- quais limites continuam protegendo a area operacional da igreja

Este documento reflete apenas o que esta implementado no codigo atual.

## Visao geral da aba
A aba `Usuarios` foi criada no backoffice para tratar duas frentes administrativas diferentes, sem misturar conceitos:

1. `Usuarios da plataforma`
2. `Admin inicial do tenant`

Essa separacao segue a definicao registrada em `23-fluxo-de-criacao-de-usuarios.md`.

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

### Frente B - Admin inicial do tenant
Permite:
- selecionar uma igreja cliente elegivel
- consultar os perfis tecnicos ativos da igreja
- provisionar o primeiro administrador da igreja

Esse fluxo:
- cria a conta em `users`
- vincula o usuario ao `church_id` correto
- usa `permission_profile_id`
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
- `frontend/src/components/backoffice/users/TenantInitialAdminSection.vue`
- `frontend/src/services/backoffice-users.service.js`

### Integracao com layout
A navegacao lateral do backoffice ganhou a entrada:
- `Usuarios`

Essa entrada aparece somente quando o operador possui pelo menos uma das permissoes ligadas a essa pagina.

## Estrutura no backend

### Namespace
- `/api/backoffice/users/*`

### Arquivos principais
- `backend/src/modules/backoffice/users/backoffice-users.routes.js`
- `backend/src/modules/backoffice/users/backoffice-users.controller.js`
- `backend/src/modules/backoffice/users/backoffice-users.service.js`
- `backend/src/modules/backoffice/users/backoffice-users.validation.js`

## Endpoints implementados

### Usuarios da plataforma
- `GET /api/backoffice/users/platform`
- `GET /api/backoffice/users/platform/roles`
- `POST /api/backoffice/users/platform`
- `PATCH /api/backoffice/users/platform/:id`
- `PATCH /api/backoffice/users/platform/:id/status`

### Admin inicial do tenant
- `GET /api/backoffice/users/tenant-initial-admin/eligible-tenants`
- `GET /api/backoffice/users/tenant-initial-admin/tenants/:tenantId/profiles`
- `POST /api/backoffice/users/tenant-initial-admin`

## Permissoes de plataforma usadas

### Novas permissoes especificas da aba
- `platform:platform-users:read`
- `platform:platform-users:write`
- `platform:tenant-initial-admin:write`

### Permissoes antigas preservadas
- `platform:users:read`
- `platform:users:write`

Essas permissoes continuam ligadas a supervisao de usuarios do tenant no detalhe da igreja cliente e nao foram reutilizadas para o CRUD de `platform_users`.

## Regras de negocio aplicadas

### 1. Usuario de plataforma nao e usuario da igreja
O CRUD de usuarios da plataforma atua apenas em:
- `platform_users`

### 2. Usuario da igreja nao acessa o backoffice por padrao
O provisionamento do admin inicial cria conta em:
- `users`

Essa conta continua pertencendo ao tenant e nao recebe acesso de plataforma.

### 3. Cargo ministerial nao define permissao tecnica
O fluxo de `Admin inicial do tenant` nao usa:
- `roles`
- `member_id`

O acesso tecnico e definido apenas por:
- `permission_profile_id`

### 4. Membro nao vira usuario automaticamente
O fluxo nao cria membros nem faz vinculo automatico com `users.member_id`.

### 5. O backoffice nao vira modulo comum de usuarios do tenant
Para reduzir risco conceitual, o fluxo de `admin inicial do tenant` aceita apenas igrejas que ainda nao possuam usuarios.

No estado atual, a elegibilidade e:
- tenant sem nenhum registro em `users`

## Fluxo implementado para usuarios da plataforma

1. operador acessa a aba `Usuarios`
2. seleciona `Usuarios da plataforma`
3. consulta a lista
4. pode criar ou editar conta
5. pode ativar ou inativar conta
6. o sistema grava auditoria

## Fluxo implementado para admin inicial do tenant

1. operador acessa a aba `Usuarios`
2. seleciona `Admin inicial do tenant`
3. consulta igrejas elegiveis
4. escolhe a igreja cliente
5. escolhe o perfil tecnico inicial
6. informa nome, e-mail e senha
7. sistema cria o primeiro usuario em `users`
8. sistema registra auditoria

## Auditoria

### Eventos registrados
- `platform.platform_user.created`
- `platform.platform_user.updated`
- `platform.platform_user.status.updated`
- `platform.tenant.initial_admin.provisioned`

### Campos principais registrados
- ator da plataforma
- acao
- alvo
- tenant relacionado, quando existir
- metadados minimos da alteracao

## Integracao com a documentacao existente
Esta nova aba complementa:

- `17-backoffice-usuarios-administrativos.md`
- `23-fluxo-de-criacao-de-usuarios.md`

Relacao entre os documentos:

- `24-backoffice-usuarios.md`
  - explica a aba de usuarios do backoffice
- `17-backoffice-usuarios-administrativos.md`
  - explica a supervisao dos usuarios do tenant
- `23-fluxo-de-criacao-de-usuarios.md`
  - define quem cria quem no sistema

## Limitacoes atuais
- a aba ainda nao cria tenants
- a criacao do admin inicial funciona apenas para igrejas sem usuarios
- a logica de onboarding ainda nao foi extraida de `/api/auth/register`
- nao existe reset de senha para usuarios da plataforma nem do tenant
- a gestao de usuarios internos do tenant continua fora desta aba

## Proximo passo recomendado
O proximo refinamento arquitetural recomendado e:

1. extrair a logica de onboarding de tenant para um servico reutilizavel
2. implementar a criacao completa de tenant + admin inicial no backoffice
3. manter a criacao dos demais usuarios internos no painel da igreja

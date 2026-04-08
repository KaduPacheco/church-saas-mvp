# 24 - Backoffice - Usuarios

## Objetivo
Documentar a aba `Usuarios` do backoffice no estado real atual do projeto, deixando claro:

- o que pertence a usuarios da plataforma
- o que pertence ao onboarding de novas igrejas clientes
- o que nao pertence ao backoffice

## Estado anterior
Historicamente, a area de usuarios podia gerar ambiguidade entre:

- contas da plataforma
- contas do tenant
- membros
- cargos ministeriais

Com a consolidacao do onboarding, a aba foi reposicionada para explicitar que:
- o backoffice gerencia usuarios da plataforma
- o backoffice executa o onboarding de uma nova igreja cliente
- o backoffice nao e CRUD rotineiro de usuarios internos do tenant

## Visao geral da aba
A aba `Usuarios` trata duas frentes administrativas distintas:

1. `Usuarios da plataforma`
2. `Nova igreja cliente` / onboarding de tenant

Essa separacao preserva a arquitetura:
- `platform_users` operam o SaaS
- `users` operam a igreja cliente
- `members` continuam em dominio proprio
- `roles` continuam como cargos ministeriais
- `permission_profiles` continuam como perfis tecnicos

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

### Frente B - Onboarding de tenant
Permite:
- criar a igreja cliente no backoffice
- criar o admin inicial do tenant na mesma operacao
- registrar o nascimento do tenant com vinculo tecnico correto

Esse fluxo:
- cria a igreja sede em `churches`
- cria a base inicial do tenant
- cria a conta inicial em `users`
- usa `initialAdminEmail` como login do tenant
- usa automaticamente o perfil tecnico `Administrador Geral`
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

### UX atual consolidada
A tela agora comunica explicitamente:
- usuarios da plataforma e onboarding de tenant sao coisas diferentes
- o onboarding cria primeiro a igreja cliente
- no mesmo processo nasce o admin inicial
- os demais usuarios internos devem ser criados depois no painel do tenant
- membros e cargos ministeriais continuam fora desse fluxo

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

### Onboarding oficial de tenant
- `POST /api/backoffice/tenants`

Esse endpoint:
- nao autentica o tenant
- nao emite token do tenant
- apenas cria igreja cliente + admin inicial e registra auditoria

## Permissoes de plataforma usadas

### Permissoes especificas da aba
- `platform:platform-users:read`
- `platform:platform-users:write`
- `platform:tenant-initial-admin:write`

### Permissoes complementares
- `platform:tenants:write`
- `platform:users:read`
- `platform:users:write`

Observacao:
- `platform:users:*` continua ligado a supervisao de usuarios do tenant no detalhe do tenant
- esse grupo nao foi reutilizado para o CRUD de `platform_users`

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
O backoffice usa a aba de onboarding para criar uma nova igreja cliente e seu primeiro acesso tecnico.

A criacao rotineira dos demais usuarios internos continua fora desta aba.

## Fluxo implementado para usuarios da plataforma

1. operador acessa a aba `Usuarios`
2. seleciona `Usuarios da plataforma`
3. consulta a lista
4. pode criar ou editar conta
5. pode ativar ou inativar conta
6. o sistema grava auditoria

## Fluxo implementado para onboarding de tenant

1. operador acessa a aba `Usuarios`
2. seleciona `Nova igreja cliente`
3. informa os dados da igreja sede
4. informa os dados do admin inicial
5. frontend chama `POST /api/backoffice/tenants`
6. backend executa `tenantOnboardingService.onboardTenant(...)`
7. sistema cria a igreja cliente em `churches`
8. sistema cria a base inicial do tenant
9. sistema cria o primeiro usuario em `users`
10. sistema registra auditoria

Observacoes importantes:
- o login do tenant usa o e-mail informado para o admin inicial
- o e-mail institucional da igreja nao faz login por si so, a menos que o operador informe o mesmo valor nos dois campos
- o backoffice nao entrega token do tenant nesse fluxo

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

## Limitacoes atuais
- `POST /api/auth/register` continua existindo como fluxo legado reaproveitando a mesma logica de onboarding
- nao existe reset de senha para usuarios da plataforma nem do tenant
- a gestao de usuarios internos do tenant continua fora desta aba
- o metodo `provisionInitialAdminForExistingTenant(...)` existe no servico compartilhado, mas ainda nao ha fluxo publico proprio no backoffice para isso

## Proximo passo recomendado

1. implementar a gestao de usuarios internos no painel da igreja
2. adicionar reset de acesso com auditoria
3. manter o onboarding do tenant como responsabilidade principal do backoffice

# 25 - Tenant Onboarding

## Objetivo
Consolidar o estado real atual do onboarding do tenant no projeto, documentando:

1. o estado anterior
2. a extracao para `tenant-onboarding.service.js`
3. quem usa esse servico hoje
4. o que continua em `/api/auth/register`
5. o que passou a existir no backoffice
6. o que ainda e legado ou compatibilidade temporaria

## Estado anterior
Antes da consolidacao, o onboarding do tenant estava acoplado ao fluxo de autenticacao em:

- `backend/src/modules/auth/auth.service.js`

No metodo `register()` conviviam duas responsabilidades:

### Onboarding transacional
- validar unicidade do e-mail do usuario inicial
- criar a igreja em `churches`
- criar cargos ministeriais padrao em `roles`
- criar perfis tecnicos padrao em `permission_profiles`
- criar categorias financeiras padrao
- buscar o perfil `Administrador Geral`
- criar o admin inicial em `users`

### Autenticacao pos-registro
- gerar tokens
- salvar refresh token
- atualizar `last_login`
- formatar a resposta do endpoint

Esse arranjo funcionava, mas dificultava o reuso pelo backoffice.

## Estado atual
O onboarding transacional do tenant agora fica centralizado em:

- `backend/src/modules/tenants/tenant-onboarding.service.js`

### Metodo principal
- `onboardTenant(...)`

Esse metodo:
- nao conhece Express
- nao monta resposta HTTP
- nao gera JWT
- nao salva refresh token
- nao atualiza `last_login`

Ele cuida apenas do nascimento transacional do tenant e do admin inicial.

## O que foi extraido para o servico

### Fluxo principal
`onboardTenant(...)` hoje:

1. normaliza o input
2. valida unicidade do e-mail institucional da igreja
3. cria a igreja em `churches`
4. cria cargos ministeriais padrao em `roles`
5. cria perfis tecnicos padrao em `permission_profiles`
6. cria categorias financeiras padrao
7. resolve o perfil tecnico `Administrador Geral`
8. cria o admin inicial em `users`
9. devolve `{ church, initialAdmin, adminProfile }`

### Helpers internos
O servico tambem centraliza:
- `createChurch(...)`
- `seedTenantBase(...)`
- `findInitialAdminProfile(...)`
- `createInitialAdmin(...)`
- `ensureChurchEmailAvailable(...)`
- `ensureTenantUserEmailAvailable(...)`
- `provisionInitialAdminWithTrx(...)`

### Metodo reutilizavel adicional
Tambem existe:
- `provisionInitialAdminForExistingTenant(...)`

Status:
- implementado no servico
- ainda nao exposto por rota publica propria

## Quem usa esse servico hoje

### 1. `/api/auth/register`
Arquivo:
- `backend/src/modules/auth/auth.service.js`

Uso atual:
- `register({ churchName, name, email, password })`
- adapta o payload legado para `onboardTenant(...)`
- usa o mesmo `email` tanto para `churchEmail` quanto para `initialAdminEmail`

Depois do onboarding, `auth.service.js` continua responsavel por:
- gerar `accessToken` e `refreshToken`
- salvar refresh token
- atualizar `last_login`
- formatar o retorno do endpoint

### 2. `POST /api/backoffice/tenants`
Arquivo:
- `backend/src/modules/backoffice/tenants/backoffice-tenants.service.js`

Uso atual:
- recebe dados da igreja cliente e do admin inicial
- chama `tenantOnboardingService.onboardTenant(...)`
- registra auditoria `platform.tenant.onboarded`
- devolve resumo do tenant criado e do admin inicial

Esse fluxo:
- nao autentica automaticamente o tenant
- nao emite tokens do tenant

## O que continua em `/api/auth/register`
Mesmo apos a extracao, `/api/auth/register` continua existindo e permanece responsavel por:

- manter a assinatura publica legada
- disparar o onboarding compartilhado
- autenticar imediatamente o admin inicial criado
- devolver tokens e payload do usuario

Status:
- implementado
- legado por compatibilidade
- nao e o fluxo principal recomendado da plataforma

## O que passou a existir no backoffice
O backoffice agora opera como fluxo oficial de onboarding do tenant por meio de:

- `POST /api/backoffice/tenants`

Esse endpoint:
- cria a igreja cliente
- cria a base inicial do tenant
- cria o admin inicial do tenant
- registra auditoria de plataforma
- devolve resumo administrativo do resultado

Permissoes aplicadas:
- `platform:tenants:write`
- `platform:tenant-initial-admin:write`

No frontend, a aba `Usuarios` foi ajustada para comunicar melhor que:
- isso e onboarding de uma nova igreja cliente
- isso nao e CRUD rotineiro de usuarios internos do tenant
- usuarios da plataforma e usuarios do tenant continuam separados

## Compatibilidade com login do tenant
O login em:
- `POST /api/auth/login`

continua compativel com os usuarios criados tanto por:
- `/api/auth/register`
- `POST /api/backoffice/tenants`

Motivo:
- o admin inicial continua sendo persistido em `users`
- com `church_id` correto
- com `permission_profile_id` do perfil tecnico adequado
- com `password_hash` gerado pelo mesmo servico compartilhado

## O que ainda e legado ou compatibilidade temporaria

### Legado mantido
- `POST /api/auth/register`

Motivo:
- compatibilidade com o fluxo atual do frontend operacional ou integracoes legadas

### Parcialmente implementado
- `provisionInitialAdminForExistingTenant(...)` existe no servico, mas ainda nao possui fluxo publico proprio no backoffice

### Ainda proposto
- criacao rotineira de usuarios internos do tenant pelo proprio painel da igreja
- reset de acesso com auditoria
- possivel aposentadoria futura de `/api/auth/register`, quando a migracao estiver completa

## Estado arquitetural resultante
O estado consolidado atual e:

- onboarding transacional do tenant centralizado em servico reutilizavel
- backoffice como fluxo oficial para criar igreja cliente + admin inicial
- `/api/auth/register` preservado por compatibilidade
- `/api/auth/login` preservado e compativel com o novo fluxo
- separacao clara entre:
  - usuarios da plataforma
  - usuarios do tenant
  - membros
  - cargos ministeriais

## Checklist recomendado de validacao ponta a ponta
- criar tenant pelo backoffice
- confirmar registros em `churches`, `roles`, `permission_profiles`, `financial_categories` e `users`
- confirmar auditoria `platform.tenant.onboarded`
- logar no tenant com `initialAdminEmail`
- chamar `/api/auth/me`
- registrar tenant pelo fluxo legado `/api/auth/register`
- confirmar que esse fluxo continua emitindo tokens e criando o mesmo contrato em `users`

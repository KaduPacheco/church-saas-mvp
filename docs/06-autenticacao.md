# 06 - Autenticacao e Seguranca

## Visao Geral
O sistema possui duas trilhas de autenticacao separadas:

1. Tenant
- usada pela igreja cliente
- namespace: `/api/auth/*`
- token com contexto de tenant

2. Plataforma / Backoffice
- usada por operadores internos do SaaS
- namespace: `/api/backoffice/auth/*`
- token com contexto de plataforma

Essa separacao impede misturar administracao da plataforma com administracao da igreja.

## Fluxo Tenant

Endpoints:
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Claims relevantes:
- `userId`
- `churchId`
- `congregationId`
- `profileId`
- `permissions`

Middlewares:
- `authenticate`
- `tenantIsolation`
- `authorize`

## Fluxo Backoffice

Endpoints:
- `POST /api/backoffice/auth/login`
- `GET /api/backoffice/auth/me`

Claims relevantes:
- `scope: 'platform'`
- `platformUserId`
- `roleId`
- `roleSlug`
- `permissions`

Middlewares:
- `requirePlatformAuth`
- `requirePlatformPermission`

Importante:
- o backoffice nao usa `tenantIsolation`
- o token de plataforma nao depende de `churchId`

## Sessao no Frontend

Tenant:
- store: `auth.store.js`
- chaves:
  - `access_token`
  - `refresh_token`

Backoffice:
- store: `backoffice-auth.store.js`
- chaves:
  - `backoffice_access_token`
  - `backoffice_refresh_token`

## Seguranca Minima do MVP

- senhas com `bcryptjs`
- JWT com expiracao curta
- refresh token persistido no banco
- rotas tenant e backoffice com middlewares separados
- auditoria persistida para acoes criticas do backoffice

## Observacao de Execucao Local
O frontend usa `http://localhost:4000` como API e o backend aceita `CORS_ORIGIN` configuravel.

Para uso local com Vite na porta padrao:
- `CORS_ORIGIN=http://localhost:5173`

Se o frontend rodar em outra origem, ajuste `CORS_ORIGIN` de acordo.

## Documentacao relacionada
- [13 - Backoffice - Autenticacao e Autorizacao](./13-backoffice-autenticacao-e-autorizacao.md)
- [15 - Backoffice - Frontend](./15-backoffice-frontend.md)
- [21 - Backoffice - Execucao Local](./21-backoffice-execucao-local.md)

## Limitacao atual do backoffice
- o backend ja emite refresh token de plataforma e o persiste em `platform_users`
- o frontend do backoffice ainda nao implementa um fluxo completo de refresh automatico

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
- `POST /api/backoffice/auth/refresh`
- `POST /api/backoffice/auth/logout`
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
O backend aceita `CORS_ORIGIN` configuravel e o frontend passa a ler as URLs de API via variaveis `VITE_*`.

Para uso local padronizado:
- frontend principal: `http://localhost:3000`
- backoffice: `http://localhost:3000/backoffice/login`
- `VITE_API_BASE_URL=http://localhost:4000/api`
- `VITE_BACKOFFICE_API_BASE_URL=http://localhost:4000/api/backoffice`
- `CORS_ORIGIN=http://localhost:3000`

Detalhe importante:
- `PLATFORM_JWT_*` pode ser configurado separadamente para o backoffice
- se `PLATFORM_JWT_SECRET` e `PLATFORM_JWT_REFRESH_SECRET` nao forem definidos, o backend reutiliza `JWT_SECRET` e `JWT_REFRESH_SECRET`
- em desenvolvimento, se as variaveis `VITE_*` nao existirem, o frontend faz fallback para `http://<hostname-atual>:4000/...`
- fora de `dev`, o frontend usa a variavel configurada ou caminho relativo no host atual, sem depender de `localhost`

## Documentacao relacionada
- [13 - Backoffice - Autenticacao e Autorizacao](./13-backoffice-autenticacao-e-autorizacao.md)
- [15 - Backoffice - Frontend](./15-backoffice-frontend.md)
- [21 - Backoffice - Execucao Local](./21-backoffice-execucao-local.md)

## Refresh do backoffice
- o backend emite refresh token de plataforma e o persiste em `platform_users`
- o frontend do backoffice tenta refresh automatico ao receber `401`
- se o refresh falhar, a sessao da plataforma e limpa sem afetar a sessao tenant

## Limitacoes atuais
- tenant e backoffice ainda usam tokens em `localStorage`; nao ha cookies `HttpOnly`
- nao existe teste automatizado do frontend para o interceptor do backoffice

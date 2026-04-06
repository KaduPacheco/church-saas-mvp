# 14 - Backoffice - Backend

## Objetivo
Descrever a estrutura real do backend do backoffice, seus modulos, endpoints e regras basicas de seguranca.

## Estrutura de modulos
Diretorio principal:

- `backend/src/modules/backoffice`

Modulos atuais:
- `auth`
- `dashboard`
- `tenants`
- `audit`
- `users`

Arquivos de apoio:
- `backend/src/middlewares/requirePlatformAuth.js`
- `backend/src/middlewares/requirePlatformPermission.js`

## Organizacao interna
O padrao segue a estrutura usada no restante do backend:

- `routes`
- `controller`
- `service`
- `validation`

## Rotas principais

### Autenticacao
- `POST /api/backoffice/auth/login`
- `GET /api/backoffice/auth/me`

### Dashboard
- `GET /api/backoffice/dashboard/summary`

### Tenants
- `GET /api/backoffice/tenants`
- `GET /api/backoffice/tenants/:id`
- `GET /api/backoffice/tenants/:id/congregations`
- `GET /api/backoffice/tenants/:id/users`
- `PATCH /api/backoffice/tenants/:id/status`
- `PATCH /api/backoffice/tenants/:id/users/:userId/status`

### Auditoria
- `GET /api/backoffice/audit`

### Usuarios
- `GET /api/backoffice/users/platform`
- `GET /api/backoffice/users/platform/roles`
- `POST /api/backoffice/users/platform`
- `PATCH /api/backoffice/users/platform/:id`
- `PATCH /api/backoffice/users/platform/:id/status`
- `GET /api/backoffice/users/tenant-initial-admin/eligible-tenants`
- `GET /api/backoffice/users/tenant-initial-admin/tenants/:tenantId/profiles`
- `POST /api/backoffice/users/tenant-initial-admin`

## Responsabilidades por modulo

### Auth
- login de plataforma
- retorno do usuario autenticado
- auditoria de login

### Dashboard
- agregacao de totais globais em `churches`, `congregations`, `users` e `members`

### Tenants
- listagem paginada de igrejas sede
- filtro por busca e status
- detalhe consolidado do tenant
- consulta de congregacoes vinculadas
- consulta de usuarios tecnicos do tenant
- mudanca de status de tenant
- ativacao e inativacao de usuario tenant

### Audit
- persistencia de logs criticos
- consulta paginada com filtros leves

### Users
- listagem de usuarios da plataforma
- listagem de papeis da plataforma
- criacao e edicao de `platform_users`
- ativacao e inativacao de usuarios da plataforma
- provisionamento controlado do admin inicial do tenant

## Validacoes
O backoffice usa `express-validator` e middleware `validate`.

Validacoes presentes no codigo:
- payload de login
- filtros de listagem de tenants
- validacao de UUID para tenant e usuario
- validacao de status de tenant
- validacao de alteracao de status de usuario tenant
- filtros da consulta de auditoria
- filtros de listagem de usuarios da plataforma
- criacao e edicao de usuarios da plataforma
- provisionamento do admin inicial do tenant

## Tratamento de erros
O backoffice reaproveita o pipeline global do backend:
- `UnauthorizedError`
- `ForbiddenError`
- `NotFoundError`
- `errorHandler` global

## Exemplo de endpoint protegido
```http
GET /api/backoffice/dashboard/summary
Authorization: Bearer <platform_access_token>
```

## Exemplo de resposta do dashboard
```json
{
  "success": true,
  "data": {
    "totals": {
      "churches": 10,
      "congregations": 35,
      "users": 48,
      "members": 820
    },
    "tenantsByStatus": {
      "active": 8,
      "inactive": 1,
      "suspended": 1
    }
  }
}
```

## Exemplo de alteracao de status de tenant
```http
PATCH /api/backoffice/tenants/<tenantId>/status
Authorization: Bearer <platform_access_token>
Content-Type: application/json

{
  "status": "suspended"
}
```

## Regras de seguranca
- o namespace do backoffice e separado de `/api/auth`
- o backoffice nao usa `tenantIsolation`
- o token precisa ter `scope: 'platform'`
- a permissao e sempre verificada por middleware especifico
- mudancas criticas registram auditoria

## Limitacoes atuais
- nao ha refresh token de backoffice exposto por endpoint dedicado no codigo atual
- nao ha modulo de edicao de papeis/permissoes de plataforma
- nao ha exportacao de auditoria
- o fluxo de criacao do admin inicial do tenant nao cria o tenant; ele apenas provisiona a primeira conta para igrejas ja existentes e sem usuarios

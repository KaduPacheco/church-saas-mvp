# 13 - Backoffice - Autenticacao e Autorizacao

## Objetivo
Documentar como a plataforma autentica e autoriza usuarios do backoffice sem misturar regras da igreja cliente.

## Identidade de plataforma
O backoffice usa tabelas proprias:

- `platform_roles`
- `platform_users`

O papel de plataforma fica em `platform_users.role_id`, apontando para `platform_roles`.

## Fluxo de autenticacao
Endpoints atuais:

- `POST /api/backoffice/auth/login`
- `POST /api/backoffice/auth/refresh`
- `POST /api/backoffice/auth/logout`
- `GET /api/backoffice/auth/me`

### Login
O backend:
- busca o usuario em `platform_users`
- valida se usuario e papel estao ativos
- compara senha com `bcryptjs`
- gera `accessToken` e `refreshToken`
- persiste `refresh_token`, expiracao e `last_login`
- registra auditoria de login

### Refresh
O backend:
- valida o `refreshToken` com `env.platformJwt.refreshSecret`
- exige `scope: 'platform'`
- busca o usuario em `platform_users` e confirma papel ativo
- compara o token recebido com o `refresh_token` salvo no banco
- rota o par `accessToken` + `refreshToken`
- persiste o novo `refresh_token`
- se detectar mismatch entre token recebido e token salvo, limpa o token persistido e exige novo login

### Logout
O backend:
- exige `Authorization: Bearer <platform_access_token>`
- limpa `refresh_token` e `refresh_token_expires` do usuario da plataforma

No frontend:
- logout iniciado pelo usuario chama `POST /api/backoffice/auth/logout` quando ainda existe `accessToken`
- logout forcado apos falha de refresh limpa apenas a sessao local e redireciona para `/backoffice/login`

### Claims do token de plataforma
- `scope: 'platform'`
- `platformUserId`
- `roleId`
- `roleSlug`
- `permissions`

Importante:
- o token de plataforma nao carrega `churchId`
- o token tenant nao deve ser aceito no backoffice

## Middlewares

### `requirePlatformAuth`
- exige header `Authorization: Bearer <token>`
- valida JWT com `env.platformJwt.secret`
- exige `scope === 'platform'`
- injeta `req.platformUser`

### `requirePlatformPermission`
- verifica se o usuario possui a permissao exigida
- concede bypass quando existe `platform:*`

## Permissoes de plataforma implementadas
- `platform:*`
- `platform:dashboard:read`
- `platform:tenants:read`
- `platform:tenants:write`
- `platform:congregations:read`
- `platform:users:read`
- `platform:users:write`
- `platform:audit:read`

## Perfis de plataforma semeados
- `super_admin`
- `operator`
- `support`
- `analyst`

## Fronteiras de acesso

### Cargo ministerial
- e parte do dominio da igreja
- nao concede acesso ao backoffice

### Perfil tecnico do tenant
- e parte de `permission_profiles`
- concede acesso a modulos da igreja
- nao concede acesso ao backoffice

### Perfil de plataforma
- e parte de `platform_roles`
- concede acesso ao backoffice
- nao substitui o perfil tecnico do tenant

## Exemplo de request de login
```http
POST /api/backoffice/auth/login
Content-Type: application/json

{
  "email": "admin@plataforma.local",
  "password": "change-me-admin-password"
}
```

## Exemplo de request de refresh
```http
POST /api/backoffice/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<jwt>"
}
```

## Exemplo de request de logout
```http
POST /api/backoffice/auth/logout
Authorization: Bearer <platform_access_token>
```

## Exemplo de request de me
```http
GET /api/backoffice/auth/me
Authorization: Bearer <platform_access_token>
```

## Exemplo de resposta esperada
```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "id": "uuid",
      "name": "Platform Super Admin",
      "email": "admin@plataforma.local",
      "roleId": "uuid",
      "roleSlug": "super_admin",
      "roleName": "Super Admin",
      "permissions": ["platform:*"],
      "lastLogin": null
    }
  }
}
```

## Limitacoes atuais
- ainda nao existe interface para editar papeis ou permissoes de plataforma
- a sessao continua baseada em tokens salvos no navegador; nao ha cookies `HttpOnly`

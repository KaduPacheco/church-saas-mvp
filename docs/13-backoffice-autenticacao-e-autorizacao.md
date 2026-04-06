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
- `GET /api/backoffice/auth/me`

### Login
O backend:
- busca o usuario em `platform_users`
- valida se usuario e papel estao ativos
- compara senha com `bcryptjs`
- gera `accessToken` e `refreshToken`
- persiste `refresh_token`, expiracao e `last_login`
- registra auditoria de login

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
- o backend emite refresh token de plataforma, mas o frontend ainda nao faz refresh automatico
- ainda nao existe interface para editar papeis ou permissoes de plataforma

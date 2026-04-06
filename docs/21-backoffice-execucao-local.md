# 21 - Backoffice - Execucao Local

## Objetivo
Concentrar as instrucoes praticas para subir o backoffice localmente sem quebrar a aplicacao existente.

## Requisitos
- Node.js instalado
- PostgreSQL acessivel
- dependencias instaladas em `backend` e `frontend`

## Variaveis de ambiente relevantes
Arquivo base:
- `backend/.env.example`

Obrigatorias para o backend:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

Recomendadas para o backoffice:
- `PLATFORM_JWT_SECRET`
- `PLATFORM_JWT_REFRESH_SECRET`
- `PLATFORM_JWT_EXPIRES_IN`
- `PLATFORM_JWT_REFRESH_EXPIRES_IN`
- `BACKOFFICE_SUPER_ADMIN_EMAIL`
- `BACKOFFICE_SUPER_ADMIN_PASSWORD`
- `BACKOFFICE_SUPER_ADMIN_NAME`
- `CORS_ORIGIN`

## Observacao sobre CORS
O `.env.example` ja orienta:

```env
CORS_ORIGIN=http://localhost:5173
```

O codigo de `env.js` ainda usa fallback para `http://localhost:3000` quando a variavel nao existe.

Recomendacao pratica:
- sempre definir `CORS_ORIGIN` explicitamente no `.env`

## Como rodar o backend
No diretorio `backend`:

```powershell
npm install
npm run migrate:latest
npm run seed:run
npm run dev
```

## Como rodar o frontend
No diretorio `frontend`:

```powershell
npm install
npm run dev
```

## Como criar um super admin inicial
Antes de rodar as seeds, configure:

```env
BACKOFFICE_SUPER_ADMIN_EMAIL=admin@plataforma.local
BACKOFFICE_SUPER_ADMIN_PASSWORD=change-me-admin-password
BACKOFFICE_SUPER_ADMIN_NAME=Platform Super Admin
```

Depois execute:

```powershell
npm run seed:run
```

## Credenciais iniciais de desenvolvimento
Se o backend estiver usando os valores documentados no `.env.example`, o login inicial de desenvolvimento do backoffice sera:

- e-mail: `admin@plataforma.local`
- senha: `change-me-admin-password`

Essas credenciais sao destinadas apenas ao ambiente local de desenvolvimento.

## Como acessar o backoffice
- frontend: `http://localhost:5173/backoffice/login`
- backend: `http://localhost:4000/api/backoffice`
- endpoint de login: `POST http://localhost:4000/api/backoffice/auth/login`

## Dependencias importantes
- banco com migrations do backoffice aplicadas
- seeds de `platform_roles`
- seed opcional de `platform_users`

## Observacoes operacionais
- o frontend do backoffice usa `baseURL` fixa para `http://localhost:4000/api/backoffice`
- a area tenant continua funcionando em paralelo
- as sessoes tenant e plataforma nao compartilham chaves no navegador
- apos o primeiro acesso local, troque a senha de desenvolvimento antes de reutilizar esse usuario em outros ambientes

# 21 - Backoffice - Execucao Local

## Objetivo
Concentrar as instrucoes praticas para subir o backoffice localmente sem quebrar a aplicacao existente.

## Requisitos
- Node.js instalado
- PostgreSQL acessivel
- dependencias instaladas em `backend` e `frontend`

## Variaveis de ambiente relevantes
Arquivos base:
- `backend/.env.example`
- `frontend/.env.example`

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

Recomendadas para o frontend:
- `VITE_API_BASE_URL`
- `VITE_BACKOFFICE_API_BASE_URL`

Comportamento real do backend:
- `PLATFORM_JWT_SECRET` e `PLATFORM_JWT_REFRESH_SECRET` sao opcionais; se nao forem definidos, o backoffice reaproveita `JWT_SECRET` e `JWT_REFRESH_SECRET`
- `CORS_ORIGIN` aceita lista separada por virgula; sem valor, o fallback atual e `http://localhost:3000`

## Observacao sobre CORS
O `.env.example` ja orienta:

```env
CORS_ORIGIN=http://localhost:3000
```

O codigo de `env.js` usa o mesmo fallback para `http://localhost:3000` quando a variavel nao existe.

Recomendacao pratica:
- sempre definir `CORS_ORIGIN` explicitamente no `.env`

## Como rodar o backend
No diretorio `backend`:

1. copie `backend/.env.example` para `backend/.env`
2. ajuste banco, JWTs e credenciais iniciais
3. execute:

```powershell
npm install
npm run migrate:latest
npm run seed:run
npm run dev
```

## Como rodar o frontend
No diretorio `frontend`:

1. copie `frontend/.env.example` para `frontend/.env`
2. ajuste as URLs se necessario:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_BACKOFFICE_API_BASE_URL=http://localhost:4000/api/backoffice
```

Observacao:
- em desenvolvimento local, se essas variaveis nao existirem, o frontend usa fallback para o hostname atual na porta `4000`
- em producao, configure explicitamente as variaveis para nao depender de `localhost`
- o Vite roda em `http://localhost:3000` por configuracao de `frontend/vite.config.js`

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
- frontend: `http://localhost:3000/backoffice/login`
- backend: `http://localhost:4000/api/backoffice`
- endpoint de login: `POST http://localhost:4000/api/backoffice/auth/login`

## Dependencias importantes
- banco com migrations do backoffice aplicadas
- seeds de `platform_roles`
- seed de super admin em `platform_users` quando `BACKOFFICE_SUPER_ADMIN_*` estiver configurado

## Observacoes operacionais
- o frontend tenant le `VITE_API_BASE_URL` e faz fallback para `http://<hostname-atual>:4000/api` apenas em desenvolvimento
- o frontend do backoffice le `VITE_BACKOFFICE_API_BASE_URL` e faz fallback para `http://<hostname-atual>:4000/api/backoffice` apenas em desenvolvimento
- no logout manual, o frontend do backoffice chama `POST /api/backoffice/auth/logout`
- quando um `401` ocorre em request protegida, o frontend tenta `POST /api/backoffice/auth/refresh` antes de derrubar a sessao
- a area tenant continua funcionando em paralelo
- as sessoes tenant e plataforma nao compartilham chaves no navegador
- apos o primeiro acesso local, troque a senha de desenvolvimento antes de reutilizar esse usuario em outros ambientes

## Limitacoes atuais
- o frontend e o backoffice ainda dependem de tokens em `localStorage`
- nao existe teste automatizado do frontend cobrindo o interceptor de refresh

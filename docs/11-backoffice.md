# 11 - Backoffice

## Objetivo
Este arquivo passa a funcionar como resumo executivo e ponte para a documentacao detalhada do backoffice.

## Resumo
O backoffice e a camada administrativa global da plataforma. Ele convive com a area tenant sem substituir o painel operacional da igreja e sem reutilizar as mesmas regras de autenticacao e autorizacao.

## O que o codigo atual ja entrega
- autenticacao de plataforma
- refresh automatico de sessao no frontend do backoffice
- dashboard global basico
- gestao de tenants
- supervisao de congregacoes por tenant
- supervisao de usuarios administrativos do tenant
- gestao de usuarios da plataforma
- auditoria persistida basica

## Estruturas de banco do backoffice
- `platform_roles`
- `platform_users`
- `audit_logs`

## Permissoes de plataforma
- `platform:*`
- `platform:dashboard:read`
- `platform:tenants:read`
- `platform:tenants:write`
- `platform:congregations:read`
- `platform:users:read`
- `platform:users:write`
- `platform:platform-users:read`
- `platform:platform-users:write`
- `platform:tenant-initial-admin:write`
- `platform:audit:read`

## Acesso local de desenvolvimento
- rota do frontend: `http://localhost:3000/backoffice/login`
- endpoint de login: `POST http://localhost:4000/api/backoffice/auth/login`
- e-mail inicial de desenvolvimento: `admin@plataforma.local`
- senha inicial de desenvolvimento: `change-me-admin-password`
- comando para popular o banco: `npm run seed:run`

Observacao:
- essas credenciais dependem das variaveis `BACKOFFICE_SUPER_ADMIN_*` configuradas como no `.env.example`
- o frontend tambem pode usar `frontend/.env` com `VITE_API_BASE_URL` e `VITE_BACKOFFICE_API_BASE_URL`
- troque a senha depois do primeiro acesso local

## Documentacao detalhada
- [11 - Backoffice - Visao Geral](./11-backoffice-visao-geral.md)
- [12 - Backoffice - Arquitetura](./12-backoffice-arquitetura.md)
- [13 - Backoffice - Autenticacao e Autorizacao](./13-backoffice-autenticacao-e-autorizacao.md)
- [14 - Backoffice - Backend](./14-backoffice-backend.md)
- [15 - Backoffice - Frontend](./15-backoffice-frontend.md)
- [16 - Backoffice - Gestao de Tenants](./16-backoffice-gestao-de-tenants.md)
- [17 - Backoffice - Usuarios Administrativos](./17-backoffice-usuarios-administrativos.md)
- [18 - Backoffice - Dashboard](./18-backoffice-dashboard.md)
- [19 - Backoffice - Auditoria](./19-backoffice-auditoria.md)
- [20 - Backoffice - Fluxos](./20-backoffice-fluxos.md)
- [21 - Backoffice - Execucao Local](./21-backoffice-execucao-local.md)
- [22 - Backoffice - Roadmap](./22-backoffice-roadmap.md)

## Observacao
Os detalhes de indice global e referencias cruzadas com a documentacao geral do projeto devem ser consolidados em conjunto com `docs/README.md` na etapa seguinte.

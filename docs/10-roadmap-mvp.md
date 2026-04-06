# 10 - Roadmap MVP

## Fases Consolidadas

- definicao arquitetural inicial do SaaS
- modelagem principal do dominio tenant
- autenticacao tenant com JWT
- fundacao do frontend tenant
- modelagem minima do backoffice:
  - `platform_roles`
  - `platform_users`
  - `audit_logs`
- fundacao do backend do backoffice
- fundacao do frontend do backoffice
- dashboard global basico do backoffice
- gestao de tenants
- supervisao de congregacoes por tenant
- supervisao de usuarios administrativos por tenant
- auditoria persistida do backoffice

## MVP Atual

Entregue no backoffice:
- login de plataforma
- sessao isolada do tenant
- dashboard global basico
- modulo de tenants
- visualizacao administrativa de congregacoes
- visualizacao administrativa de usuarios do tenant
- ativacao e inativacao de usuarios do tenant
- auditoria basica

Documentacao detalhada:
- [11 - Backoffice](./11-backoffice.md)
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

Mantido no tenant:
- `/api/auth` original
- router e layout originais
- store tenant original

## Proximos Passos Recomendados

1. Refresh token completo do backoffice
2. Testes automatizados de API do backoffice
3. Testes automatizados do router e guards do frontend
4. Filtros mais avancados na auditoria
5. Gestao mais completa de usuarios administrativos do tenant
6. Revisao de permissoes por perfil de plataforma
7. Melhorias de UX e feedbacks visuais do backoffice

## Fora do Escopo do MVP Atual

- reset de acesso de usuarios tenant
- observabilidade avancada
- exportacao de auditoria
- workflow completo de governanca de permissao

Observacao:
- o backoffice foi consolidado como camada complementar da plataforma e nao substitui o fluxo operacional do tenant

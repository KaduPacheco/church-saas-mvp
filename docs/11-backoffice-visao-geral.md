# 11 - Backoffice - Visao Geral

## Objetivo
Documentar o papel do backoffice como camada administrativa global da plataforma SaaS, separada da area operacional da igreja cliente.

## Contexto
O projeto possui duas camadas de acesso coexistindo no mesmo repositorio:

1. Tenant
- usada pela igreja cliente
- voltada para operacao da igreja
- autenticacao em `/api/auth/*`

2. Plataforma / Backoffice
- usada por operadores internos do SaaS
- voltada para administracao global da plataforma
- autenticacao em `/api/backoffice/*`

## O que o backoffice nao e
- nao substitui o painel operacional da igreja
- nao reutiliza cargos ministeriais como autorizacao tecnica
- nao transforma o operador da plataforma em administrador interno do tenant

## Objetivos do MVP
- autenticar usuarios de plataforma
- exibir indicadores globais da base
- listar tenants e consultar seus dados principais
- consultar congregacoes vinculadas a um tenant
- supervisionar usuarios tecnicos do tenant
- permitir mudanca segura de status de tenant
- permitir ativacao e inativacao de usuarios do tenant
- registrar acoes criticas em auditoria persistida

## Principios arquiteturais adotados
- preservar compatibilidade com backend e frontend existentes
- manter separacao explicita entre tenant e plataforma
- reutilizar padroes reais ja adotados no projeto
- evitar mudancas destrutivas em tabelas centrais do tenant
- priorizar evolucao incremental e segura

## Escopo funcional entregue no codigo atual
- login de plataforma
- sessao isolada no frontend
- dashboard global basico
- gestao de tenants
- supervisao de congregacoes por tenant
- supervisao de usuarios administrativos do tenant
- auditoria basica com consulta

## Limitacoes atuais do MVP
- sem fluxo completo de refresh token do backoffice no frontend
- sem reset de acesso de usuario tenant
- sem exportacao de auditoria
- sem modulo visual de gestao de permissoes de plataforma
- sem testes automatizados do backoffice implementados no repositorio atual

## Documentos relacionados
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

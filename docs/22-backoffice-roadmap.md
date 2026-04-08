# 22 - Backoffice - Roadmap

## Objetivo
Registrar o que esta pronto no MVP do backoffice, o que ainda e limitado e quais evolucoes fazem sentido a seguir.

## O que ja esta pronto
- autenticacao de plataforma
- autorizacao por permissoes de plataforma
- sessao de backoffice isolada no frontend
- dashboard global basico
- listagem e detalhe de tenants
- visualizacao de congregacoes por tenant
- visualizacao de usuarios administrativos do tenant
- ativacao e inativacao de usuarios do tenant
- aba `Usuarios` no backoffice
- listagem, criacao, edicao e ativacao/inativacao de usuarios da plataforma
- provisionamento controlado do admin inicial do tenant
- auditoria persistida com consulta simples

## O que e MVP
No estado atual, o backoffice ja cumpre o objetivo de supervisao administrativa da plataforma, mas ainda com escopo controlado:

- visao global do ecossistema
- controle minimo de status
- auditoria de eventos criticos
- separacao real entre plataforma e tenant

## Limitacoes conhecidas
- sem gestao visual de papeis e permissoes de plataforma
- sem reset de acesso de usuario tenant
- sem exportacao de auditoria
- sem testes automatizados HTTP/integrados dos endpoints do backoffice
- sem testes automatizados do frontend para router, guards e interceptor
- sem filtros avancados para usuarios administrativos

## Proximos passos recomendados
1. adicionar testes automatizados de API para os endpoints do backoffice
2. adicionar testes do router, guards e interceptor do frontend
3. melhorar filtros e consulta de auditoria
4. adicionar filtros mais ricos para usuarios administrativos
5. extrair a logica de onboarding do tenant de `/api/auth/register` para um servico reutilizavel
6. implementar a criacao de usuarios internos pelo painel do tenant
7. evoluir a documentacao operacional do deploy do backoffice

## Fora do escopo do MVP atual
- observabilidade avancada
- governanca completa de permissao
- gestao interna da igreja pelo backoffice
- reset de senha improvisado para usuarios tenant

## Regra de evolucao futura
Qualquer expansao do backoffice deve manter:
- separacao entre plataforma e tenant
- isolamento de sessao
- ausencia de dependencia de cargo ministerial
- compatibilidade com `/api/auth` e com o frontend operacional atual

## Documentacao relacionada
- `23-fluxo-de-criacao-de-usuarios.md`
- `24-backoffice-usuarios.md`

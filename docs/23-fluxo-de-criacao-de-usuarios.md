# 23 - Fluxo de Criacao de Usuarios

## Objetivo
Definir com clareza quem cria cada tipo de usuario no sistema, em que momento isso acontece e como a separacao entre plataforma, tenant, membro e cargo ministerial deve ser preservada.

Este documento foi ajustado com base no codigo real atual e diferencia:
- o que esta implementado
- o que esta parcialmente implementado
- o que continua proposto

## Resumo executivo
O modelo adotado no projeto e:

- o backoffice cria:
  - tenant
  - admin inicial do tenant
- o tenant cria:
  - os demais usuarios internos
- o modulo de membros cria:
  - membros
- o dominio ministerial define:
  - cargos ministeriais

Regras centrais:
- usuario de plataforma nao e usuario da igreja
- usuario da igreja nao acessa o backoffice por padrao
- membro nao vira usuario automaticamente
- cargo ministerial nao concede permissao tecnica sozinho
- vinculo entre usuario e membro e opcional

## Camadas conceituais

### Camada 1 - Usuarios da plataforma
Representam operadores internos do SaaS.

Modelagem atual:
- tabela `platform_users`
- tabela `platform_roles`

Status:
- autenticacao: implementado
- seed/bootstrap inicial: implementado
- criacao por interface administrativa: implementado

### Camada 2 - Usuarios do tenant
Representam contas tecnicas usadas no painel operacional da igreja.

Modelagem atual:
- tabela `users`
- tabela `permission_profiles`
- vinculo obrigatorio com `church_id`
- vinculo opcional com `congregation_id`
- vinculo opcional com `member_id`

Status:
- autenticacao: implementado
- criacao do admin inicial no onboarding do backoffice: implementado
- criacao de usuarios adicionais pelo painel da igreja: proposto

### Camada 3 - Dominio ministerial e eclesiastico
Representa a estrutura real da igreja sem governar sozinha o acesso tecnico ao sistema.

Modelagem atual:
- tabela `members`
- tabela `roles`

Status:
- modelagem separada: implementado
- vinculo opcional com usuario: parcialmente implementado

## Como o sistema esta hoje

### O que ja existe no codigo
- `POST /api/backoffice/tenants` cria:
  - tenant em `churches`
  - cargos ministeriais padrao em `roles`
  - perfis tecnicos padrao em `permission_profiles`
  - categorias financeiras padrao
  - primeiro admin do tenant em `users`
- `POST /api/auth/register` continua existindo por compatibilidade e reaproveita a mesma logica de onboarding
- `POST /api/backoffice/auth/login` autentica `platform_users`
- o backoffice consegue:
  - listar tenants
  - listar congregacoes por tenant
  - listar usuarios do tenant
  - ativar e inativar usuarios do tenant

### Limitacao residual do estado atual
`POST /api/auth/register` continua como fluxo legado/self-service.

Ele nao deve ser tratado como fluxo principal para a operacao da plataforma.

## Decisao arquitetural adotada
O fluxo principal recomendado e:

1. o backoffice cria o tenant
2. o backoffice cria o admin inicial do tenant na mesma operacao
3. a igreja usa esse primeiro admin para entrar no painel
4. depois disso, a propria igreja cria os demais usuarios internos

Observacao:
- `POST /api/auth/register` continua como fluxo legado
- o fluxo principal passou a ser `POST /api/backoffice/tenants`

## Matriz de criacao de usuarios

| Tipo | Quem cria | Onde nasce | Tabela principal | Status |
| --- | --- | --- | --- | --- |
| Usuario de plataforma | Seed, bootstrap ou outro super admin da plataforma | Backoffice / operacao da plataforma | `platform_users` | Implementado |
| Admin inicial do tenant | Backoffice no onboarding da igreja | Onboarding do tenant | `users` | Implementado |
| Usuarios adicionais do tenant | Admin da igreja | Painel da igreja | `users` | Proposto |
| Membro | Operacao da igreja | Modulo de membros | `members` | Modelado |
| Cargo ministerial | Operacao da igreja | Dominio eclesiastico | `roles` | Implementado |
| Vinculo usuario-membro | Acao explicita da igreja | Gestao de usuarios | `users.member_id` | Parcialmente implementado |

## Fluxos funcionais

### Fluxo A - Criacao de usuario de plataforma
Fluxo recomendado:

1. em desenvolvimento, nasce por seed/bootstrap
2. em producao, o primeiro nasce por bootstrap controlado
3. novos usuarios de plataforma sao criados por um super admin da plataforma

Estado atual:
- seed de `platform_roles`: implementado
- seed opcional de `platform_users`: implementado
- login de plataforma: implementado
- criacao manual via endpoint e tela: implementado

### Fluxo B - Criacao de nova igreja cliente
Fluxo recomendado:

1. operador da plataforma cria a igreja sede no backoffice
2. o sistema cria o tenant em `churches`
3. o sistema cria a base inicial do tenant:
   - `roles`
   - `permission_profiles`
   - categorias financeiras padrao
4. o sistema prepara a conta do admin inicial

Estado atual:
- implementado no backoffice em `POST /api/backoffice/tenants`
- mantido tambem em `/api/auth/register` como reaproveitamento legado

### Fluxo C - Criacao do admin inicial do tenant
Fluxo recomendado:

1. no onboarding, o backoffice recebe:
   - dados da igreja sede
   - nome do administrador inicial
   - e-mail
   - senha inicial
2. o sistema cria `users` com:
   - `church_id` da nova igreja
   - `congregation_id = null`
   - `permission_profile_id` do perfil `Administrador Geral`
   - `member_id = null`
3. o admin inicial entra no painel do tenant e passa a administrar a igreja

Estado atual:
- implementado dentro da transacao de onboarding compartilhada
- acessivel pelo backoffice em `POST /api/backoffice/tenants`

### Fluxo D - Criacao de usuarios adicionais dentro da igreja
Fluxo recomendado:

1. admin da igreja acessa o painel do tenant
2. cria um novo usuario tecnico
3. informa:
   - nome
   - email
   - senha inicial
   - perfil tecnico
   - escopo sede ou congregacao
   - vinculo opcional com membro
4. o sistema grava o usuario em `users`

Estado atual:
- proposto

### Fluxo E - Vinculo opcional entre usuario e membro
Fluxo recomendado:

1. o membro e criado no modulo de membros
2. depois, se fizer sentido, um usuario tecnico pode ser vinculado a esse membro
3. o sistema grava `member_id` no usuario

Regras:
- o vinculo e opcional
- nao e automatico
- nao transforma todo membro em usuario

Estado atual:
- a coluna `users.member_id` existe
- o `getMe` ja considera o membro vinculado
- fluxo de criacao ou edicao desse vinculo ainda nao existe

### Fluxo F - Tratamento de cargos ministeriais
Fluxo recomendado:

1. o cargo ministerial permanece em `roles`
2. a pessoa permanece em `members`
3. o acesso tecnico permanece em `users`
4. o perfil tecnico permanece em `permission_profiles`

Regra central:
- cargo ministerial nunca define sozinho permissao tecnica

## Regras de negocio consolidadas
- `platform_users` representa operador da plataforma
- `users` representa operador do tenant
- `members` representa pessoa da comunidade
- `platform_roles` define acesso ao backoffice
- `permission_profiles` define acesso ao painel do tenant
- `roles` define cargo ministerial
- o cadastro em `members` nao cria conta em `users`
- o admin inicial do tenant pode nascer com `member_id = null`

## Fluxo tecnico recomendado

### Servico de onboarding
O projeto agora centraliza o onboarding em um servico reutilizavel:

- `backend/src/modules/tenants/tenant-onboarding.service.js`

Esse servico e responsavel por:
- criar igreja
- criar cargos ministeriais padrao
- criar perfis tecnicos padrao
- criar categorias financeiras padrao
- criar admin inicial do tenant

### Endpoints atuais

#### Backoffice
- `POST /api/backoffice/tenants`
  - cria tenant + admin inicial

#### Tenant legado
- `POST /api/auth/register`
  - reaproveita a mesma logica, mas nao e o fluxo principal recomendado

## Status por tema

### Implementado
- separacao estrutural entre `platform_users` e `users`
- separacao estrutural entre `users` e `members`
- separacao estrutural entre `roles` e `permission_profiles`
- login de plataforma
- login de tenant
- onboarding tecnico de tenant em servico reutilizavel
- onboarding principal do tenant em `/api/backoffice/tenants`
- seed de plataforma

### Parcialmente implementado
- vinculo opcional entre usuario e membro na modelagem
- `POST /api/auth/register` ainda existe como fluxo legado

### Proposto
- criacao de usuarios adicionais pelo tenant
- reset de acesso com auditoria

## Ordem recomendada de implementacao
1. manter seed/bootstrap da plataforma
2. manter o onboarding de tenant centralizado em servico reutilizavel
3. manter `/api/auth/register` como legado temporario ou self-service opcional
4. implementar gestao de usuarios do tenant no painel da igreja
5. implementar vinculo opcional entre usuario e membro

## Conclusao
A melhor abordagem para o projeto atual permanece:

- plataforma/backoffice cria tenant e admin inicial
- tenant cria os demais usuarios internos
- membro continua separado de usuario
- cargo ministerial continua separado de permissao tecnica

Essa direcao reaproveita a modelagem ja existente, evita reescrita agressiva e prepara o projeto para uma evolucao incremental coerente com o backoffice ja implementado.

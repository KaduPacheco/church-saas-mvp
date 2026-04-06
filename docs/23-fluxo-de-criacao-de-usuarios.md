# 23 - Fluxo de Criacao de Usuarios

## Objetivo
Definir de forma clara quem cria cada tipo de usuario no sistema, em que momento isso acontece e como a separacao entre plataforma, tenant, membro e cargo ministerial deve ser preservada.

Este documento foi escrito com base no codigo real atual e diferencia o que ja esta implementado, o que esta parcialmente implementado e o que fica como proposta de evolucao incremental.

## Resumo executivo
O modelo recomendado para o projeto e:

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

Exemplos:
- Super Administrador da Plataforma
- Operador da Plataforma
- Suporte
- Analista

Modelagem atual:
- tabela `platform_users`
- tabela `platform_roles`

Funcao:
- acessar o backoffice
- administrar tenants
- supervisionar usuarios tecnicos dos tenants
- consultar auditoria

Status:
- autenticacao: implementado
- seed/bootstrap inicial: implementado
- criacao por interface ou endpoint administrativo: proposto

### Camada 2 - Usuarios do tenant
Representam contas tecnicas usadas no painel operacional da igreja.

Exemplos:
- Administrador Geral
- Administrador de Congregacao
- Operador
- Tesoureiro
- Visualizador

Modelagem atual:
- tabela `users`
- tabela `permission_profiles`
- vinculo obrigatorio com `church_id`
- vinculo opcional com `congregation_id`
- vinculo opcional com `member_id`

Funcao:
- acessar o painel da igreja
- operar membros, congregacoes, financeiro e demais modulos internos

Status:
- autenticacao: implementado
- criacao do admin inicial: implementado
- criacao de usuarios adicionais: proposto

### Camada 3 - Dominio ministerial e eclesiastico
Representa a estrutura real da igreja, sem governar sozinha o acesso tecnico ao sistema.

Exemplos:
- Pastor
- Obreiro
- Diacono
- Missionario
- Membro

Modelagem atual:
- tabela `members`
- tabela `roles`

Funcao:
- representar pessoa, vinculo comunitario e cargo ministerial
- enriquecer contexto do usuario quando houver `member_id`

Status:
- modelagem separada: implementado
- vinculo opcional com usuario: parcialmente implementado

## Como o sistema esta hoje

### O que ja existe no codigo
- `POST /api/auth/register` cria:
  - tenant em `churches`
  - cargos ministeriais padrao em `roles`
  - perfis tecnicos padrao em `permission_profiles`
  - categorias financeiras padrao
  - primeiro admin do tenant em `users`
- `POST /api/backoffice/auth/login` autentica `platform_users`
- o backoffice ja consegue:
  - listar tenants
  - listar congregacoes por tenant
  - listar usuarios do tenant
  - ativar e inativar usuarios do tenant

### Limitacao do estado atual
Hoje o fluxo principal de onboarding do tenant ainda esta dentro do auth publico do tenant, em `POST /api/auth/register`.

Isso funciona tecnicamente, mas nao e o melhor encaixe arquitetural para um SaaS com backoffice administrativo.

## Decisao arquitetural adotada
O fluxo principal recomendado passa a ser:

1. o backoffice cria o tenant
2. o backoffice cria o admin inicial do tenant
3. a igreja usa esse primeiro admin para entrar no painel
4. depois disso, a propria igreja cria os demais usuarios internos

Observacao:
- `POST /api/auth/register` pode continuar existindo temporariamente por compatibilidade
- ele nao deve ser tratado como fluxo principal de onboarding no desenho futuro

## Matriz de criacao de usuarios

| Tipo | Quem cria | Onde nasce | Tabela principal | Status |
| --- | --- | --- | --- | --- |
| Usuario de plataforma | Seed, bootstrap ou outro super admin da plataforma | Backoffice / operacao da plataforma | `platform_users` | Parcialmente implementado |
| Admin inicial do tenant | Backoffice no onboarding da igreja | Onboarding do tenant | `users` | Implementado na logica, mas hoje acoplado a `/api/auth/register` |
| Usuarios adicionais do tenant | Admin da igreja | Painel da igreja | `users` | Proposto |
| Membro | Operacao da igreja | Modulo de membros | `members` | Modelado |
| Cargo ministerial | Operacao da igreja | Dominio eclesiastico | `roles` | Implementado |
| Vinculo usuario-membro | Acao explicita da igreja | Gestao de usuarios | `users.member_id` | Parcialmente implementado |

## Fluxos funcionais

### Fluxo A - Criacao de usuario de plataforma
Fluxo recomendado:

1. em desenvolvimento, nasce por seed/bootstrap
2. em producao, o primeiro nasce por bootstrap controlado
3. novos usuarios de plataforma sao criados por um Super Administrador da Plataforma

Estado atual:
- seed de `platform_roles`: implementado
- seed opcional de `platform_users`: implementado
- login de plataforma: implementado
- criacao manual via endpoint ou tela: proposto

Regra:
- usuario de plataforma nunca e salvo em `users`

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
- a logica existe e esta implementada
- o ponto de entrada ainda esta em `/api/auth/register`

### Fluxo C - Criacao do admin inicial do tenant
Fluxo recomendado:

1. no onboarding, o backoffice recebe:
   - nome da igreja
   - nome do administrador inicial
   - email
   - senha inicial
2. o sistema cria `users` com:
   - `church_id` da nova igreja
   - `congregation_id = null`
   - `permission_profile_id` do perfil `Administrador Geral`
   - `member_id = null`
3. o admin inicial entra no painel do tenant e passa a administrar a igreja

Estado atual:
- implementado dentro da transacao de `POST /api/auth/register`

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

### 1. Separacao de identidades
- `platform_users` representa operador da plataforma
- `users` representa operador do tenant
- `members` representa pessoa da comunidade

### 2. Separacao de autorizacao
- `platform_roles` define acesso ao backoffice
- `permission_profiles` define acesso ao painel do tenant
- `roles` define cargo ministerial

### 3. Membro nao vira usuario automaticamente
O cadastro em `members` nao deve criar conta em `users`.

### 4. Usuario pode existir sem membro vinculado
O admin inicial do tenant pode nascer com `member_id = null`.

### 5. Usuario de congregacao deve respeitar escopo
Quando o usuario for local de congregacao, ele deve usar `congregation_id` para restringir sua atuacao.

### 6. Quem cria quem
- plataforma cria plataforma
- backoffice cria tenant e admin inicial
- igreja cria usuarios internos
- modulo de membros cria membros

### 7. Quem pode inativar usuarios
Estado atual:
- backoffice ja pode ativar e inativar usuarios do tenant

Proposta futura:
- admin do tenant tambem deve poder ativar e inativar usuarios internos, conforme perfil tecnico

### 8. Reset de acesso
Ainda nao implementado.

Nao deve ser improvisado sem definicao arquitetural e trilha de auditoria.

## Fluxo tecnico recomendado

### Servico de onboarding
A evolucao mais segura e extrair de `auth.service.register` um servico transacional reutilizavel, por exemplo:

- `tenant-onboarding.service.js`

Esse servico ficaria responsavel por:
- criar igreja
- criar cargos ministeriais padrao
- criar perfis tecnicos padrao
- criar categorias financeiras padrao
- criar admin inicial do tenant

### Endpoints recomendados

#### Backoffice
- `POST /api/backoffice/tenants`
  - cria tenant + admin inicial

#### Tenant
- `POST /api/users`
  - cria usuario tecnico interno
- `PATCH /api/users/:id`
  - atualiza dados e perfil
- `PATCH /api/users/:id/status`
  - ativa ou inativa
- `PATCH /api/users/:id/member-link`
  - vincula ou remove membro, se esse fluxo for adotado

### Tabelas envolvidas
- `platform_users`
- `platform_roles`
- `churches`
- `congregations`
- `users`
- `permission_profiles`
- `members`
- `roles`

### Validacoes principais
- email obrigatorio e valido
- email unico para `users` no modelo atual
- senha minima obrigatoria
- `church_id` obrigatorio em `users`
- `permission_profile_id` obrigatorio
- `member_id` opcional
- `congregation_id` opcional, mas sujeito a regra de escopo

## Status por tema

### Implementado
- separacao estrutural entre `platform_users` e `users`
- separacao estrutural entre `users` e `members`
- separacao estrutural entre `roles` e `permission_profiles`
- login de plataforma
- login de tenant
- onboarding tecnico de tenant em `/api/auth/register`
- seed de plataforma

### Parcialmente implementado
- vinculo opcional entre usuario e membro na modelagem
- fluxo do admin inicial do tenant, que existe mas ainda nao nasceu no backoffice

### Proposto
- criacao de tenant pelo backoffice
- criacao de usuarios adicionais pelo tenant
- criacao de novos usuarios de plataforma por super admin
- reset de acesso com auditoria

## Ordem recomendada de implementacao
1. manter seed/bootstrap da plataforma
2. extrair o onboarding de tenant para servico reutilizavel
3. implementar `POST /api/backoffice/tenants`
4. manter `/api/auth/register` como legado temporario ou self-service opcional
5. implementar gestao de usuarios do tenant no painel da igreja
6. implementar vinculo opcional entre usuario e membro

## Impacto na documentacao existente
Este documento complementa:

- `06-autenticacao.md`
- `08-cargos-e-permissoes.md`
- `12-backoffice-arquitetura.md`
- `17-backoffice-usuarios-administrativos.md`
- `22-backoffice-roadmap.md`

## Conclusao
A melhor abordagem para o projeto atual e:

- plataforma/backoffice cria tenant e admin inicial
- tenant cria os demais usuarios internos
- membro continua separado de usuario
- cargo ministerial continua separado de permissao tecnica

Essa direcao reaproveita a modelagem ja existente, evita reescrita agressiva e prepara o projeto para uma evolucao incremental coerente com o backoffice ja implementado.

# 23 - Fluxo de Criacao de Usuarios

## Objetivo
Registrar quem cria cada tipo de usuario no projeto, onde essa criacao acontece e como a separacao entre plataforma, tenant, membro e cargo ministerial permanece preservada no estado real atual do codigo.

Este documento diferencia:
- implementado
- parcialmente implementado
- proposto

## Resumo executivo
O modelo atual consolidado e:

- a plataforma/backoffice cria:
  - a igreja cliente
  - o admin inicial do tenant
- o tenant cria depois:
  - os demais usuarios internos
- o modulo de membros cria:
  - membros
- o dominio ministerial define:
  - cargos ministeriais

Regras centrais:
- `platform_users` nao se mistura com `users`
- `users` nao se mistura com `members`
- `roles` nao substitui `permission_profiles`
- membro nao vira usuario automaticamente
- cargo ministerial nao concede permissao tecnica sozinho

## Camadas conceituais

### Camada 1 - Usuarios da plataforma
Representam operadores internos do SaaS.

Modelagem atual:
- tabela `platform_users`
- tabela `platform_roles`

Status:
- autenticacao: implementado
- criacao pelo backoffice: implementado
- edicao e ativacao/inativacao: implementado

### Camada 2 - Usuarios do tenant
Representam contas tecnicas do painel operacional da igreja.

Modelagem atual:
- tabela `users`
- tabela `permission_profiles`
- `church_id` obrigatorio
- `congregation_id` opcional
- `member_id` opcional

Status:
- autenticacao: implementado
- criacao do admin inicial no onboarding: implementado
- criacao de usuarios adicionais pelo tenant: proposto

### Camada 3 - Dominio ministerial e eclesiastico
Representa a estrutura real da igreja sem controlar sozinha o acesso tecnico.

Modelagem atual:
- tabela `members`
- tabela `roles`

Status:
- modelagem separada: implementado
- vinculo opcional usuario-membro: parcialmente implementado

## Estado anterior
Antes da consolidacao atual, o onboarding do tenant estava acoplado ao fluxo de registro em:

- `backend/src/modules/auth/auth.service.js`

O metodo `register()` concentrava a criacao da igreja, seeds do tenant, criacao do admin inicial e, logo depois, o passo de autenticacao com tokens.

Esse desenho tinha duas limitacoes principais:
- dificultava o reaproveitamento no backoffice
- misturava nascimento do tenant com inicio de sessao

## Estado atual no codigo

### Servico compartilhado
O onboarding transacional do tenant agora fica centralizado em:

- `backend/src/modules/tenants/tenant-onboarding.service.js`

Esse servico hoje:
- cria a igreja em `churches`
- cria cargos ministeriais padrao em `roles`
- cria perfis tecnicos padrao em `permission_profiles`
- cria categorias financeiras padrao
- resolve o perfil tecnico `Administrador Geral`
- cria o admin inicial do tenant em `users`

Tambem existe um metodo reutilizavel adicional:
- `provisionInitialAdminForExistingTenant(...)`

Status desse metodo:
- implementado no servico
- ainda nao exposto por endpoint proprio no backoffice atual

### Quem usa o servico hoje

#### `POST /api/auth/register`
Usa `tenantOnboardingService.onboardTenant(...)` e continua existindo por compatibilidade.

Depois do onboarding, `auth.service.js` continua responsavel por:
- gerar tokens
- salvar refresh token
- atualizar `last_login`
- formatar a resposta do endpoint

#### `POST /api/backoffice/tenants`
Usa `tenantOnboardingService.onboardTenant(...)` como fluxo oficial de onboarding da plataforma.

Depois do onboarding, o backoffice continua responsavel por:
- registrar auditoria de plataforma
- devolver resumo do tenant criado
- devolver resumo do admin inicial

## Matriz de criacao de usuarios

| Tipo | Quem cria | Onde nasce | Tabela principal | Status |
| --- | --- | --- | --- | --- |
| Usuario de plataforma | Backoffice ou bootstrap da plataforma | Backoffice | `platform_users` | Implementado |
| Admin inicial do tenant | Backoffice no onboarding da igreja | Onboarding do tenant | `users` | Implementado |
| Admin inicial via fluxo legado | `/api/auth/register` por compatibilidade | Registro legado | `users` | Parcialmente implementado |
| Usuarios adicionais do tenant | Admin da igreja | Painel do tenant | `users` | Proposto |
| Membro | Operacao da igreja | Modulo de membros | `members` | Modelado |
| Cargo ministerial | Operacao da igreja | Dominio eclesiastico | `roles` | Implementado |
| Vinculo usuario-membro | Acao explicita da igreja | Gestao de usuarios | `users.member_id` | Parcialmente implementado |

## Fluxos funcionais

### Fluxo A - Criacao de usuario de plataforma
Estado atual:
- implementado via backoffice
- isolado em `platform_users`
- usa `platform_roles`

### Fluxo B - Criacao de nova igreja cliente
Fluxo recomendado atual:

1. operador da plataforma acessa o backoffice
2. informa dados da igreja cliente
3. informa dados do admin inicial
4. o sistema executa `tenantOnboardingService.onboardTenant(...)`
5. o sistema registra auditoria
6. a igreja passa a existir em `churches`
7. o admin inicial passa a existir em `users`

Estado atual:
- implementado em `POST /api/backoffice/tenants`

### Fluxo C - Registro legado de nova igreja
Fluxo mantido por compatibilidade:

1. cliente chama `POST /api/auth/register`
2. o backend reaproveita `tenantOnboardingService.onboardTenant(...)`
3. depois disso, `auth.service.js` gera os tokens e inicia a sessao

Estado atual:
- implementado
- mantido como compatibilidade temporaria
- nao e o fluxo principal recomendado da plataforma

### Fluxo D - Criacao de usuarios adicionais dentro da igreja
Fluxo recomendado:

1. a igreja entra no painel do tenant
2. cria usuarios tecnicos adicionais
3. define perfil tecnico, escopo e eventual vinculo com membro

Estado atual:
- proposto

### Fluxo E - Vinculo opcional entre usuario e membro
Estado atual:
- `users.member_id` existe
- `GET /api/auth/me` ja considera o membro vinculado
- fluxo explicito de criar/editar esse vinculo ainda nao existe

### Fluxo F - Tratamento de cargos ministeriais
Estado atual:
- `roles` continua no dominio ministerial
- `permission_profiles` continua no dominio tecnico
- nao ha reaproveitamento de cargo ministerial como permissao tecnica

## Regras de negocio consolidadas
- `platform_users` representa operador da plataforma
- `users` representa operador do tenant
- `members` representa pessoa da comunidade
- `platform_roles` define acesso ao backoffice
- `permission_profiles` define acesso ao painel do tenant
- `roles` define cargo ministerial
- o cadastro em `members` nao cria conta em `users`
- o admin inicial do tenant nasce com `member_id = null`
- o admin inicial do tenant nasce com `congregation_id = null`

## Status por tema

### Implementado
- separacao estrutural entre plataforma e tenant
- separacao estrutural entre usuario tecnico, membro e cargo ministerial
- servico compartilhado de onboarding do tenant
- fluxo oficial de onboarding via backoffice
- fluxo legado de `/api/auth/register` reaproveitando o mesmo servico
- login do tenant com usuarios criados pelo onboarding

### Parcialmente implementado
- `/api/auth/register` permanece como compatibilidade temporaria
- metodo `provisionInitialAdminForExistingTenant(...)` existe no servico, mas ainda nao tem fluxo publico proprio no backoffice
- vinculo opcional entre usuario e membro existe na modelagem, mas nao no fluxo completo de gestao

### Proposto
- criacao de usuarios adicionais pelo tenant
- reset de acesso com auditoria
- fluxo publico controlado para provisionar admin inicial em tenant preexistente, se fizer sentido operacional

## Conclusao
O estado atual consolidado do projeto e:

- o onboarding do tenant foi extraido para um servico reutilizavel
- o backoffice passou a ser o fluxo oficial para criar igreja cliente + admin inicial
- `/api/auth/register` continua funcionando, mas como compatibilidade
- o login do tenant continua baseado no contrato de `users`
- a gestao rotineira de usuarios internos continua fora do backoffice

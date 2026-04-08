# 28 - Modulo de Cargos Ministeriais do Tenant

## Objetivo
O modulo de Cargos ministeriais permite que o tenant mantenha o catalogo eclesiastico da igreja sem confundir `roles` com `permission_profiles`.

No estado atual do codigo:
- o modulo fica disponivel no painel tenant na rota frontend `/roles`
- a API tenant-side fica exposta em `/api/roles`
- cargo ministerial continua sendo dominio da igreja
- perfil tecnico continua sendo dominio de acesso ao sistema
- cargo ministerial nao concede permissao tecnica automaticamente

## Modelagem Envolvida

Tabelas usadas diretamente:
- `roles`
- `churches`
- `members`

Tabelas relacionadas conceitualmente:
- `permission_profiles`
- `users`

Campos utilizados no MVP atual:
- `id`
- `church_id`
- `name`
- `description`
- `is_system`
- `is_active`
- `created_at`
- `updated_at`

Relacoes relevantes:
- cada cargo ministerial pertence a um tenant por `roles.church_id`
- `members.role_id` ja existe e permite vinculo opcional entre membro e cargo
- `roles` nao substitui `permission_profiles`
- `users` nao recebem permissao tecnica por causa do cargo ministerial

## Naming e Permissoes

Naming consolidado no branch atual:
- dominio e rota: `roles`
- permissao de leitura: `roles:read`
- permissao de escrita: `roles:write`
- permissao usada para alteracao de status: `roles:delete`

Observacao importante:
- o projeto ja possuia o catalogo `roles:read`, `roles:write` e `roles:delete`
- nesta entrega nao foram criadas novas permissoes
- a alteracao de status reutiliza `roles:delete` por compatibilidade com o catalogo atual

## Regras de Negocio

- nome do cargo ministerial eh obrigatorio
- nome deve ter entre 3 e 100 caracteres
- descricao eh opcional
- o nome do cargo deve ser unico dentro do tenant com comparacao case-insensitive em nivel de service
- status operacional do modulo usa `active` e `inactive`, refletindo o campo booleano `is_active`
- nao existe exclusao fisica pela UI; o fluxo principal eh ativar/inativar
- cargos padrao criados no onboarding (`is_system = true`) permanecem bloqueados para edicao e inativacao nesta etapa
- cargo ministerial nao concede permissao tecnica
- cargo ministerial nao substitui perfil tecnico

## Escopo e Seguranca

### Escopo por tenant
- todas as queries do modulo filtram por `roles.church_id`
- nenhum endpoint retorna ou altera cargo de outro tenant

### Escopo por congregacao
- `roles` nao possui `congregation_id`
- a leitura continua tenant-wide dentro do tenant autenticado
- a gestao do catalogo fica restrita a usuarios da sede
- usuarios com `congregationId` definido nao podem criar, editar nem alterar status de cargos ministeriais

### Guardas aplicados
- `authenticate`
- `tenantIsolation`
- `authorize('roles:read')` para listagem e detalhe
- `authorize('roles:write')` para criacao e edicao
- `authorize('roles:delete')` para alteracao de status

## Endpoints Entregues

### GET `/api/roles`
Lista paginada de cargos ministeriais visiveis no tenant atual.

Query params:
- `search`
- `status`
- `page`
- `perPage`

Resposta:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "churchId": "uuid",
      "name": "Pastor",
      "description": "Lider espiritual da igreja",
      "isSystem": true,
      "isActive": true,
      "status": "active",
      "createdAt": "2026-04-08T12:00:00.000Z",
      "updatedAt": "2026-04-08T12:30:00.000Z",
      "counts": {
        "members": 12
      }
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 1,
    "totalPages": 1
  },
  "summary": {
    "total": 1,
    "active": 1,
    "inactive": 0,
    "system": 1,
    "custom": 0,
    "linkedMembers": 12,
    "scope": "tenant",
    "scopeLabel": "Sede / tenant completo"
  }
}
```

### GET `/api/roles/:id`
Retorna detalhe de um cargo ministerial visivel para o usuario atual.

### POST `/api/roles`
Cria novo cargo ministerial customizado no tenant atual.

Payload principal:

```json
{
  "name": "Coordenador de Midia",
  "description": "Coordena a equipe de comunicacao"
}
```

### PUT `/api/roles/:id`
Atualiza dados cadastrais de um cargo ministerial customizado.

### PATCH `/api/roles/:id/status`
Ativa ou inativa o cargo sem exclusao fisica.

Payload principal:

```json
{
  "status": "inactive"
}
```

## Vinculo com Membros

Estado atual no codigo:
- `members.role_id` ja existe no schema
- o modulo de cargos exibe apenas contadores agregados de membros vinculados
- o modulo de Membros agora consome esse catalogo para permitir atribuicao opcional de cargo ministerial no cadastro e na edicao
- nao foi criado fluxo de atribuicao ou remocao de cargo diretamente dentro do modulo de cargos nesta entrega

Regra importante:
- o vinculo ministerial continua separado de permissao tecnica
- nenhum endpoint deste modulo altera `users`, `permission_profiles` ou login

## UI do Painel Tenant

View entregue:
- `frontend/src/views/dashboard/TenantRolesView.vue`

Service HTTP:
- `frontend/src/services/roles.service.js`

Comportamentos implementados:
- listagem real de cargos do tenant
- busca por nome
- filtro por status
- cards com status, origem do cargo e total de membros vinculados
- detalhe do cargo na mesma tela
- formulario inline de criacao e edicao
- ativacao/inativacao para cargos customizados
- bloqueio visual de cargos padrao do onboarding
- estados de loading, erro, sucesso e vazio
- responsividade basica preservando o layout do painel tenant

## Contrato Frontend

Chamadas usadas:
- `list`
- `getById`
- `create`
- `update`
- `updateStatus`

O frontend continua usando o cliente Axios tenant atual com os mesmos interceptors de JWT e refresh token.

## Testes e Validacao

Cobertura automatizada adicionada:
- listagem isolada por tenant
- leitura por id
- criacao com bloqueio de duplicidade
- edicao de cargo customizado
- alteracao de status
- rejeicao de escrita para usuario escopado por congregacao
- protecao de cargos padrao do onboarding
- middleware `authorize` cobrindo ausencia de `roles:write`

Comandos validados no branch atual:
- `backend`: `npm test`
- `frontend`: `npm run build`

## Limitacoes Atuais

- o modulo nao atribui nem remove cargos diretamente de membros nesta etapa
- cargos `is_system = true` permanecem bloqueados para edicao e inativacao como regra conservadora
- a leitura do catalogo continua tenant-wide porque `roles` nao possui `congregation_id`
- a alteracao de status reutiliza `roles:delete` porque esse eh o catalogo real atual

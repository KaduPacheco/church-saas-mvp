# 27 - Modulo de Membros do Tenant

## Objetivo
O modulo de Membros permite que o tenant mantenha o cadastro pastoral e administrativo da comunidade sem confundir `members` com `users`.

No estado atual do codigo:
- o modulo fica disponivel no painel tenant na rota frontend `/members`
- a API tenant-side fica exposta em `/api/members`
- membro continua sendo entidade de dominio da igreja
- usuario tecnico continua sendo entidade de acesso ao sistema
- nao existe criacao automatica de conta de acesso ao cadastrar membro

## Modelagem Envolvida

Tabelas usadas diretamente:
- `members`
- `churches`
- `congregations`
- `roles`

Tabelas relacionadas conceitualmente:
- `users`

Campos utilizados no MVP atual:
- `id`
- `church_id`
- `congregation_id`
- `role_id`
- `name`
- `email`
- `phone`
- `document`
- `status`
- `gender`
- `marital_status`
- `birth_date`
- `baptism_date`
- `membership_date`
- `address_street`
- `address_number`
- `address_neighborhood`
- `address_city`
- `address_state`
- `address_zipcode`
- `observations`
- `created_at`
- `updated_at`

Relacoes relevantes:
- cada membro pertence a um tenant por `members.church_id`
- `members.congregation_id` continua opcional
- `members.role_id` continua opcional
- membro com `congregation_id = null` continua representando cadastro da sede
- membro pode existir sem cargo ministerial
- quando informado, `members.role_id` referencia um cargo ministerial do mesmo tenant
- usuario sem `congregation_id` opera no escopo completo do tenant
- usuario com `congregation_id` opera de forma restrita a sua congregacao
- `users.member_id` continua fora do escopo desta entrega; nenhum vinculo automatico foi criado

## Naming e Permissoes

Naming consolidado no branch atual:
- dominio e rota: `members`
- permissao de leitura: `members:read`
- permissao de escrita: `members:write`
- permissao usada para alteracao de status: `members:delete`

Observacao importante:
- o projeto ja possuia o catalogo `members:read`, `members:write` e `members:delete`
- nesta entrega nao foram criadas novas permissoes
- a alteracao de status reutiliza `members:delete` por compatibilidade com o catalogo atual e com os profiles existentes

## Regras de Negocio

- nome do membro eh obrigatorio
- nome deve ter entre 3 e 150 caracteres
- `status` deve respeitar o enum real do projeto:
  - `active`
  - `inactive`
  - `transferred`
  - `deceased`
- `congregationId` eh opcional
- se `congregationId` for informado, ele precisa pertencer ao tenant autenticado
- `roleId` eh opcional
- se `roleId` for informado, ele precisa pertencer ao tenant autenticado
- novas atribuicoes de cargo aceitam apenas cargos ministeriais ativos
- um membro que ja possua cargo inativo pode manter esse vinculo ate revisao manual
- `observations` eh opcional
- `observations` aceita ate 5000 caracteres
- nao existe criacao automatica de `users`
- nao existe exclusao fisica pela UI; o fluxo operacional principal eh alteracao de status
- o modulo nao antecipa unificacao entre pessoa cadastrada como membro e conta tecnica de acesso

## Escopo e Seguranca

### Escopo por tenant
- todas as queries do modulo filtram por `members.church_id`
- nenhum endpoint retorna ou altera membro de outro tenant
- `congregationId` informado em filtro ou mutacao sempre eh validado dentro do tenant atual
- `roleId` informado em criacao ou edicao sempre eh validado dentro do tenant atual

### Escopo por congregacao
- usuario com `congregationId = null` enxerga o tenant completo
- usuario com `congregationId` definido enxerga apenas membros da propria congregacao
- usuario escopado nao pode filtrar, consultar ou mutar membros de outra congregacao
- usuario escopado tambem nao pode apontar `congregationId` diferente da propria congregacao ao criar ou editar

### Guardas aplicados
- `authenticate`
- `tenantIsolation`
- `authorize('members:read')` para listagem e detalhe
- `authorize('members:write')` para criacao e edicao
- `authorize('members:delete')` para alteracao de status

## Endpoints Entregues

### GET `/api/members`
Lista paginada de membros visiveis no escopo atual.

Query params:
- `search`
- `status`
- `congregationId`
- `page`
- `perPage`

Busca aplicada em:
- `name`
- `email`
- `phone`
- `document`

Resposta:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "churchId": "uuid",
      "congregationId": "uuid-ou-null",
      "roleId": "uuid-ou-null",
      "name": "Maria de Souza",
      "email": "maria@igreja.com",
      "phone": "11999999999",
      "document": "12345678900",
      "status": "active",
      "gender": "female",
      "maritalStatus": "married",
      "birthDate": "1990-01-01",
      "baptismDate": "2010-02-10",
      "membershipDate": "2011-03-20",
      "observations": "Acompanha o grupo de louvor.",
      "createdAt": "2026-04-08T12:00:00.000Z",
      "updatedAt": "2026-04-08T12:30:00.000Z",
      "congregation": {
        "id": "uuid",
        "name": "Congregacao Central"
      },
      "role": {
        "id": "uuid",
        "name": "Coordenador de Louvor",
        "status": "active",
        "isSystem": false
      },
      "address": {
        "street": "Rua Exemplo",
        "number": "123",
        "neighborhood": "Centro",
        "city": "Sao Paulo",
        "state": "SP",
        "zipcode": "01000-000",
        "label": "Rua Exemplo, 123, Centro, Sao Paulo, SP, 01000-000"
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
    "transferred": 0,
    "deceased": 0,
    "scope": "tenant",
    "scopeLabel": "Sede / tenant completo"
  }
}
```

### GET `/api/members/:id`
Retorna detalhe de um membro visivel para o usuario atual.

### POST `/api/members`
Cria novo membro no tenant atual.

Payload principal:

```json
{
  "name": "Maria de Souza",
  "congregationId": "uuid-ou-null",
  "roleId": "uuid-ou-null",
  "email": "maria@igreja.com",
  "phone": "11999999999",
  "document": "12345678900",
  "gender": "female",
  "maritalStatus": "married",
  "birthDate": "1990-01-01",
  "baptismDate": "2010-02-10",
  "membershipDate": "2011-03-20",
  "addressStreet": "Rua Exemplo",
  "addressNumber": "123",
  "addressNeighborhood": "Centro",
  "addressCity": "Sao Paulo",
  "addressState": "SP",
  "addressZipcode": "01000-000",
  "observations": "Acompanha o grupo de louvor."
}
```

### PUT `/api/members/:id`
Atualiza os dados cadastrais do membro dentro do escopo permitido.

### PATCH `/api/members/:id/status`
Ativa ou inativa o membro sem exclusao fisica.

Payload principal:

```json
{
  "status": "inactive"
}
```

Observacao:
- o endpoint aceita qualquer valor valido de `MEMBER_STATUS`
- a UI atual usa principalmente o fluxo operacional `active <-> inactive`

## UI do Painel Tenant

View entregue:
- `frontend/src/views/dashboard/TenantMembersView.vue`

Service HTTP:
- `frontend/src/services/members.service.js`

Comportamentos implementados:
- listagem real de membros do tenant
- busca por nome, email, telefone e documento
- filtro por status
- filtro por congregacao quando o usuario possui escopo de sede
- resumo com totais por status
- cards com contexto de congregacao, contato e status
- detalhe do membro na mesma tela
- formulario inline de criacao e edicao
- selecao opcional de cargo ministerial no formulario
- campo opcional de observacoes em textarea
- ativacao/inativacao por acao dedicada
- estados de loading, erro, sucesso e vazio
- responsividade basica preservando o layout do painel tenant

Comportamentos explicitos da UI:
- a tela informa que membro nao cria acesso tecnico
- usuario escopado visualiza contexto explicito de restricao por congregacao
- o filtro e o formulario respeitam o escopo atual do usuario
- o formulario usa o catalogo real de `roles` como fonte para cargos ministeriais
- o detalhe exibe o cargo atual e as observacoes do membro quando existirem

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
- leitura por id respeitando escopo
- criacao no tenant correto
- criacao com cargo ministerial valido
- edicao de cadastro com troca ou remocao de cargo
- alteracao de status
- bloqueio de filtro fora do escopo do usuario
- bloqueio de mutacao para congregacao fora do tenant
- bloqueio de cargo ministerial de outro tenant
- persistencia e retorno de observacoes

Comandos validados no branch atual:
- `backend`: `npm test`
- `frontend`: `npm run build`

## Limitacoes Atuais

- o modulo ainda nao cria vinculo tecnico entre `members` e `users`
- a alteracao de status reutiliza `members:delete` porque esse eh o catalogo real atual; nao existe permissao dedicada so para ativar/inativar
- a UI atual nao expoe todos os estados possiveis de `MEMBER_STATUS` como acao rapida; o fluxo principal operacional eh ativar e inativar
- o formulario lista apenas cargos ministeriais ativos para novas atribuicoes; cargos inativos permanecem visiveis apenas quando ja vinculados ao membro em edicao
- o modulo prepara o terreno para evolucao futura de escopo fino por `congregation_id`, mas a politica detalhada de cada profile continua dependente do catalogo atual de permissoes

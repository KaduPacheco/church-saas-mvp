# 26 - Modulo de Congregacoes do Tenant

## Objetivo
O modulo de Congregacoes permite que o administrador do tenant cadastre e mantenha as unidades vinculadas a igreja sede sem confundir `churches` com `congregations`.

No estado atual do codigo:
- a sede continua representada por `churches`
- as unidades subordinadas continuam representadas por `congregations`
- o modulo fica disponivel no painel tenant na rota frontend `/congregations`
- a API tenant-side fica exposta em `/api/congregations`

## Modelagem Envolvida

Tabelas usadas diretamente:
- `churches`
- `congregations`
- `users`
- `members`

Relacoes relevantes:
- cada congregacao pertence a um tenant por `congregations.church_id`
- `users.congregation_id` e `members.congregation_id` continuam opcionais
- usuario sem `congregation_id` opera no escopo completo da sede
- usuario com `congregation_id` fica pronto para escopo restrito por congregacao

## Naming e Permissoes

Naming consolidado no branch atual:
- dominio e rota: `congregations`
- permissao de leitura: `churches:read`
- permissao de escrita: `churches:write`

Observacao importante:
- as permissoes continuam com naming legado `churches:*` porque esse eh o padrao real ja usado em `constants`, profiles padrao, JWT e guards do frontend
- o modulo novo nao criou chaves novas de permissao para evitar divergencia com a arquitetura atual

## Regras de Negocio

- nome da congregacao eh obrigatorio
- nome deve ter entre 3 e 150 caracteres
- endereco eh opcional e limitado a 255 caracteres
- status aceito: `active` ou `inactive`
- o nome da congregacao deve ser unico dentro do tenant com comparacao case-insensitive em nivel de service
- nao existe exclusao fisica pela UI; o fluxo principal eh ativar/inativar
- nenhuma operacao acessa congregacoes de outro tenant
- a sede nao eh transformada em congregacao artificial

## Escopo e Seguranca

### Escopo por tenant
- todas as queries do modulo filtram por `church_id`
- ids de congregacao sempre sao resolvidos dentro do tenant autenticado

### Escopo por congregacao
- usuario com `congregationId = null` pode listar o tenant completo
- usuario com `congregationId` definido enxerga apenas sua propria congregacao no modulo
- usuarios vinculados a uma congregacao especifica nao podem criar, editar nem alterar status de congregacoes, mesmo que exista customizacao futura de perfil

### Guardas aplicados
- `authenticate`
- `tenantIsolation`
- `authorize('churches:read')` para listagem e detalhe
- `authorize('churches:write')` para criacao, edicao e alteracao de status

## Endpoints Entregues

### GET `/api/congregations`
Lista paginada de congregacoes visiveis no escopo atual.

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
      "name": "Congregacao Central",
      "address": "Rua Exemplo, 100",
      "status": "active",
      "createdAt": "2026-04-08T12:00:00.000Z",
      "updatedAt": "2026-04-08T12:30:00.000Z",
      "counts": {
        "users": 2,
        "members": 48
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
    "linkedUsers": 2,
    "linkedMembers": 48,
    "scope": "tenant",
    "scopeLabel": "Sede / tenant completo"
  }
}
```

### GET `/api/congregations/:id`
Retorna detalhe de uma congregacao visivel para o usuario atual.

### POST `/api/congregations`
Cria nova congregacao no tenant atual.

Payload principal:

```json
{
  "name": "Congregacao Vila Mariana",
  "address": "Rua Exemplo, 123",
  "status": "active"
}
```

### PUT `/api/congregations/:id`
Atualiza dados cadastrais da congregacao.

Payload principal:

```json
{
  "name": "Congregacao Vila Mariana",
  "address": "Rua Exemplo, 456"
}
```

### PATCH `/api/congregations/:id/status`
Ativa ou inativa a congregacao sem exclusao fisica.

Payload principal:

```json
{
  "status": "inactive"
}
```

## UI do Painel Tenant

View entregue:
- `frontend/src/views/dashboard/TenantCongregationsView.vue`

Comportamentos implementados:
- lista real de congregacoes do tenant
- busca por nome
- filtro por status
- cards com nome, endereco, status, usuarios e membros vinculados
- pagina de detalhe na mesma tela por selecao de item
- formulario inline para criar e editar
- acao de ativar/inativar
- estados de loading, erro, sucesso e vazio
- responsividade basica preservando o layout do painel tenant

## Contrato Frontend

Service HTTP:
- `frontend/src/services/congregations.service.js`

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
- leitura restrita para usuario com `congregation_id`
- criacao com persistencia no tenant correto
- bloqueio de duplicidade case-insensitive
- alteracao de status
- rejeicao de escrita para usuario escopado
- middleware `authorize` rejeitando ausencia de permissao

Comandos validados no branch atual:
- `backend`: `npm test`
- `frontend`: `npm run build`

## Limitacoes Atuais

- a unicidade case-insensitive do nome esta garantida em nivel de service; ainda nao existe constraint dedicada no banco para isso
- o modulo ainda nao possui exclusao logica separada de `inactive`; o status atual cobre o fluxo principal do MVP
- o modulo prepara o terreno para escopo fino por `congregation_id`, mas os demais modulos tenant ainda nao implementam esse refinamento ponta a ponta

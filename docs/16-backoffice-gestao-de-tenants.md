# 16 - Backoffice - Gestao de Tenants

## Objetivo
Documentar como o backoffice supervisiona tenants no projeto atual.

## Conceito de tenant neste projeto
No codigo real, o tenant principal e a igreja sede registrada em `churches`.

Cada tenant pode ter:
- dados principais da igreja sede
- varias congregacoes em `congregations`
- usuarios tecnicos em `users`
- membros em `members`

Observacao importante:
- documentacoes antigas citavam auto-referencia em `churches`
- o codigo implementado usa `churches` e `congregations` em tabelas separadas

## Endpoints implementados
- `GET /api/backoffice/tenants`
- `GET /api/backoffice/tenants/:id`
- `PATCH /api/backoffice/tenants/:id/status`
- `GET /api/backoffice/tenants/:id/congregations`

## Listagem de tenants
A listagem entrega:
- id
- nome
- email
- telefone
- documento
- plano
- status
- data de criacao
- total de congregacoes
- total de usuarios
- total de membros

Filtros atuais:
- `search`
- `status`
- `page`
- `perPage`

Busca atual:
- nome
- email
- documento

## Detalhe do tenant
A tela de detalhe consolida:
- dados principais
- status
- plano
- data de criacao
- quantidade de congregacoes
- quantidade de usuarios
- quantidade de membros

Tambem funciona como ponto de acesso para:
- congregacoes vinculadas
- usuarios administrativos do tenant

## Status do tenant
Status validos no codigo:
- `active`
- `inactive`
- `suspended`

### `active`
- tenant operando normalmente na plataforma

### `inactive`
- tenant mantido na base, mas marcado como inativo

### `suspended`
- tenant suspenso no contexto administrativo da plataforma
- e o status usado para o conceito de bloqueio no MVP

## Mudanca de status
Endpoint:
- `PATCH /api/backoffice/tenants/:id/status`

Regras atuais:
- nao remove tenant
- nao altera modelagem interna da igreja
- apenas atualiza `churches.status`
- registra auditoria quando o valor realmente muda

## Exemplo de resposta de detalhe
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Igreja Central",
    "email": "contato@igreja.com",
    "phone": "11999999999",
    "document": "123456789",
    "plan": "premium",
    "status": "active",
    "createdAt": "2026-04-01T00:00:00.000Z",
    "updatedAt": "2026-04-05T00:00:00.000Z",
    "counts": {
      "congregations": 3,
      "users": 5,
      "members": 210
    }
  }
}
```

## Limites do MVP
- nao ha exclusao de tenant
- nao ha alteracao de plano pelo backoffice
- nao ha workflow de aprovacao para mudanca de status
- a leitura de congregacoes e acoplada ao detalhe do tenant no frontend atual

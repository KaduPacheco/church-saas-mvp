# 19 - Backoffice - Auditoria

## Objetivo
Descrever a auditoria persistida do backoffice, o que e registrado e como consultar.

## Estrutura persistida
Tabela:
- `audit_logs`

Campos principais:
- `id`
- `actor_platform_user_id`
- `church_id`
- `action`
- `target_type`
- `target_id`
- `target_label`
- `metadata`
- `ip_address`
- `user_agent`
- `created_at`

## Acoes auditadas no codigo atual
- `platform.auth.login`
- `platform.tenant.status.updated`
- `platform.tenant.user.status.updated`

## Onde a auditoria e gravada
Servico:
- `backend/src/modules/backoffice/audit/audit.service.js`

Esse servico e reutilizado pelos modulos do backoffice para registrar eventos criticos.

## Consulta de auditoria
Endpoint:
- `GET /api/backoffice/audit`

Permissao exigida:
- `platform:audit:read`

Filtros atuais:
- `action`
- `targetType`
- `churchId`
- `page`
- `perPage`

## Enriquecimento da consulta
Na leitura, o backend faz `left join` com:
- `platform_users`
- `churches`

Assim, a API retorna:
- ator com nome e email, quando houver
- tenant relacionado, quando houver

## Exemplo de resposta
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "platform.tenant.status.updated",
      "targetType": "tenant",
      "targetId": "uuid",
      "targetLabel": "Igreja Central",
      "metadata": {
        "previousStatus": "active",
        "newStatus": "suspended"
      },
      "createdAt": "2026-04-05T13:00:00.000Z",
      "ipAddress": "::1",
      "userAgent": "Mozilla/5.0",
      "actor": {
        "id": "uuid",
        "name": "Platform Super Admin",
        "email": "admin@plataforma.local"
      },
      "tenant": {
        "id": "uuid",
        "name": "Igreja Central"
      }
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

## Visualizacao no frontend
O frontend possui uma tela simples em `/backoffice/audit` com:
- filtro por acao
- filtro por tipo de alvo
- filtro por tenant via UUID
- paginacao simples

## Decisoes tecnicas
- `metadata` usa JSON para permitir evolucao incremental
- a auditoria e simples, confiavel e acoplada a eventos criticos
- nao ha observabilidade avancada nesta fase

## Limitacoes atuais
- sem exportacao
- sem filtro por intervalo de datas
- sem filtro direto por ator
- sem mascaramento de metadados sensiveis, pois o volume e escopo atual ainda sao pequenos

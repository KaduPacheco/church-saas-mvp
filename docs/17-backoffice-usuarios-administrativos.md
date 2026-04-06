# 17 - Backoffice - Usuarios Administrativos

## Objetivo
Explicar como o backoffice enxerga e supervisiona os usuarios administrativos dos tenants no codigo atual.

Observacao:
- a aba `Usuarios` do backoffice agora trata duas frentes diferentes:
  - usuarios da plataforma
  - provisionamento do admin inicial do tenant
- este documento continua focado apenas na supervisao dos usuarios tecnicos do tenant que ja existem

## Conceito adotado no MVP
No estado atual do projeto, "usuario administrativo do tenant" significa o registro tecnico existente em `users`, associado ao tenant por `church_id`.

O backoffice nao cria um novo tipo de usuario tenant. Ele apenas supervisiona os usuarios tecnicos ja existentes.

## Endpoints implementados
- `GET /api/backoffice/tenants/:id/users`
- `PATCH /api/backoffice/tenants/:id/users/:userId/status`

## O que pode ser visualizado
Para cada usuario do tenant, o backoffice recebe:
- id
- nome
- email
- status ativo/inativo
- ultimo login
- data de criacao
- perfil tecnico do tenant
- permissoes do perfil
- escopo de atuacao

## Perfil tecnico exibido
O backend consulta:
- `users`
- `permission_profiles`
- `congregations`

O retorno inclui:
- `profile.id`
- `profile.name`
- `profile.permissions`

## Escopo exibido
O backend informa um resumo de escopo:

### Escopo de tenant
- usuario vinculado a sede ou sem `congregation_id`
- label: `Sede / tenant completo`

### Escopo de congregacao
- usuario vinculado a uma congregacao especifica
- label com o nome da congregacao

## O que pode ser alterado
No MVP atual, apenas:
- ativar usuario
- inativar usuario

Isso altera:
- `users.is_active`

E registra auditoria:
- `platform.tenant.user.status.updated`

## O que nao faz parte desta etapa
- reset de senha
- redefinicao de acesso
- troca de perfil tecnico
- criacao ou remocao de usuario
- gestao ministerial

## Separacao entre supervisao e gestao interna
O backoffice:
- observa e controla status tecnico minimo
- nao entra no fluxo operacional da igreja
- nao administra cargos ministeriais
- nao substitui o administrador interno do tenant

## Exemplo de payload de alteracao de status
```http
PATCH /api/backoffice/tenants/<tenantId>/users/<userId>/status
Authorization: Bearer <platform_access_token>
Content-Type: application/json

{
  "isActive": false
}
```

## Exemplo de usuario retornado
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "name": "Maria Souza",
  "email": "maria@igreja.com",
  "isActive": true,
  "lastLogin": "2026-04-05T10:00:00.000Z",
  "createdAt": "2026-03-20T12:00:00.000Z",
  "profile": {
    "id": "uuid",
    "name": "Administrador Geral",
    "permissions": ["admin:full"]
  },
  "scope": {
    "type": "tenant",
    "congregationId": null,
    "congregationName": null,
    "label": "Sede / tenant completo"
  }
}
```

## Limitacoes atuais
- o conceito de "usuario administrativo" e pragmatico e baseado na tabela `users`
- nao existe filtro dedicado para mostrar apenas certos perfis
- o frontend atual mostra usuarios dentro do detalhe do tenant, nao em modulo separado
- a criacao rotineira de usuarios internos do tenant continua fora do backoffice e deve acontecer no painel da igreja

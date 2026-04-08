# 07 - Modulo Membros

Este documento permanece como visao conceitual resumida do dominio de membros.

Para a implementacao tenant-side real no branch atual, consulte:
- [27 - Modulo de Membros do Tenant](./27-modulo-membros-tenant.md)

## Papel do dominio

- `members` representa o cadastro pastoral e administrativo da comunidade
- `users` representa contas tecnicas de acesso ao sistema
- os dois dominios continuam separados no estado atual do codigo

## Regras conceituais que permanecem validas

- membro pode ter `congregation_id` opcional
- membro sem `congregation_id` permanece associado a sede
- o cadastro pode ser usado como referencia para operacao pastoral e rotinas administrativas
- vinculos futuros entre membro e usuario tecnico podem existir, mas nao fazem parte do fluxo automatico atual

## Endpoints tenant-side atuais

| Metodo | Endpoint | Permissao minima |
|---|---|---|
| GET | `/api/members` | `members:read` |
| GET | `/api/members/:id` | `members:read` |
| POST | `/api/members` | `members:write` |
| PUT | `/api/members/:id` | `members:write` |
| PATCH | `/api/members/:id/status` | `members:delete` |

## Observacao

- a documentacao detalhada de payloads, filtros, escopo por congregacao, UI e validacao fica concentrada no documento `27`

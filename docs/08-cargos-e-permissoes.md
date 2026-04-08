# 08 - Cargos E Permissoes

Este documento permanece como visao conceitual resumida da separacao entre dominio ministerial e governanca tecnica.

Para a implementacao tenant-side real do catalogo de cargos ministeriais no branch atual, consulte:
- [28 - Modulo de Cargos Ministeriais do Tenant](./28-modulo-cargos-tenant.md)

## Separacao conceitual consolidada

- `roles` representa cargos ministeriais da igreja
- `permission_profiles` representa perfis tecnicos de acesso ao painel do tenant
- `platform_roles` representa perfis tecnicos do backoffice
- essas tres camadas continuam separadas no estado atual do codigo

## Regras conceituais que permanecem validas

- cargo ministerial nao concede permissao tecnica automaticamente
- cargo ministerial nao substitui perfil tecnico
- `members.role_id` representa um vinculo ministerial opcional
- `users.member_id` representa um vinculo opcional entre conta tecnica e pessoa cadastrada
- usuarios vinculados a uma congregacao continuam sujeitos ao escopo do seu `congregation_id`

## Permissoes tecnicas do modulo de cargos

| Acao | Permissao |
|---|---|
| Listar e detalhar cargos | `roles:read` |
| Criar e editar cargos | `roles:write` |
| Alterar status | `roles:delete` |

## Observacao

- a documentacao detalhada de payloads, escopo, endpoints, UI e limitacoes do modulo fica concentrada no documento `28`

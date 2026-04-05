# 07 - Módulo Membros

O Módulo Membros representa o núcleo de Cadastro e CRM Pastoral de uma Igreja na aplicação.

## Funcionalidades e Telas Esperadas
- **Visão em Lista e Filtros**: Uma tabela listando a membresia inteira ou segmentada.
- **Filtros e Paginação**: Sistemas com alto volume lidarão com paginações API via `LIMIT / OFFSET`. Pesquisáveis por nome e status (ex: listar quem congrega no `Campus X` e encontra-se `Inativo`).
- **Campos Importantes em Cadastro**:
  - Dados Básicos Cadastrais: Nome, e-mail (opcional), telefone com máscara (DDD), data de nascimento.
  - Histórico Institucional: Data e local de batismo; dados de Consagrações Ministeriais; campo de Observações da secretaria.
  - Status Lógico e Visor: Membro será categorizado (Ativo, Inativo ou Transferido).

## Regras e Isolamento
- O membro pessoa física preenchido e listado aqui não é mecanicamente interligado numa relação `1-para-1` inquebrável como usuário de login na tabela `USERS` no frontend. Este painel serve explicitamente como registro analítico e gerencial.
- O Membro pode ter `congregation_id` definido, localizando ele a uma filial ou sede específica. 
- Transações de pagamentos no campo contábil podem relatar um `member_id` para fins explicativos de Ofertas/Dízimos nominais rastreáveis individualmente.

## Principais Endpoints Rest
| Método | Endpoint | Permissões (Roles) Mínimas |
|----|----|----|
| GET | `/api/members` | `members:read` |
| GET | `/api/members/:id` | `members:read` |
| POST | `/api/members` | `members:write` |
| PUT | `/api/members/:id` | `members:write` |
| DELETE | `/api/members/:id` | `members:delete` (Recomenda-se lógica de Soft Delete futuro se ligada à tabelas financeiras) |

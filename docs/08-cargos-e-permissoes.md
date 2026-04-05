# 08 - Cargos e Permissões (RBAC)

Para atender a alta de manda de flexibilização Multi-Tier sem engessar nomenclaturas duras e invariáveis na base (Obreiro, Presbítero, Tesoureiro, Mídia), a plataforma aplica um **Controle de Acesso Baseado em Regras Modulares (RBAC)** focado nas `Roles` configuráveis no painel Web.

## Diferença entre Título Social e Perfil de Acesso
- O "Cargo" é social/espiritual e nominal, ex: "Líder de Louvor Jovem". O sistema cadastra no banco a palavra string na tabela _roles_, porém o fator crucial é o campo complementar no objeto de banco daquela _role_ - um JSONB que enumera o array bruto das permissões sistêmicas (ex: `['members:read', 'events:write']`). Esse é o fator mandatório, em vez do título do cargo.

## Categorização de Extratos de Permissões Padronizadas (Sugestivo)

Na concepção e Setup de uma igreja na ponta do Funil pelo administrador-sys:
- `admin:full` - Flag especial de bypass. Concede autoridade mestra visando a configuração e manipulação extrema inicial. Ignora checagens isoladas e libera todos botões no UI Vue e lógicas API Node.
- `dashboard:read` - Habilitação ao resumo visual central e liberação do acesso padrão mínimo de um login ao Home.
- `members:read` | `members:write` | `members:delete`
- `roles:read` | `roles:write` | `roles:delete`
- `financial:read` | `financial:write` | `financial:delete`
- `churches:read` | `churches:write` 

## Respeito do Frontend
A navegação (Links, botões e tabs) no Vue é protegida por `v-if` atados à uma custom property global. 
Deseja-se renderizar um botão de Deletar apenas se:
```vue
<button v-if="can('members:delete')"> Deletar Membro </button>
```

## Níveis Hierárquicos por Congregação
Se o usuário A recebe e tem registrado em seu cadastro na tabela `users` a filiação obrigatória em `congregation_id` = 'Campus B', ele encontra-se filtrado a interagir somente com as métricas do "Campus B". Um tesoureiro de bairro mesmo possuindo as flag de `financial:write` não possuirá alcance ou poderio de consulta nem operação no painel geral e consolidado de toda Igreja nem na caixa mestre da sede. 
Aplica-se em API limitando e forçando a busca baseada no login deste usuário.

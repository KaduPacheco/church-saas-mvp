# 20 - Backoffice - Fluxos

## Objetivo
Registrar os fluxos funcionais principais do backoffice no estado atual do codigo.

## Fluxo 1 - Login do backoffice
1. usuario acessa `/backoffice/login`
2. frontend envia `email` e `password` para `POST /api/backoffice/auth/login`
3. backend valida credenciais em `platform_users`
4. backend emite `accessToken` e `refreshToken`
5. backend registra `platform.auth.login` em auditoria
6. frontend salva `backoffice_access_token` e `backoffice_refresh_token`
7. frontend redireciona para `/backoffice`

## Fluxo 2 - Acesso a rota protegida
1. usuario tenta abrir uma rota com `requiresPlatformAuth`
2. router verifica se existe token do backoffice
3. se nao existir, redireciona para `/backoffice/login`
4. se existir e `user` nao estiver carregado, a store chama `GET /api/backoffice/auth/me`
5. se a permissao exigida nao existir, o usuario volta para a home do backoffice

## Fluxo 3 - Listagem de tenants
1. usuario abre `/backoffice/tenants`
2. frontend chama `GET /api/backoffice/tenants`
3. filtros opcionais podem incluir busca e status
4. backend retorna lista paginada com totais agregados
5. frontend renderiza tabela com acesso ao detalhe

## Fluxo 4 - Visualizacao de tenant
1. usuario abre `/backoffice/tenants/:id`
2. frontend chama `GET /api/backoffice/tenants/:id`
3. backend retorna dados principais e contagens
4. frontend mostra resumo do tenant
5. se houver permissao, o frontend tambem carrega congregacoes e usuarios

## Fluxo 5 - Alteracao de status de tenant
1. usuario com `platform:tenants:write` escolhe novo status
2. frontend envia `PATCH /api/backoffice/tenants/:id/status`
3. backend valida o status
4. backend atualiza `churches.status`
5. backend registra `platform.tenant.status.updated`
6. frontend atualiza a tela com o novo status

## Fluxo 6 - Visualizacao de congregacoes
1. detalhe do tenant chama `GET /api/backoffice/tenants/:id/congregations`
2. backend retorna congregacoes vinculadas ao `church_id` da sede
3. frontend exibe nome, endereco, status e vinculo com a sede

## Fluxo 7 - Visualizacao de usuarios administrativos
1. detalhe do tenant chama `GET /api/backoffice/tenants/:id/users`
2. backend consulta `users`, `permission_profiles` e `congregations`
3. backend retorna perfil tecnico, permissoes e escopo
4. frontend exibe tabela administrativa de supervisao

## Fluxo 8 - Ativacao ou inativacao de usuario tenant
1. operador com `platform:users:write` aciona o botao de status
2. frontend envia `PATCH /api/backoffice/tenants/:id/users/:userId/status`
3. backend atualiza `users.is_active`
4. backend registra `platform.tenant.user.status.updated`
5. frontend atualiza apenas o usuario afetado na tabela

## Fluxo 9 - Consulta de auditoria
1. usuario abre `/backoffice/audit`
2. frontend chama `GET /api/backoffice/audit`
3. filtros opcionais podem restringir por acao, tipo de alvo e tenant
4. backend retorna lista paginada enriquecida com ator e tenant
5. frontend renderiza tabela de logs

## Observacoes de fronteira
- nenhum desses fluxos usa `tenantIsolation`
- nenhum fluxo do backoffice depende de cargo ministerial
- a sessao do tenant continua isolada da sessao da plataforma

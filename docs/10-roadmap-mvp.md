# 10 - Roadmap MVP

O cronograma reflete tanto as escolhas técnicas tomadas em conjunto baseadas em praticidade e alcance, como a organização do desenvolvimento em etapas coesas sequenciais.

## Fases Concluídas (Planejamento e Implantação)
- ✅ Definição arquitetural robusta em Node Express / Postgres / Vue.js.
- ✅ Etapa 1 — Setup Básico, Linter e Ambientes, e Criações da Engenharia do BD e Migrations (`knex schemas`). As Tabelas essenciais foram construídas em modelo de Single Database e isoladas corretamente.
- ✅ Etapa 2 — Desenho profundo de Autenticação/Tenancy, Modelagem e Mapeamento dos Cargos e Permissões de Backend (`Middlewares`, `Hash`, `Security`).

## Fases Atuais - Backend e Construção de Regras MVP (Rotas)
Estas fases atuam no backend expondo JSON puro ao Insomnia ou navegador de dev. O foco é deixar todos endpoints testados de ponta a ponta sem erros assíncronos.
- ⚙️ Cadastro de Login, Resgate de Senhas de Acesso, Tokens.
- ⚙️ Endpoint Members (CRUD Completo e Paginações e Relacionamento via Query Param).
- ⚙️ Endpoint Financeiro (Criar categoria, Enviar Lançamento transacional com verificação de _type_ atrelada ao usuário local, Cancelamento lógico e rota de calculo analítico para front-end).

## Próximas Fases Prioritárias - Frontend / Cliente
Fases a serem orquestradas na camada Vue a fim de expor a interface fluida ao usuário final após base solida dos Controles de Dados formarem consistência.
- Criar Autenticação (Guard Auth) baseada no JWT Storage e tela inicial Login bonificada Dark Mode premium da aplicação.
- Componentizar as tabelas, modais e barra lateral do software.
- Dashboard da Sede (Gráficos unificadores calculando a partir do endpoint `/financial/summary`).
- Menus e Formulários da página de `roles` baseados de forma permissional, focando em UX não permissivo aos olhos de usuários comuns barrados.

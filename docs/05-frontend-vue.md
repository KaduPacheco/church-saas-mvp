# 05 - Frontend Vue.js

O front-end utiliza uma estrutura moderna, rápida e escalável, utilizando **Vue.js 3** (Composition API) junto com Vite como bundler.

## Estrutura de Pastas do Frontend

```text
/frontend
├── src/
│   ├── assets/           # Ícones, CSS base (Tailwind ou Global custom css), imagens
│   ├── components/       # Componentes globais (Inputs, Tabelas, Cards)
│   ├── composables/      # Lógica extraída de UI (useAuth, useFetch)
│   ├── layouts/          # Estruturas estáticas ao redor da View
│   │   ├── MainLayout    # Sidebar lateral e Header top
│   │   └── AuthLayout    # Tela crua centralizada (ex: Login)
│   ├── pages/            # Telas reais consumidas por Rotas
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── roles/
│   │   └── financial/
│   ├── router/           # Vue Router com lógicas BeforeEach
│   ├── stores/           # Pinia (Autenticação, Dados Temporários)
│   ├── services/         # Handlers do Axios injetando Bearer Token e refresh token intercepters
│   └── App.vue
├── index.html
├── package.json
└── vite.config.js
```

## Padronizações Arquiteturais de UI/UX
- **Acessibilidade**: O sistema se molda para ter suporte facilitado em menus laterais, modals e toast layers limpos.
- **Requisições de API**: Interceptors nativos centralizam as lógicas de 401 Unathorized ou falhas gerais 500 para exibições coerentes ao usuário. Nenhuma requisição se preocupa manualmente com `headers: { Authorization: ...}` em escopo local nas telas.
- **Roteamento e Permissões Frontend**: Componentes Vue e links do Menu podem ser ocultados via funções utilitárias ou restrições injetadas pelo Pinia dependendo em quais as _permissions array_ o usuário possui alocado para si (`v-if="can('financial:write')"`).

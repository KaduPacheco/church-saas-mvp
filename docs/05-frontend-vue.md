# 05 - Frontend Vue.js

O front-end utiliza uma estrutura moderna, rÃ¡pida e escalÃ¡vel, utilizando **Vue.js 3** (Composition API) junto com Vite como bundler.

## Estrutura de Pastas do Frontend

```text
/frontend
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ assets/           # Ãcones, CSS base (Tailwind ou Global custom css), imagens
â”‚   â”œâ”€â”€ components/       # Componentes globais (Inputs, Tabelas, Cards)
â”‚   â”œâ”€â”€ composables/      # LÃ³gica extraÃ­da de UI (useAuth, useFetch)
â”‚   â”œâ”€â”€ layouts/          # Estruturas estÃ¡ticas ao redor da View
â”‚   â”‚   â”œâ”€â”€ MainLayout    # Sidebar lateral e Header top
â”‚   â”‚   â””â”€â”€ AuthLayout    # Tela crua centralizada (ex: Login)
â”‚   â”œâ”€â”€ pages/            # Telas reais consumidas por Rotas
â”‚   â”‚   â”œâ”€â”€ auth/
â”‚   â”‚   â”œâ”€â”€ dashboard/
â”‚   â”‚   â”œâ”€â”€ members/
â”‚   â”‚   â”œâ”€â”€ roles/
â”‚   â”‚   â””â”€â”€ financial/
â”‚   â”œâ”€â”€ router/           # Vue Router com lÃ³gicas BeforeEach
â”‚   â”œâ”€â”€ stores/           # Pinia (AutenticaÃ§Ã£o, Dados TemporÃ¡rios)
â”‚   â”œâ”€â”€ services/         # Handlers do Axios injetando Bearer Token e refresh token intercepters
â”‚   â””â”€â”€ App.vue
â”œâ”€â”€ index.html
â”œâ”€â”€ package.json
â””â”€â”€ vite.config.js
```

## PadronizaÃ§Ãµes Arquiteturais de UI/UX
- **Acessibilidade**: O sistema se molda para ter suporte facilitado em menus laterais, modals e toast layers limpos.
- **RequisiÃ§Ãµes de API**: Interceptors nativos centralizam as lÃ³gicas de 401 Unathorized ou falhas gerais 500 para exibiÃ§Ãµes coerentes ao usuÃ¡rio. Nenhuma requisiÃ§Ã£o se preocupa manualmente com `headers: { Authorization: ...}` em escopo local nas telas.
- **Roteamento e PermissÃµes Frontend**: Componentes Vue e links do Menu podem ser ocultados via funÃ§Ãµes utilitÃ¡rias ou restriÃ§Ãµes injetadas pelo Pinia dependendo em quais as _permissions array_ o usuÃ¡rio possui alocado para si (`v-if="can('financial:write')"`).

## Variaveis de ambiente
Arquivo de exemplo:
- `frontend/.env.example`

Variaveis usadas hoje:
- `VITE_API_BASE_URL`
- `VITE_BACKOFFICE_API_BASE_URL`

Comportamento atual:
- em desenvolvimento local, o tenant faz fallback para `http://<hostname-atual>:4000/api`
- em desenvolvimento local, o backoffice faz fallback para `http://<hostname-atual>:4000/api/backoffice`
- fora de `dev`, o frontend deixa de depender de `localhost` e usa a variavel configurada ou caminho relativo no host atual

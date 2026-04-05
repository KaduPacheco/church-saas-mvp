# 01 - Arquitetura

## Visão Geral
MVP de um SaaS multi-tenant para gestão de igrejas, com backend Node.js (Express), frontend Vue.js (Vite) e PostgreSQL. O sistema suporta hierarquia **Igreja Sede → Congregações/Filiais** e controle de acesso baseado em cargos.

## Decisões de Arquitetura

### 1. Multi-Tenancy: Shared Database, Shared Schema
- Cada registro possui `church_id` (FK para a igreja sede / tenant principal).
- **Justificativa**: Para um MVP, é a abordagem mais simples e econômica. Um único banco atende todos os tenants. A migração para schema-per-tenant ou database-per-tenant pode ser feita no futuro sem grandes refatorações, pois o `church_id` já isola os dados.

### 2. Hierarquia Sede → Congregações
- A tabela `churches` usa auto-referência (`parent_id`): se `parent_id IS NULL`, é uma **sede**; caso contrário, é uma **congregação/filial**.
- O tenant é sempre a sede. Congregações herdam o `church_id` da sede.

### 3. Separação Backend / Frontend
- **Backend**: API RESTful completa operando separadamente e agnóstica de cliente (suporta uso via web, potencial app mobile futuramente).
- **Frontend**: Single Page Application (SPA), garantindo reatividade de uso e velocidade. Autenticação tratada com tokens HTTP stateless sem gerenciamento de sessão baseada em servidor web tradicional.

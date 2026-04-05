# 02 - Modelagem de Dados

Este documento lista as principais entidades, campos principais, relacionamentos e regras de negócio da base de dados PostgreSQL.

## Entidades Principais e Relacionamentos

```mermaid
erDiagram
    CHURCHES {
        uuid id PK
        uuid parent_id FK "NULL = sede"
        string name
        string cnpj
        string address
        string phone
        string email
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ROLES {
        uuid id PK
        uuid church_id FK
        string name "Pastor, Obreiro, etc."
        string description
        jsonb permissions "Array de permissões"
        boolean is_system "Cargo padrão do sistema"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    USERS {
        uuid id PK
        uuid church_id FK "Tenant (sede)"
        uuid congregation_id FK "Congregação, nullable"
        uuid role_id FK
        string name
        string email
        string password_hash
        string phone
        boolean is_active
        timestamp last_login
        timestamp created_at
        timestamp updated_at
    }

    MEMBERS {
        uuid id PK
        uuid church_id FK "Tenant"
        uuid congregation_id FK "nullable"
        uuid role_id FK
        string name
        string email
        string phone
        date birth_date
        string address
        date baptism_date
        date membership_date
        string status "ativo, inativo, transferido"
        text notes
        timestamp created_at
        timestamp updated_at
    }

    FINANCIAL_CATEGORIES {
        uuid id PK
        uuid church_id FK
        string name "Dízimo, Oferta, Aluguel, etc."
        string type "income, expense"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    FINANCIAL_TRANSACTIONS {
        uuid id PK
        uuid church_id FK
        uuid congregation_id FK "nullable"
        uuid category_id FK
        uuid member_id FK "nullable, quem contribuiu"
        uuid created_by FK "user que registrou"
        string type "income, expense"
        decimal amount
        date transaction_date
        string description
        string payment_method "dinheiro, pix, cartão, transferência"
        string reference_number "comprovante"
        string status "confirmed, pending, cancelled"
        timestamp created_at
        timestamp updated_at
    }

    CHURCHES ||--o{ CHURCHES : "parent"
    CHURCHES ||--o{ USERS : "belongs to"
    CHURCHES ||--o{ MEMBERS : "belongs to"
    CHURCHES ||--o{ ROLES : "has"
    CHURCHES ||--o{ FINANCIAL_CATEGORIES : "has"
    CHURCHES ||--o{ FINANCIAL_TRANSACTIONS : "has"
    ROLES ||--o{ USERS : "has role"
    ROLES ||--o{ MEMBERS : "has role"
    FINANCIAL_CATEGORIES ||--o{ FINANCIAL_TRANSACTIONS : "categorized by"
    MEMBERS ||--o{ FINANCIAL_TRANSACTIONS : "contributed by"
    USERS ||--o{ FINANCIAL_TRANSACTIONS : "created by"
```

## Regras de Negócio e Tenancy
1. `church_id` é o **tenant**. Toda consulta filtra automaticamente por este campo para isolamento.
2. Permissões não são colunas estáticas nas tabelas de users. Elas são amarradas pela tabela `ROLES` via campo `permissions` (ex: `['members:read', 'financial:write']`).

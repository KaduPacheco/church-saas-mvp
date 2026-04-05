# 09 - Módulo Financeiro do MVP

Este documento sumariza as definições do funcionamento e regras transacionais financeiras.

## 1. Escopo de Caixa Contábil Digital
Uma dinâmica direta baseada em registro de transação, evitando no MVP integrações automatizadas complexas. Trata-se de um livro-razão confiável mantido por operadores logados. Entradas e saídas de um montante formam os cálculos e relatórios dinâmicos.
- Realiza Lançamentos de despesa / saídas (Aluguel, Limpeza, Contas) ou receitas (Dízimos, Ofertas gerais, Campanhas ou Doações avulsas).
- Contém a consolidação seccionada por Filial ou do montante global (Apenas disponíveis as visões Macro para autorizados da Sede/Matriz).
- Responde com Dashboard de Resumos analíticos de performance financeira.

## 2. Tipos de Lançamento e Categorizações
O coração do filtro restringe a inclusão solta de rubricas. O registro obriga e se atrela sempre a uma "Categoria" de contas já formatada.
**Regras Invioláveis:**
- Toda transação depende do cadastro prévio da Categoria de despesa.
- Categorias têm tipo `type` fixo no banco (`income` entrada ou `expense` saída). Isto bloqueia equívocos de designação.
- Valores no banco de dados na coluna de `amount` guardam preenchimento puramente positivo/absoluto. A dedução e sinal de `-` é calculada sob demanda por `type`.

## 3. Segurança Auditável
- **Cancelamentos Lógicos (Soft) e não Físicos**: Sem DELETE via SQL. Se o operador do caixa efetuou por acidente um duplo clique ou incluiu verba irreal, invoca-se o botão "Cancelar transação". Ele atualiza internamente a coluna `status` de `confirmed` para `cancelled`. As queries e dashboards nativos só calculam ativamente a soma de quantias em "Confirmadas". Isso mantém log visual imutável para eventual auditoria (Transparência). Categoria deletada também não exclui seu passado lançado, bloqueando exclusão em modo restrito por FK Postgres da tabela de finanças à tabela base de categorias.
- **Rápida Associação**: Registros salvam no instante exato nas tuplas de `created_by` o ID real de qual login no servidor enviou a inserção confirmada, rastreabilidade inquebrável.

## 4. Endpoints Node e Exposição
- `/api/financial/categories`: CRUD base para configurar as listagens antes das rotinas contábeis passarem; ex do Payload é Nome, Tipo e Restrição `church_id`.
- `/api/financial/transactions`: Onde a massiva rotina da tesouraria flui e relata em paginação extensa e se armazena.
- `/api/financial/summary`: Ferramenta complexa de aglutinação de totais. Separa comparativos e subtotais por `category`, gerando os famosos _Charts Donuts_ ou gráficos comparativos (barra de meses ou somas percentuais) enviadas prontas da API consumíveis sob demanda via Request de Axios.

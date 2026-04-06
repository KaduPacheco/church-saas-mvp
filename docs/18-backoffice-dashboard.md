# 18 - Backoffice - Dashboard

## Objetivo
Documentar o dashboard global basico do backoffice e a origem real dos dados exibidos.

## Endpoint implementado
- `GET /api/backoffice/dashboard/summary`

Permissao exigida:
- `platform:dashboard:read`

## Indicadores disponiveis
- total de igrejas clientes
- total de congregacoes
- total de usuarios
- total de membros
- total de tenants por status:
  - `active`
  - `inactive`
  - `suspended`

## Origem dos dados
As consultas atuais sao feitas diretamente em:

- `churches`
- `congregations`
- `users`
- `members`

O backend tambem agrega `churches.status` para montar o resumo por status.

## Implementacao atual
O service do dashboard usa `Promise.all` para buscar:
- contagem total de `churches`
- contagem total de `congregations`
- contagem total de `users`
- contagem total de `members`
- agrupamento de `churches` por `status`

## Comportamento do frontend
A tela inicial protegida do backoffice:
- chama o endpoint ao montar a pagina
- mostra estado de loading
- mostra erro simples quando a carga falha
- exibe cards com totais e status

## Exemplo de resposta
```json
{
  "success": true,
  "data": {
    "totals": {
      "churches": 12,
      "congregations": 44,
      "users": 58,
      "members": 1020
    },
    "tenantsByStatus": {
      "active": 10,
      "inactive": 1,
      "suspended": 1
    }
  }
}
```

## Consideracoes de seguranca
- o dashboard usa leitura agregada, sem expor dados pessoais detalhados
- a rota exige autenticacao de plataforma e permissao especifica
- a camada tenant nao e usada para autorizar esse acesso

## Consideracoes de performance
- a implementacao atual e adequada para MVP
- nao ha cache nem materializacao
- em bases maiores, pode ser necessario revisar estrategia de agregacao

## Limitacoes atuais
- nao ha filtros por periodo
- nao ha metricas financeiras globais no dashboard atual
- nao ha series temporais nem comparativos

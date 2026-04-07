# 25 - Fluxo de Onboarding do Tenant

## Objetivo
Registrar o fluxo arquitetural adotado para o nascimento correto de uma nova igreja cliente no projeto.

Este documento descreve:
- a ordem correta da operacao
- o que ja esta implementado no codigo
- os limites do backoffice depois do onboarding

## Decisao arquitetural
O onboarding correto do tenant segue esta ordem:

1. a plataforma cria a igreja cliente
2. na mesma operacao cria o admin inicial do tenant
3. depois disso a propria igreja administra seus demais usuarios internos

Esse fluxo evita um anti-pattern importante do dominio:
- criar primeiro um usuario solto e so depois decidir a qual igreja ele pertence

No modelo atual, isso seria incoerente porque `users` depende de `church_id` e o acesso tecnico do tenant precisa nascer no contexto multi-tenant correto.

## Por que a igreja nasce primeiro
No projeto atual:
- `churches` representa o tenant
- `congregations` representa unidades adicionais vinculadas a esse tenant
- `users` depende de `church_id`
- `permission_profiles` depende de `church_id`

Logo, antes de criar qualquer usuario tecnico da igreja, o tenant precisa existir.

A igreja sede nasce em `churches` e funciona como raiz do tenant. O admin inicial nasce com:
- `church_id` obrigatorio
- `congregation_id = null`
- `member_id = null`
- `permission_profile_id` do perfil tecnico `Administrador Geral`

## O que o backoffice cria
No fluxo implementado em `POST /api/backoffice/tenants`, o backoffice cria:

1. a igreja cliente em `churches`
2. a base inicial do tenant:
   - cargos ministeriais padrao em `roles`
   - perfis tecnicos padrao em `permission_profiles`
   - categorias financeiras padrao
3. o admin inicial do tenant em `users`

Tudo isso acontece na mesma transacao.

## O que o backoffice nao faz
O backoffice nao deve ser tratado como modulo rotineiro de usuarios internos da igreja.

Depois do onboarding:
- a igreja cria seus demais usuarios internos no proprio painel do tenant
- o backoffice apenas supervisiona quando necessario

O backoffice tambem nao deve:
- transformar membro em usuario automaticamente
- usar cargo ministerial como permissao tecnica
- misturar `platform_users` com `users`

## Estado atual no codigo

### Implementado
- servico reutilizavel de onboarding de tenant
- endpoint `POST /api/backoffice/tenants`
- criacao transacional de igreja sede + admin inicial
- auditoria do evento `platform.tenant.onboarded`
- interface do backoffice ajustada para `Onboarding do tenant`

### Parcialmente implementado
- `POST /api/auth/register` continua existindo por compatibilidade e reaproveita a mesma logica de onboarding

### Proposto
- fluxo completo de gestao de usuarios internos no painel da igreja
- reset de acesso com trilha de auditoria

## Quem cria o que

| Responsavel | O que cria | Onde |
| --- | --- | --- |
| Plataforma / Backoffice | Igreja cliente + admin inicial | `churches` + `users` |
| Igreja cliente | Demais usuarios internos | `users` |
| Igreja cliente | Membros | `members` |
| Igreja cliente | Cargos ministeriais | `roles` |

## Regras de negocio consolidadas
- usuario de plataforma e diferente de usuario da igreja
- usuario do tenant nao nasce sem `church_id`
- cargo ministerial nao define permissao tecnica
- membro nao vira usuario automaticamente
- o admin inicial do tenant nasce vinculado a igreja correta

## UX esperada no backoffice
A interface do backoffice deve comunicar explicitamente:
- primeiro nasce a igreja cliente
- junto nasce o admin inicial
- depois a igreja administra sua equipe
- membros e cargos ministeriais nao sao contas de acesso automaticas

## Relacao com outros documentos
Este documento complementa:
- `16-backoffice-gestao-de-tenants.md`
- `17-backoffice-usuarios-administrativos.md`
- `23-fluxo-de-criacao-de-usuarios.md`
- `24-backoffice-usuarios.md`

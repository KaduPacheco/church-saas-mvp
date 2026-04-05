# 06 - Autenticação e Segurança

A autenticação é a barreira inicial crítica, especialmente em um sistema Multi-Tenant onde diferentes igrejas operam na mesma infraestrutura isolada logicamente.

## Fluxo de Autenticação na API

O sistema utiliza arquitetura RESTful sem preservação de sessões server-side (stateless), operando com tokens.

1. **Tokens (JWT)**: Todo acesso validado opera neste formato de assinatura via Json Web Token.
2. **Ciclo Padrão (Módulo Auth)**:
   - `POST /api/auth/login`: Troca credenciais (E-mail/Senha) e retorna dois tokens principais (AccessToken, RefreshToken). O acesso determina a vida curta de operação, enquanto o refresh permite longa duração silenciada.
   - `POST /api/auth/refresh`: Atualiza e converte transparentemente o AccessToken utilizando a confirmação de um RefreshToken no banco.
   - `POST /api/auth/logout`: Elimina do banco/memória o RefreshToken (encerra os acessos garantidos de permanência).

## Camadas e Proteções no Backend (Middlewares)

Nenhuma rota é pública por padrão, salvo os endpoints explícitos de `/register` e `/login` na ponta inicial da API.

- Middleware `authenticate`: Exige a Header de autorização (`Bearer token`) e confere se a assinatura criptográfica concorda com o Secret do ambiente.
- **Tenant Isolation**: O middleware intercepta a decodificação do Payload, detecta a qual congregação aquele usuário atende e embuti a constante `req.churchId`. Não deve-se depender de Inputs do Cliente (tipo query strings de ID ou JSON bodies) pra checar de qual igreja ele faz operações. Todo comando SQL restringe `WHERE church_id = req.churchId`.
- **Hashes**: Proteção utilizando salting sobre o texto-plano de senhas, executada pelo pacote utilitário e escalável `bcryptjs`. 

## Proteções do Lado Cliente (Frontend Vue)
- Armazenamento em Estado Persistente da sessão, lidando com transições assíncronas do JWT via **Axios Interceptors**. Caso estoure tempo limite e volte 401 Unauthorized, será acionado debaixo dos panos uma tentativa no `/refresh` e re-envio do pacote ao servidor antes de redirecionar frustrantemente ao formulário de re-login de tela.
- Vue Router se encarrega nativamente nas Global Guards (beforeEach) de não permitir que áreas da Single-Page-App sejam exibidas (componentes renderizados) enquanto o token de posse no LocalStorage não se conferir válido preliminarmente.

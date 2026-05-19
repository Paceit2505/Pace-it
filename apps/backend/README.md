# Pace It B2B — Backend

API REST com Fastify + Prisma + PostgreSQL.

## Setup

```bash
cp .env.example .env
# Preencha DATABASE_URL e JWT_SECRET no .env

npm install
npm run db:push      # aplica schema no banco
npm run db:seed      # popula dados iniciais
npm run dev          # inicia em modo desenvolvimento
```

## Variáveis obrigatórias

| Variável | Descrição |
|---|---|
| DATABASE_URL | Connection string PostgreSQL |
| JWT_SECRET | Chave secreta para access tokens |
| JWT_REFRESH_SECRET | Chave para refresh tokens |
| REDIS_URL | URL do Redis (sessões/cache) |

## Usuários de teste (após seed)

| Role | Email | Senha |
|---|---|---|
| admin | admin@paceit.com.br | admin123 |
| lojista | loja@teste.com.br | loja123 |

## Rotas principais

- `POST /auth/login` — autenticação
- `POST /auth/register` — cadastro de nova loja (status PENDING)
- `GET /products` — catálogo com preços da tabela do lojista
- `POST /orders` — criar pedido
- `GET /orders` — histórico de pedidos

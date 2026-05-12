# Dashboard B2B

Dashboard web para visualização de movimentação B2B integrado com a API do Bling v3.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Recharts · Vercel

---

## Deploy no Vercel (via GitHub)

### 1. Faça push deste repositório para o GitHub

### 2. Importe no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Selecione o repositório
3. Em **Root Directory**, coloque: `b2b-dashboard`
4. Framework: **Next.js** (detectado automaticamente)
5. Clique em **Deploy**

### 3. Configure as variáveis de ambiente no Vercel

Em **Settings > Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `BLING_CLIENT_ID` | ID do seu aplicativo OAuth |
| `BLING_CLIENT_SECRET` | Secret do seu aplicativo OAuth |
| `BLING_ACCESS_TOKEN` | Access token obtido via OAuth |
| `BLING_REFRESH_TOKEN` | Refresh token obtido via OAuth |

### 4. Obtenha os tokens Bling

1. No Bling: **Configurações > Integrações > API > Criar aplicativo OAuth**
2. Preencha `BLING_CLIENT_ID` e `BLING_CLIENT_SECRET`
3. Faça o fluxo OAuth para obter `access_token` e `refresh_token`

---

## Desenvolvimento local

```bash
cd b2b-dashboard
npm install
cp .env.example .env.local
# preencha .env.local com as credenciais
npm run dev
```

Acesse: http://localhost:3000

---

## Sobre tokens no Vercel

O access token do Bling expira periodicamente. Quando isso acontece:
- O dashboard renova automaticamente usando o refresh token
- Um aviso amarelo aparece no topo com os novos tokens
- Atualize as variáveis de ambiente no Vercel com os novos valores

---

## Funcionalidades

- **KPIs**: Total faturado, pedidos, ticket médio, recompras, novas lojas
- **Ranking de lojistas**: tabela com CNPJ, cidade/UF, vendedor e badge de tipo
- **Recompras vs Novas Lojas**: barras empilhadas semanais + rosca de proporção
- **Evolução por período**: linha com média, alternável por dia/semana
- **Mix de produtos**: top 10 por valor e por quantidade
- **Géis**: pivot diário de saída + cards de resumo + gráfico de barras

## Regras de negócio

- Apenas pedidos com CNPJ (14 dígitos) — lojistas B2B; CPF = B2C, ignorado
- Pedidos bonificados excluídos: `total_venda == frete`
- Primeira compra do CNPJ no período = **Nova loja**; demais = **Recompra**
- Géis filtrados por nome de produto contendo "gel" (case-insensitive)

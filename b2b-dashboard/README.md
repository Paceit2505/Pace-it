# Dashboard B2B

Dashboard web para visualização de movimentação B2B integrado com a API do Bling v3.

## Pré-requisitos

- Python 3.9+

## Instalação

```bash
pip install -r requirements.txt
```

## Configuração

1. Copie o arquivo de exemplo de variáveis de ambiente:

```bash
cp .env.example .env
```

2. No Bling: **Configurações > Integrações > API > Criar aplicativo OAuth**

3. Preencha `BLING_CLIENT_ID` e `BLING_CLIENT_SECRET` no `.env`

4. Faça o fluxo de autorização OAuth para obter `access_token` e `refresh_token`

5. Cole os tokens no `.env`:

```env
BLING_CLIENT_ID=seu_client_id
BLING_CLIENT_SECRET=seu_client_secret
BLING_ACCESS_TOKEN=seu_access_token
BLING_REFRESH_TOKEN=seu_refresh_token
```

## Rodando

```bash
streamlit run app.py
```

## Funcionalidades

- **KPIs**: Total faturado, pedidos, ticket médio, recompras, novas lojas
- **Ranking de lojistas**: tabela com CNPJ, cidade/UF, vendedor e tipo
- **Recompras vs Novas Lojas**: barras empilhadas por semana + gráfico de rosca
- **Evolução por período**: linha com média por dia ou semana
- **Mix de produtos**: top 10 por valor e por quantidade
- **Géis**: saída diária em tabela pivot + cards de resumo + gráfico de barras

## Regras de negócio

- Apenas pedidos com CNPJ (14 dígitos) — lojistas B2B
- Pedidos bonificados excluídos (total = frete)
- Primeira compra do CNPJ no período = "Nova loja"; demais = "Recompra"
- Géis filtrados por nome de produto contendo "gel" (sem distinção de maiúsculas)

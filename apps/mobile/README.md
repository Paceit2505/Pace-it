# Pace It B2B — Mobile

App de pedidos B2B para lojistas da Pace It. React Native + Expo.

## Setup

```bash
cp .env.example .env
# Preencha EXPO_PUBLIC_API_URL com a URL do backend

npm install
npm run start    # inicia o Expo
```

## Estrutura

```
app/
  (auth)/      login e cadastro
  (tabs)/      navegação principal
    index      home com último pedido e categorias
    catalog    catálogo com busca e filtros
    cart       carrinho e confirmação de pedido
    orders     histórico de pedidos
    account    dados da conta e logout
src/
  lib/api.ts           cliente HTTP com JWT automático
  store/auth.store.ts  estado de autenticação
  store/cart.store.ts  carrinho persistido
```

## Fontes

As fontes Barlow Condensed, DM Sans e JetBrains Mono são carregadas via expo-font.
Adicione a configuração no _layout.tsx raiz após instalar @expo-google-fonts/*.

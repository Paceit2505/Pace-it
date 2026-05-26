import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, PRODUCT_CATEGORIES } from '@pace-it/shared'

const CATEGORY_EMOJIS: Record<string, string> = {
  'Hidrogéis': '💧',
  'Eletrólitos': '⚡',
  'Proteínas': '💪',
  'Acessórios': '🎒',
  'Merch': '👕',
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#C8FF00',
  CONFIRMED: '#22C55E',
  INVOICED: '#3B82F6',
  SHIPPED: '#8B5CF6',
  DELIVERED: '#22C55E',
  CANCELLED: '#FF4D00',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviado',
  CONFIRMED: 'Confirmado',
  INVOICED: 'Faturado',
  SHIPPED: 'Em trânsito',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

export default function HomeScreen() {
  const { data: store } = useQuery({
    queryKey: ['store-me'],
    queryFn: async () => {
      const { data } = await api.get('/stores/me')
      return data.data
    },
  })

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders?limit=1')
      return data.data
    },
  })

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await api.get('/products/favorites')
      return data.data
    },
  })

  const lastOrder = ordersData?.[0] ?? null
  const statusColor = lastOrder ? (STATUS_COLORS[lastOrder.status] ?? '#888') : '#888'

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Header */}
      <View className="pt-14 mb-6">
        <Text className="font-dm-sans text-muted text-sm">Bem-vindo de volta,</Text>
        <Text className="font-barlow-bold text-4xl text-white leading-tight">
          {store?.nomeFantasia?.toUpperCase() ?? 'LOJISTA'}
        </Text>
        {store?.priceTable && (
          <View className="flex-row items-center mt-1">
            <View className="bg-accent/20 rounded-full px-3 py-0.5">
              <Text className="font-dm-sans text-accent text-xs">
                Tabela: {store.priceTable.name}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Último pedido */}
      {lastOrder ? (
        <TouchableOpacity
          className="bg-surface border border-border rounded-2xl p-4 mb-6"
          onPress={() => router.push(`/orders/${lastOrder.id}`)}
          activeOpacity={0.8}
        >
          <Text className="font-dm-sans text-muted text-xs mb-2">ÚLTIMO PEDIDO</Text>
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="font-jetbrains text-white text-lg">
                {formatCurrency(lastOrder.total)}
              </Text>
              <Text className="font-dm-sans text-muted text-sm mt-0.5">
                {formatDate(lastOrder.createdAt)}
              </Text>
            </View>
            <View className="items-end gap-2">
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: `${statusColor}20` }}
              >
                <Text className="font-dm-sans text-xs" style={{ color: statusColor }}>
                  {STATUS_LABELS[lastOrder.status]}
                </Text>
              </View>
              <TouchableOpacity
                className="bg-accent/20 rounded-lg px-3 py-1"
                onPress={() => router.push(`/orders/${lastOrder.id}`)}
              >
                <Text className="font-barlow-bold text-accent text-sm">VER →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className="bg-accent rounded-2xl p-5 mb-6"
          onPress={() => router.push('/(tabs)/catalog')}
        >
          <Text className="font-barlow-bold text-2xl text-background">FAZER PEDIDO</Text>
          <Text className="font-dm-sans text-background/70">
            Explore o catálogo completo da Pace It
          </Text>
        </TouchableOpacity>
      )}

      {/* Categorias */}
      <Text className="font-barlow-bold text-xl text-white mb-3">CATEGORIAS</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {PRODUCT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center gap-2"
            style={{ minWidth: '47%', flex: 1 }}
            onPress={() =>
              router.push({ pathname: '/(tabs)/catalog', params: { category: cat } })
            }
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>{CATEGORY_EMOJIS[cat] ?? '📦'}</Text>
            <Text className="font-barlow-bold text-white text-sm">{cat.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Favoritos */}
      {favorites && favorites.length > 0 && (
        <>
          <Text className="font-barlow-bold text-xl text-white mb-3">MEUS FAVORITOS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 8 }}
            className="mb-6"
          >
            {favorites.slice(0, 8).map((product: any) => (
              <TouchableOpacity
                key={product.id}
                className="bg-surface border border-border rounded-xl p-3 w-36"
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <View className="w-full h-20 bg-border rounded-lg mb-2 items-center justify-center overflow-hidden">
                  {product.images[0] ? (
                    <Image
                      source={{ uri: product.images[0] }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 28 }}>📦</Text>
                  )}
                </View>
                <Text className="font-dm-sans text-white text-xs" numberOfLines={2}>
                  {product.name}
                </Text>
                {product.price != null && (
                  <Text className="font-jetbrains text-accent text-xs mt-1">
                    {formatCurrency(product.price)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* CTA */}
      <TouchableOpacity
        className="bg-surface border border-accent/30 rounded-2xl p-5 flex-row justify-between items-center"
        onPress={() => router.push('/(tabs)/catalog')}
      >
        <View>
          <Text className="font-barlow-bold text-xl text-white">VER CATÁLOGO</Text>
          <Text className="font-dm-sans text-muted text-sm">Todos os produtos disponíveis</Text>
        </View>
        <Text className="text-accent text-2xl">→</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

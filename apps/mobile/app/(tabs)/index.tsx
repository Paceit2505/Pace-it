import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '@/lib/api'
import { formatCurrency, PRODUCT_CATEGORIES } from '@pace-it/shared'

export default function HomeScreen() {
  const { data: store } = useQuery({
    queryKey: ['store-me'],
    queryFn: async () => {
      const { data } = await api.get('/stores/me')
      return data.data
    },
  })

  const { data: lastOrder } = useQuery({
    queryKey: ['last-order'],
    queryFn: async () => {
      const { data } = await api.get('/orders?limit=1')
      return data.data?.[0] ?? null
    },
  })

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20 }}>
      {/* Header */}
      <View className="mb-6 pt-12">
        <Text className="font-dm-sans text-muted">Bem-vindo,</Text>
        <Text className="font-barlow-bold text-3xl text-white">
          {store?.nomeFantasia ?? 'Lojista'}
        </Text>
      </View>

      {/* Último pedido */}
      {lastOrder && (
        <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
          <Text className="font-dm-sans text-muted text-sm mb-1">Último pedido</Text>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="font-barlow-bold text-xl text-white">
                {formatCurrency(lastOrder.total)}
              </Text>
              <Text className="font-dm-sans text-muted text-sm">
                {lastOrder.status}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-accent rounded-xl px-4 py-2"
              onPress={() => router.push(`/orders/${lastOrder.id}`)}
            >
              <Text className="font-barlow-bold text-background">VER</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Categorias */}
      <Text className="font-barlow-bold text-xl text-white mb-4">CATEGORIAS</Text>
      <View className="flex-row flex-wrap gap-3 mb-6">
        {PRODUCT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            className="bg-surface border border-border rounded-xl px-4 py-3 flex-1 min-w-[140px]"
            onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { category: cat } })}
          >
            <Text className="font-barlow-bold text-white text-center">{cat.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Banner CTA */}
      <View className="bg-accent rounded-2xl p-5">
        <Text className="font-barlow-bold text-2xl text-background">NOVO PEDIDO</Text>
        <Text className="font-dm-sans text-background opacity-70 mb-3">
          Explore o catálogo completo
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
          <Text className="font-barlow-bold text-background underline">VER CATÁLOGO →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

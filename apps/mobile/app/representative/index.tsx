import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@pace-it/shared'

export default function RepresentativeDashboard() {
  const { data: stores, isLoading: loadingStores } = useQuery({
    queryKey: ['rep-stores'],
    queryFn: async () => {
      const { data } = await api.get('/rep/stores')
      return data.data
    },
  })

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['rep-orders'],
    queryFn: async () => {
      const { data } = await api.get('/rep/orders?limit=20')
      return data.data
    },
  })

  const gmv = orders?.reduce((sum: number, o: any) => sum + o.total, 0) ?? 0
  const activeStores = stores?.filter((s: any) => s.status === 'ACTIVE').length ?? 0

  return (
    <View className="flex-1 bg-background px-5">
      <Text className="font-barlow-bold text-3xl text-white pt-14 mb-6">REPRESENTANTE</Text>

      {/* Métricas */}
      <View className="flex-row gap-3 mb-6">
        <View className="bg-surface border border-border rounded-xl p-4 flex-1">
          <Text className="font-dm-sans text-muted text-xs mb-1">GMV do mês</Text>
          <Text className="font-jetbrains text-accent text-lg">{formatCurrency(gmv)}</Text>
        </View>
        <View className="bg-surface border border-border rounded-xl p-4 flex-1">
          <Text className="font-dm-sans text-muted text-xs mb-1">Lojas ativas</Text>
          <Text className="font-barlow-bold text-white text-2xl">{activeStores}</Text>
        </View>
      </View>

      {/* Pedidos recentes */}
      <Text className="font-barlow-bold text-xl text-white mb-3">PEDIDOS RECENTES</Text>

      {loadingOrders ? (
        <ActivityIndicator color="#C8FF00" />
      ) : (
        <FlatList
          data={orders ?? []}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              className="bg-surface border border-border rounded-xl p-4 mb-2 flex-row justify-between"
              onPress={() => router.push(`/orders/${item.id}`)}
            >
              <View>
                <Text className="font-dm-sans-medium text-white text-sm" numberOfLines={1}>
                  {item.store?.nomeFantasia}
                </Text>
                <Text className="font-dm-sans text-muted text-xs">{formatDate(item.createdAt)}</Text>
              </View>
              <Text className="font-jetbrains text-accent">{formatCurrency(item.total)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="font-dm-sans text-muted">Nenhum pedido recente</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

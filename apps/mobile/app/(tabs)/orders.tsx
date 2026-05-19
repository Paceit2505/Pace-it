import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, Order, OrderStatus } from '@pace-it/shared'

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: '#888888',
  [OrderStatus.SUBMITTED]: '#C8FF00',
  [OrderStatus.CONFIRMED]: '#22C55E',
  [OrderStatus.INVOICED]: '#3B82F6',
  [OrderStatus.SHIPPED]: '#8B5CF6',
  [OrderStatus.DELIVERED]: '#22C55E',
  [OrderStatus.CANCELLED]: '#FF4D00',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'Rascunho',
  [OrderStatus.SUBMITTED]: 'Enviado',
  [OrderStatus.CONFIRMED]: 'Confirmado',
  [OrderStatus.INVOICED]: 'Faturado',
  [OrderStatus.SHIPPED]: 'Enviado',
  [OrderStatus.DELIVERED]: 'Entregue',
  [OrderStatus.CANCELLED]: 'Cancelado',
}

function OrderCard({ order }: { order: Order }) {
  const color = STATUS_COLORS[order.status]

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-4 mb-3"
      onPress={() => router.push(`/orders/${order.id}`)}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="font-dm-sans text-muted text-xs">Pedido</Text>
          <Text className="font-jetbrains text-white text-sm">#{order.id.slice(-8).toUpperCase()}</Text>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${color}20` }}>
          <Text className="font-dm-sans text-xs" style={{ color }}>
            {STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-end">
        <Text className="font-dm-sans text-muted text-sm">{formatDate(order.createdAt)}</Text>
        <Text className="font-jetbrains text-accent">{formatCurrency(order.total)}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function OrdersScreen() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders')
      return data.data as Order[]
    },
  })

  return (
    <View className="flex-1 bg-background px-5">
      <Text className="font-barlow-bold text-3xl text-white pt-14 mb-6">PEDIDOS</Text>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#C8FF00" size="large" />
        </View>
      ) : (
        <FlatList
          data={orders ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-4xl mb-4">📋</Text>
              <Text className="font-barlow-bold text-xl text-white">Nenhum pedido</Text>
              <Text className="font-dm-sans text-muted">Faça seu primeiro pedido!</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

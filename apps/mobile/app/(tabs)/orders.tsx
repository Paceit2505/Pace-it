import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, Order, OrderStatus } from '@pace-it/shared'

type FilterTab = 'active' | 'delivered' | 'cancelled'

const FILTER_LABELS: Record<FilterTab, string> = {
  active: 'Em andamento',
  delivered: 'Concluídos',
  cancelled: 'Cancelados',
}

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.SUBMITTED,
  OrderStatus.CONFIRMED,
  OrderStatus.INVOICED,
  OrderStatus.SHIPPED,
]

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#888888',
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

function OrderCard({ order }: { order: Order }) {
  const color = STATUS_COLORS[order.status] ?? '#888'

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-4 mb-3"
      onPress={() => router.push(`/orders/${order.id}`)}
      activeOpacity={0.8}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="font-dm-sans text-muted text-xs mb-0.5">Pedido</Text>
          <Text className="font-jetbrains text-white">
            #{order.id.slice(-8).toUpperCase()}
          </Text>
        </View>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: `${color}20` }}
        >
          <Text className="font-dm-sans text-xs font-medium" style={{ color }}>
            {STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View>
          <Text className="font-dm-sans text-muted text-sm">
            {formatDate(order.createdAt)}
          </Text>
          <Text className="font-dm-sans text-muted text-xs mt-0.5">
            {order.items?.length ?? 0} {order.items?.length === 1 ? 'item' : 'itens'}
          </Text>
        </View>
        <Text className="font-jetbrains text-accent text-lg">
          {formatCurrency(order.total)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function EmptyOrders({ tab }: { tab: FilterTab }) {
  const messages: Record<FilterTab, { icon: string; title: string; subtitle: string }> = {
    active: {
      icon: '🏃',
      title: 'Nenhum pedido ativo',
      subtitle: 'Faça seu primeiro pedido no catálogo',
    },
    delivered: {
      icon: '📦',
      title: 'Nenhum pedido concluído',
      subtitle: 'Seus pedidos entregues aparecerão aqui',
    },
    cancelled: {
      icon: '✕',
      title: 'Nenhum pedido cancelado',
      subtitle: 'Ótimo! Nenhum cancelamento registrado',
    },
  }
  const msg = messages[tab]

  return (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <Text className="text-5xl mb-4">{msg.icon}</Text>
      <Text className="font-barlow-bold text-xl text-white text-center mb-2">
        {msg.title}
      </Text>
      <Text className="font-dm-sans text-muted text-center">{msg.subtitle}</Text>
    </View>
  )
}

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>('active')

  const { data: allOrders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders?limit=100')
      return data.data as Order[]
    },
  })

  const filteredOrders = (allOrders ?? []).filter((order) => {
    if (activeTab === 'active') return ACTIVE_STATUSES.includes(order.status as OrderStatus)
    if (activeTab === 'delivered') return order.status === OrderStatus.DELIVERED
    if (activeTab === 'cancelled') return order.status === OrderStatus.CANCELLED
    return true
  })

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-14 pb-4">
        <Text className="font-barlow-bold text-3xl text-white mb-4">PEDIDOS</Text>

        {/* Tabs de filtro */}
        <View className="flex-row bg-surface border border-border rounded-xl p-1">
          {(Object.keys(FILTER_LABELS) as FilterTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 rounded-lg py-2 items-center ${
                activeTab === tab ? 'bg-accent' : ''
              }`}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                className={`font-barlow-bold text-sm ${
                  activeTab === tab ? 'text-background' : 'text-muted'
                }`}
              >
                {FILTER_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#C8FF00" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 0, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#C8FF00"
            />
          }
          renderItem={({ item }) => <OrderCard order={item} />}
          ListEmptyComponent={<EmptyOrders tab={activeTab} />}
        />
      )}
    </View>
  )
}

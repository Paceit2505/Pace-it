import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@pace-it/shared'

type RepTab = 'orders' | 'stores'

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#C8FF00',
  CONFIRMED: '#22C55E',
  INVOICED: '#3B82F6',
  SHIPPED: '#8B5CF6',
  DELIVERED: '#22C55E',
  CANCELLED: '#FF4D00',
  ACTIVE: '#22C55E',
  PENDING: '#C8FF00',
  BLOCKED: '#FF4D00',
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Enviado',
  CONFIRMED: 'Confirmado',
  INVOICED: 'Faturado',
  SHIPPED: 'Em trânsito',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  ACTIVE: 'Ativa',
  PENDING: 'Pendente',
  BLOCKED: 'Bloqueada',
}

export default function RepresentativeDashboard() {
  const [activeTab, setActiveTab] = useState<RepTab>('orders')

  const {
    data: orders,
    isLoading: loadingOrders,
    refetch: refetchOrders,
    isRefetching: refetchingOrders,
  } = useQuery({
    queryKey: ['rep-orders'],
    queryFn: async () => {
      const { data } = await api.get('/rep/orders')
      return data.data as any[]
    },
  })

  const {
    data: stores,
    isLoading: loadingStores,
    refetch: refetchStores,
    isRefetching: refetchingStores,
  } = useQuery({
    queryKey: ['rep-stores'],
    queryFn: async () => {
      const { data } = await api.get('/rep/stores')
      return data.data as any[]
    },
  })

  // Métricas calculadas
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const monthOrders = (orders ?? []).filter(
    (o) => new Date(o.createdAt) >= thisMonth
  )
  const gmv = monthOrders.reduce((sum: number, o: any) => sum + o.total, 0)
  const avgTicket = monthOrders.length > 0 ? gmv / monthOrders.length : 0
  const activeStores = (stores ?? []).filter((s: any) => s.status === 'ACTIVE').length

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refetchingOrders || refetchingStores}
            onRefresh={() => { refetchOrders(); refetchStores() }}
            tintColor="#C8FF00"
          />
        }
      >
        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <Text className="font-dm-sans text-muted text-sm">Painel</Text>
          <Text className="font-barlow-bold text-4xl text-white">REPRESENTANTE</Text>
        </View>

        {/* Métricas */}
        <View className="px-5 pb-4">
          <View className="flex-row gap-3 mb-3">
            <View className="bg-surface border border-border rounded-xl p-4 flex-1">
              <Text className="font-dm-sans text-muted text-xs mb-1">GMV do mês</Text>
              <Text className="font-jetbrains text-accent" numberOfLines={1}>
                {formatCurrency(gmv)}
              </Text>
            </View>
            <View className="bg-surface border border-border rounded-xl p-4 flex-1">
              <Text className="font-dm-sans text-muted text-xs mb-1">Ticket médio</Text>
              <Text className="font-jetbrains text-white" numberOfLines={1}>
                {formatCurrency(avgTicket)}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="bg-surface border border-border rounded-xl p-4 flex-1">
              <Text className="font-dm-sans text-muted text-xs mb-1">Lojas ativas</Text>
              <Text className="font-barlow-bold text-white text-3xl">{activeStores}</Text>
            </View>
            <View className="bg-surface border border-border rounded-xl p-4 flex-1">
              <Text className="font-dm-sans text-muted text-xs mb-1">Pedidos mês</Text>
              <Text className="font-barlow-bold text-white text-3xl">{monthOrders.length}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="px-5 pb-4">
          <View className="flex-row bg-surface border border-border rounded-xl p-1">
            {(['orders', 'stores'] as RepTab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                className={`flex-1 rounded-lg py-2 items-center ${activeTab === tab ? 'bg-accent' : ''}`}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  className={`font-barlow-bold text-sm ${activeTab === tab ? 'text-background' : 'text-muted'}`}
                >
                  {tab === 'orders' ? 'PEDIDOS' : 'LOJAS'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Conteúdo das tabs */}
        <View className="px-5 pb-20">
          {activeTab === 'orders' ? (
            loadingOrders ? (
              <ActivityIndicator color="#C8FF00" className="py-10" />
            ) : (orders ?? []).length === 0 ? (
              <View className="items-center py-16">
                <Text className="text-4xl mb-3">📋</Text>
                <Text className="font-barlow-bold text-xl text-white">Nenhum pedido</Text>
                <Text className="font-dm-sans text-muted">Suas lojas ainda não fizeram pedidos</Text>
              </View>
            ) : (
              (orders ?? []).map((order: any) => {
                const color = STATUS_COLORS[order.status] ?? '#888'
                return (
                  <TouchableOpacity
                    key={order.id}
                    className="bg-surface border border-border rounded-2xl p-4 mb-3"
                    onPress={() => router.push(`/orders/${order.id}`)}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="font-dm-sans-medium text-white" numberOfLines={1}>
                          {order.store?.nomeFantasia ?? 'Loja'}
                        </Text>
                        <Text className="font-dm-sans text-muted text-xs">
                          {formatDate(order.createdAt)}
                        </Text>
                      </View>
                      <View
                        className="rounded-full px-3 py-0.5"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Text className="font-dm-sans text-xs" style={{ color }}>
                          {STATUS_LABELS[order.status]}
                        </Text>
                      </View>
                    </View>
                    <Text className="font-jetbrains text-accent">
                      {formatCurrency(order.total)}
                    </Text>
                  </TouchableOpacity>
                )
              })
            )
          ) : (
            loadingStores ? (
              <ActivityIndicator color="#C8FF00" className="py-10" />
            ) : (stores ?? []).length === 0 ? (
              <View className="items-center py-16">
                <Text className="text-4xl mb-3">🏪</Text>
                <Text className="font-barlow-bold text-xl text-white">Nenhuma loja</Text>
                <Text className="font-dm-sans text-muted">Você não tem lojas na carteira ainda</Text>
              </View>
            ) : (
              (stores ?? []).map((store: any) => {
                const color = STATUS_COLORS[store.status] ?? '#888'
                return (
                  <View
                    key={store.id}
                    className="bg-surface border border-border rounded-2xl p-4 mb-3"
                  >
                    <View className="flex-row justify-between items-start mb-1">
                      <View className="flex-1">
                        <Text className="font-barlow-bold text-white text-lg">
                          {store.nomeFantasia}
                        </Text>
                        <Text className="font-dm-sans text-muted text-xs">
                          {store.razaoSocial}
                        </Text>
                      </View>
                      <View
                        className="rounded-full px-3 py-0.5"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Text className="font-dm-sans text-xs" style={{ color }}>
                          {STATUS_LABELS[store.status]}
                        </Text>
                      </View>
                    </View>
                    <Text className="font-dm-sans text-muted text-sm mt-2">
                      {store.email}
                    </Text>
                    <TouchableOpacity
                      className="mt-3 border border-accent/40 rounded-xl py-2 items-center"
                      onPress={() =>
                        router.push({
                          pathname: '/representative/new-order',
                          params: { storeId: store.id, storeName: store.nomeFantasia },
                        })
                      }
                    >
                      <Text className="font-barlow-bold text-accent text-sm">
                        + FAZER PEDIDO
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              })
            )
          )}
        </View>
      </ScrollView>
    </View>
  )
}

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { api } from '@/lib/api'
import { useCartStore } from '@/store/cart.store'
import { formatCurrency, formatDate, Order, OrderStatus } from '@pace-it/shared'

const STATUS_STEPS: OrderStatus[] = [
  OrderStatus.SUBMITTED,
  OrderStatus.CONFIRMED,
  OrderStatus.INVOICED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
]

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviado',
  CONFIRMED: 'Confirmado',
  INVOICED: 'Faturado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = STATUS_STEPS.indexOf(status)

  return (
    <View className="flex-row items-center mb-6">
      {STATUS_STEPS.map((step, index) => {
        const isDone = index <= currentIndex
        const isLast = index === STATUS_STEPS.length - 1

        return (
          <View key={step} className="flex-row items-center flex-1">
            <View
              className={`w-3 h-3 rounded-full ${isDone ? 'bg-accent' : 'bg-border'}`}
            />
            {!isLast && (
              <View className={`flex-1 h-0.5 ${isDone ? 'bg-accent' : 'bg-border'}`} />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { addItem } = useCartStore()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`)
      return data.data as Order
    },
    enabled: !!id,
  })

  const reorderMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/orders/${id}/reorder`)
      return data.data
    },
    onSuccess: (data) => {
      data.items.forEach((item: any) => addItem(item))
      Toast.show({ type: 'success', text1: 'Itens adicionados ao carrinho!' })
      router.push('/(tabs)/cart')
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Não foi possível repetir o pedido',
        text2: error.response?.data?.message,
      })
    },
  })

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#C8FF00" size="large" />
      </View>
    )
  }

  if (!order) return null

  const isCancelled = order.status === OrderStatus.CANCELLED

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={() => router.back()} className="mb-6 pt-12">
        <Text className="text-accent font-dm-sans">← Pedidos</Text>
      </TouchableOpacity>

      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="font-dm-sans text-muted text-sm">Pedido</Text>
          <Text className="font-jetbrains text-white">#{id?.slice(-8).toUpperCase()}</Text>
        </View>
        <View className="bg-surface border border-border rounded-xl px-3 py-1">
          <Text className="font-dm-sans text-white text-sm">{STATUS_LABELS[order.status]}</Text>
        </View>
      </View>

      <Text className="font-dm-sans text-muted text-sm mb-4">
        {formatDate(order.createdAt)}
      </Text>

      {!isCancelled && <OrderTimeline status={order.status} />}

      {/* Itens */}
      <Text className="font-barlow-bold text-xl text-white mb-3">ITENS</Text>
      {order.items?.map((item) => (
        <View key={item.id} className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row justify-between">
          <View className="flex-1">
            <Text className="font-dm-sans-medium text-white">{item.product?.name}</Text>
            <Text className="font-dm-sans text-muted text-sm">{item.qty}x {formatCurrency(item.unitPrice)}</Text>
          </View>
          <Text className="font-jetbrains text-accent">{formatCurrency(item.qty * item.unitPrice)}</Text>
        </View>
      ))}

      {/* Resumo financeiro */}
      <View className="bg-surface border border-border rounded-2xl p-4 mt-4 mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="font-dm-sans text-muted">Subtotal</Text>
          <Text className="font-jetbrains text-white">{formatCurrency(order.subtotal)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="font-dm-sans text-muted">Frete</Text>
          <Text className="font-jetbrains text-white">
            {order.freight === 0 ? 'Grátis' : formatCurrency(order.freight)}
          </Text>
        </View>
        {order.discount > 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="font-dm-sans text-muted">Desconto</Text>
            <Text className="font-jetbrains text-success">−{formatCurrency(order.discount)}</Text>
          </View>
        )}
        <View className="h-px bg-border my-2" />
        <View className="flex-row justify-between">
          <Text className="font-barlow-bold text-xl text-white">TOTAL</Text>
          <Text className="font-jetbrains text-accent text-xl">{formatCurrency(order.total)}</Text>
        </View>
      </View>

      {/* NF-e */}
      {order.nfeKey && (
        <View className="bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="font-barlow-bold text-white mb-1">NOTA FISCAL</Text>
          <Text className="font-jetbrains text-muted text-xs">{order.nfeKey}</Text>
        </View>
      )}

      {/* Repetir pedido */}
      <TouchableOpacity
        className="border border-accent rounded-2xl py-4 items-center mt-2"
        onPress={() => reorderMutation.mutate()}
        disabled={reorderMutation.isPending}
      >
        {reorderMutation.isPending ? (
          <ActivityIndicator color="#C8FF00" />
        ) : (
          <Text className="font-barlow-bold text-xl text-accent">REPETIR PEDIDO</Text>
        )}
      </TouchableOpacity>

      <Toast />
    </ScrollView>
  )
}

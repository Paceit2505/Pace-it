import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert
} from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { api } from '@/lib/api'
import { useCartStore } from '@/store/cart.store'
import { formatCurrency, PaymentMethod } from '@pace-it/shared'

const FREIGHT_FREE_ABOVE = Number(process.env.EXPO_PUBLIC_FREIGHT_FREE_ABOVE ?? 500)
const FREIGHT_FIXED = Number(process.env.EXPO_PUBLIC_FREIGHT_FIXED ?? 25)

function PaymentCard({
  method, label, icon, selected, onSelect,
}: {
  method: PaymentMethod; label: string; icon: string; selected: boolean; onSelect: () => void
}) {
  return (
    <TouchableOpacity
      className={`flex-1 border rounded-xl p-3 mx-1 items-center ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-surface'
      }`}
      onPress={onSelect}
    >
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text className={`font-barlow-bold text-sm mt-1 ${selected ? 'text-accent' : 'text-white'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

export default function CartScreen() {
  const queryClient = useQueryClient()
  const {
    items, paymentMethod, notes,
    updateQty, removeItem, setPaymentMethod, setNotes, clearCart, subtotal,
  } = useCartStore()

  const sub = subtotal()
  const freight = sub >= FREIGHT_FREE_ABOVE ? 0 : FREIGHT_FIXED
  const total = sub + freight
  const freightProgress = Math.min(sub / FREIGHT_FREE_ABOVE, 1)
  const remaining = FREIGHT_FREE_ABOVE - sub

  // Valida que todas as qtds são múltiplos de minOrder
  const hasInvalidQty = items.some((i) => i.qty % i.minOrder !== 0)

  const orderMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ productId: i.productId, qty: i.qty, unitPrice: i.unitPrice })),
        paymentMethod,
        notes: notes || undefined,
      })
      return data.data
    },
    onSuccess: (order) => {
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      Toast.show({
        type: 'success',
        text1: 'Pedido na corrida! 🏃',
        text2: 'Seu pedido foi enviado com sucesso.',
      })
      router.replace(`/orders/${order.id}`)
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Erro ao confirmar pedido',
        text2: error.response?.data?.message ?? 'Tente novamente',
      })
    },
  })

  const handleConfirm = () => {
    if (hasInvalidQty) {
      Toast.show({
        type: 'error',
        text1: 'Quantidade inválida',
        text2: 'Verifique os múltiplos mínimos de cada produto',
      })
      return
    }
    orderMutation.mutate()
  }

  const handleRemove = (productId: string, name: string) => {
    Alert.alert('Remover item', `Remover "${name}" do pedido?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeItem(productId) },
    ])
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-6xl mb-4">🛒</Text>
        <Text className="font-barlow-bold text-2xl text-white text-center mb-2">
          CARRINHO VAZIO
        </Text>
        <Text className="font-dm-sans text-muted text-center mb-8">
          Adicione produtos do catálogo para fazer seu pedido
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-xl px-8 py-4"
          onPress={() => router.push('/(tabs)/catalog')}
        >
          <Text className="font-barlow-bold text-xl text-background">VER CATÁLOGO</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20 }}>
      <Text className="font-barlow-bold text-3xl text-white mb-6 pt-12">
        MEU PEDIDO ({items.length})
      </Text>

      {/* Itens */}
      {items.map((item) => {
        const invalidQty = item.qty % item.minOrder !== 0
        return (
          <View
            key={item.productId}
            className={`bg-surface border rounded-2xl p-4 mb-3 ${invalidQty ? 'border-alert' : 'border-border'}`}
          >
            <View className="flex-row justify-between mb-3">
              <View className="flex-1 mr-2">
                <Text className="font-dm-sans-medium text-white" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text className="font-jetbrains text-muted text-xs mt-0.5">{item.sku}</Text>
                {invalidQty && (
                  <Text className="font-dm-sans text-alert text-xs mt-1">
                    Mínimo: {item.minOrder} {item.unit} (múltiplos)
                  </Text>
                )}
              </View>
              <TouchableOpacity
                className="w-8 h-8 items-center justify-center"
                onPress={() => handleRemove(item.productId, item.name)}
              >
                <Text className="text-alert text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  className="bg-border rounded-lg w-9 h-9 items-center justify-center"
                  onPress={() => updateQty(item.productId, item.qty - item.minOrder)}
                >
                  <Text className="text-white font-barlow-bold text-lg">−</Text>
                </TouchableOpacity>
                <Text className="font-jetbrains text-white w-14 text-center">{item.qty}</Text>
                <TouchableOpacity
                  className="bg-border rounded-lg w-9 h-9 items-center justify-center"
                  onPress={() => updateQty(item.productId, item.qty + item.minOrder)}
                >
                  <Text className="text-white font-barlow-bold text-lg">+</Text>
                </TouchableOpacity>
                <Text className="font-dm-sans text-muted text-xs ml-1">{item.unit}</Text>
              </View>
              <Text className="font-jetbrains text-accent">
                {formatCurrency(item.unitPrice * item.qty)}
              </Text>
            </View>
          </View>
        )
      })}

      {/* Barra de progresso para frete grátis */}
      {freight > 0 && (
        <View className="bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="font-dm-sans text-muted text-sm mb-2">
            Falta {formatCurrency(remaining)} para <Text className="text-success">frete grátis</Text>
          </Text>
          <View className="bg-border rounded-full h-2">
            <View
              className="bg-success rounded-full h-2"
              style={{ width: `${freightProgress * 100}%` }}
            />
          </View>
        </View>
      )}

      {/* Resumo */}
      <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="font-dm-sans text-muted">Subtotal</Text>
          <Text className="font-jetbrains text-white">{formatCurrency(sub)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="font-dm-sans text-muted">Frete</Text>
          <Text className={`font-jetbrains ${freight === 0 ? 'text-success' : 'text-white'}`}>
            {freight === 0 ? 'Grátis 🎉' : formatCurrency(freight)}
          </Text>
        </View>
        <View className="h-px bg-border my-2" />
        <View className="flex-row justify-between">
          <Text className="font-barlow-bold text-xl text-white">TOTAL</Text>
          <Text className="font-jetbrains text-accent text-xl">{formatCurrency(total)}</Text>
        </View>
      </View>

      {/* Pagamento */}
      <Text className="font-barlow-bold text-xl text-white mb-3">FORMA DE PAGAMENTO</Text>
      <View className="flex-row mb-4">
        <PaymentCard
          method={PaymentMethod.BOLETO}
          label="BOLETO"
          icon="🏦"
          selected={paymentMethod === PaymentMethod.BOLETO}
          onSelect={() => setPaymentMethod(PaymentMethod.BOLETO)}
        />
        <PaymentCard
          method={PaymentMethod.PIX}
          label="PIX"
          icon="⚡"
          selected={paymentMethod === PaymentMethod.PIX}
          onSelect={() => setPaymentMethod(PaymentMethod.PIX)}
        />
        <PaymentCard
          method={PaymentMethod.CREDIT_CARD}
          label="CARTÃO"
          icon="💳"
          selected={paymentMethod === PaymentMethod.CREDIT_CARD}
          onSelect={() => setPaymentMethod(PaymentMethod.CREDIT_CARD)}
        />
      </View>

      {/* Observações */}
      <Text className="font-barlow-bold text-xl text-white mb-3">OBSERVAÇÕES</Text>
      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-3 text-white font-dm-sans mb-6"
        placeholder="Informações adicionais para o pedido..."
        placeholderTextColor="#888"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Confirmar */}
      <TouchableOpacity
        className={`rounded-2xl py-5 items-center mb-10 ${
          hasInvalidQty || orderMutation.isPending ? 'bg-border' : 'bg-accent'
        }`}
        onPress={handleConfirm}
        disabled={orderMutation.isPending || hasInvalidQty}
      >
        {orderMutation.isPending ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <View className="items-center">
            <Text className={`font-barlow-bold text-2xl ${hasInvalidQty ? 'text-muted' : 'text-background'}`}>
              CONFIRMAR PEDIDO
            </Text>
            {!hasInvalidQty && (
              <Text className="font-dm-sans text-background/70 text-sm">
                {formatCurrency(total)} · {items.length} {items.length === 1 ? 'item' : 'itens'}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      <Toast />
    </ScrollView>
  )
}

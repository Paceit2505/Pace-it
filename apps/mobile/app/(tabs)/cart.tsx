import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { useMutation } from '@tanstack/react-query'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { api } from '@/lib/api'
import { useCartStore } from '@/store/cart.store'
import { formatCurrency, PaymentMethod } from '@pace-it/shared'

const FREIGHT_FREE_ABOVE = Number(process.env.EXPO_PUBLIC_FREIGHT_FREE_ABOVE ?? 500)
const FREIGHT_FIXED = Number(process.env.EXPO_PUBLIC_FREIGHT_FIXED ?? 25)

function PaymentCard({ method, label, selected, onSelect }: {
  method: PaymentMethod; label: string; selected: boolean; onSelect: () => void
}) {
  return (
    <TouchableOpacity
      className={`flex-1 border rounded-xl p-4 mx-1 ${selected ? 'border-accent bg-accent/10' : 'border-border bg-surface'}`}
      onPress={onSelect}
    >
      <Text className={`font-barlow-bold text-center ${selected ? 'text-accent' : 'text-white'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

export default function CartScreen() {
  const { items, paymentMethod, notes, updateQty, removeItem, setPaymentMethod, setNotes, clearCart, subtotal } = useCartStore()
  const sub = subtotal()
  const freight = sub >= FREIGHT_FREE_ABOVE ? 0 : FREIGHT_FIXED
  const total = sub + freight

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
      Toast.show({ type: 'success', text1: 'Pedido na corrida! 🏃', text2: 'Seu pedido foi enviado com sucesso.' })
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

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-6xl mb-4">🛒</Text>
        <Text className="font-barlow-bold text-2xl text-white text-center mb-2">CARRINHO VAZIO</Text>
        <Text className="font-dm-sans text-muted text-center mb-8">
          Adicione produtos do catálogo para fazer seu pedido
        </Text>
        <TouchableOpacity className="bg-accent rounded-xl px-8 py-4" onPress={() => router.push('/(tabs)/catalog')}>
          <Text className="font-barlow-bold text-xl text-background">VER CATÁLOGO</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20 }}>
      <Text className="font-barlow-bold text-3xl text-white mb-6 pt-12">MEU PEDIDO</Text>

      {/* Itens */}
      {items.map((item) => (
        <View key={item.productId} className="bg-surface border border-border rounded-2xl p-4 mb-3">
          <View className="flex-row justify-between mb-2">
            <View className="flex-1">
              <Text className="font-dm-sans-medium text-white">{item.name}</Text>
              <Text className="font-dm-sans text-muted text-sm">{item.sku}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.productId)}>
              <Text className="text-alert text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="bg-border rounded-lg w-8 h-8 items-center justify-center"
                onPress={() => updateQty(item.productId, item.qty - item.minOrder)}
              >
                <Text className="text-white font-barlow-bold">−</Text>
              </TouchableOpacity>
              <Text className="font-jetbrains text-white w-12 text-center">{item.qty}</Text>
              <TouchableOpacity
                className="bg-border rounded-lg w-8 h-8 items-center justify-center"
                onPress={() => updateQty(item.productId, item.qty + item.minOrder)}
              >
                <Text className="text-white font-barlow-bold">+</Text>
              </TouchableOpacity>
            </View>
            <Text className="font-jetbrains text-accent">
              {formatCurrency(item.unitPrice * item.qty)}
            </Text>
          </View>
        </View>
      ))}

      {/* Resumo */}
      <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="font-dm-sans text-muted">Subtotal</Text>
          <Text className="font-jetbrains text-white">{formatCurrency(sub)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="font-dm-sans text-muted">Frete</Text>
          <Text className="font-jetbrains text-white">
            {freight === 0 ? 'Grátis' : formatCurrency(freight)}
          </Text>
        </View>
        <View className="h-px bg-border my-2" />
        <View className="flex-row justify-between">
          <Text className="font-barlow-bold text-xl text-white">TOTAL</Text>
          <Text className="font-jetbrains text-accent text-xl">{formatCurrency(total)}</Text>
        </View>
        {freight > 0 && (
          <Text className="font-dm-sans text-muted text-xs mt-2">
            Frete grátis acima de {formatCurrency(FREIGHT_FREE_ABOVE)}
          </Text>
        )}
      </View>

      {/* Forma de pagamento */}
      <Text className="font-barlow-bold text-xl text-white mb-3">PAGAMENTO</Text>
      <View className="flex-row mb-4">
        <PaymentCard method={PaymentMethod.BOLETO} label="BOLETO" selected={paymentMethod === PaymentMethod.BOLETO} onSelect={() => setPaymentMethod(PaymentMethod.BOLETO)} />
        <PaymentCard method={PaymentMethod.PIX} label="PIX" selected={paymentMethod === PaymentMethod.PIX} onSelect={() => setPaymentMethod(PaymentMethod.PIX)} />
        <PaymentCard method={PaymentMethod.CREDIT_CARD} label="CARTÃO" selected={paymentMethod === PaymentMethod.CREDIT_CARD} onSelect={() => setPaymentMethod(PaymentMethod.CREDIT_CARD)} />
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

      <TouchableOpacity
        className="bg-accent rounded-2xl py-5 items-center mb-8"
        onPress={() => orderMutation.mutate()}
        disabled={orderMutation.isPending}
      >
        {orderMutation.isPending ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <Text className="font-barlow-bold text-2xl text-background">CONFIRMAR PEDIDO</Text>
        )}
      </TouchableOpacity>

      <Toast />
    </ScrollView>
  )
}

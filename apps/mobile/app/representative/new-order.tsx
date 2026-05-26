import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, FlatList
} from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { api } from '@/lib/api'
import { formatCurrency, PaymentMethod } from '@pace-it/shared'

interface RepCartItem {
  productId: string
  sku: string
  name: string
  unitPrice: number
  qty: number
  minOrder: number
}

export default function RepNewOrderScreen() {
  const { storeId, storeName } = useLocalSearchParams<{
    storeId: string
    storeName: string
  }>()
  const queryClient = useQueryClient()
  const [cartItems, setCartItems] = useState<RepCartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BOLETO)
  const [search, setSearch] = useState('')

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: { search: search || undefined, limit: 30 },
      })
      return data.data as any[]
    },
  })

  const addToCart = (product: any) => {
    const existing = cartItems.find((i) => i.productId === product.id)
    if (existing) {
      setCartItems((prev) =>
        prev.map((i) =>
          i.productId === product.id
            ? { ...i, qty: i.qty + i.minOrder }
            : i
        )
      )
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          unitPrice: product.price ?? 0,
          qty: product.minOrder,
          minOrder: product.minOrder,
        },
      ])
    }
  }

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const subtotal = cartItems.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
  const freight = subtotal >= 500 ? 0 : 25
  const total = subtotal + freight

  const orderMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/rep/orders', {
        storeId,
        items: cartItems.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          unitPrice: i.unitPrice,
        })),
        paymentMethod,
      })
      return data.data
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['rep-orders'] })
      Toast.show({
        type: 'success',
        text1: 'Pedido criado! 🏃',
        text2: `Pedido para ${storeName} confirmado.`,
      })
      router.replace(`/orders/${order.id}`)
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Erro ao criar pedido',
        text2: error.response?.data?.message ?? 'Tente novamente',
      })
    },
  })

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity onPress={() => router.back()} className="pt-12 mb-4">
          <Text className="text-accent font-dm-sans">← Voltar</Text>
        </TouchableOpacity>

        <Text className="font-barlow-bold text-3xl text-white mb-1">NOVO PEDIDO</Text>
        <Text className="font-dm-sans text-muted mb-6">para {storeName}</Text>

        {/* Busca de produtos */}
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-white font-dm-sans mb-4"
          placeholder="Buscar produto..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />

        {/* Lista de produtos */}
        {isLoading ? (
          <ActivityIndicator color="#C8FF00" />
        ) : (
          <View className="mb-6">
            {(products ?? []).slice(0, 10).map((product: any) => {
              const inCart = cartItems.find((i) => i.productId === product.id)
              return (
                <TouchableOpacity
                  key={product.id}
                  className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row justify-between items-center"
                  onPress={() => addToCart(product)}
                  activeOpacity={0.8}
                >
                  <View className="flex-1">
                    <Text className="font-dm-sans-medium text-white text-sm" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="font-jetbrains text-muted text-xs">{product.sku}</Text>
                  </View>
                  <View className="items-end ml-3">
                    {product.price != null && (
                      <Text className="font-jetbrains text-accent text-sm">
                        {formatCurrency(product.price)}
                      </Text>
                    )}
                    {inCart ? (
                      <Text className="font-dm-sans text-success text-xs">
                        {inCart.qty} no pedido
                      </Text>
                    ) : (
                      <Text className="font-barlow-bold text-accent text-xs">+ ADICIONAR</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Carrinho */}
        {cartItems.length > 0 && (
          <>
            <Text className="font-barlow-bold text-xl text-white mb-3">ITENS DO PEDIDO</Text>
            {cartItems.map((item) => (
              <View
                key={item.productId}
                className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row justify-between items-center"
              >
                <View className="flex-1">
                  <Text className="font-dm-sans-medium text-white text-sm" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="font-dm-sans text-muted text-xs">
                    {item.qty}x {formatCurrency(item.unitPrice)}
                  </Text>
                </View>
                <View className="items-end ml-3">
                  <Text className="font-jetbrains text-accent">
                    {formatCurrency(item.unitPrice * item.qty)}
                  </Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
                    <Text className="text-alert text-xs mt-1">remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Resumo */}
            <View className="bg-surface border border-border rounded-2xl p-4 my-4">
              <View className="flex-row justify-between mb-1">
                <Text className="font-dm-sans text-muted">Subtotal</Text>
                <Text className="font-jetbrains text-white">{formatCurrency(subtotal)}</Text>
              </View>
              <View className="flex-row justify-between mb-1">
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
            </View>

            {/* Pagamento */}
            <Text className="font-barlow-bold text-xl text-white mb-3">PAGAMENTO</Text>
            <View className="flex-row mb-6">
              {[
                { method: PaymentMethod.BOLETO, label: 'BOLETO' },
                { method: PaymentMethod.PIX, label: 'PIX' },
                { method: PaymentMethod.CREDIT_CARD, label: 'CARTÃO' },
              ].map(({ method, label }) => (
                <TouchableOpacity
                  key={method}
                  className={`flex-1 border rounded-xl py-3 mx-1 items-center ${
                    paymentMethod === method ? 'border-accent bg-accent/10' : 'border-border bg-surface'
                  }`}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    className={`font-barlow-bold text-sm ${
                      paymentMethod === method ? 'text-accent' : 'text-white'
                    }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="bg-accent rounded-2xl py-5 items-center mb-10"
              onPress={() => orderMutation.mutate()}
              disabled={orderMutation.isPending}
            >
              {orderMutation.isPending ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text className="font-barlow-bold text-2xl text-background">
                  CONFIRMAR PEDIDO
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      <Toast />
    </View>
  )
}

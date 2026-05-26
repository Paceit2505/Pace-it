import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Toast from 'react-native-toast-message'
import { api } from '@/lib/api'
import { useCartStore } from '@/store/cart.store'
import { formatCurrency, Product } from '@pace-it/shared'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { addItem } = useCartStore()
  const [qty, setQty] = useState(1)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`)
      return data.data as Product
    },
    enabled: !!id,
    onSuccess: (p) => setQty(p.minOrder),
  })

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#C8FF00" size="large" />
      </View>
    )
  }

  if (!product) return null

  const outOfStock = (product.stock?.qty ?? 0) === 0

  const decreaseQty = () => {
    if (qty - product.minOrder >= product.minOrder) {
      setQty(qty - product.minOrder)
    }
  }

  const increaseQty = () => setQty(qty + product.minOrder)

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      image: product.images[0],
      unitPrice: product.price ?? 0,
      qty,
      minOrder: product.minOrder,
      unit: product.unit,
    })
    Toast.show({ type: 'success', text1: 'Adicionado ao pedido!', text2: product.name })
    router.push('/(tabs)/cart')
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Imagem */}
      <View className="w-full h-64 bg-surface">
        {product.images[0] ? (
          <Image source={{ uri: product.images[0] }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text style={{ fontSize: 80 }}>📦</Text>
          </View>
        )}
      </View>

      <View className="p-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-accent font-dm-sans">← Voltar</Text>
        </TouchableOpacity>

        <Text className="font-dm-sans text-muted text-sm mb-1">{product.sku}</Text>
        <Text className="font-barlow-bold text-2xl text-white mb-2">{product.name}</Text>

        {product.description && (
          <Text className="font-dm-sans text-muted mb-4">{product.description}</Text>
        )}

        <View className="flex-row gap-4 mb-4">
          <View className="bg-surface border border-border rounded-xl p-3 flex-1">
            <Text className="font-dm-sans text-muted text-xs">Embalagem</Text>
            <Text className="font-dm-sans-medium text-white">{product.unitQty} {product.unit}</Text>
          </View>
          <View className="bg-surface border border-border rounded-xl p-3 flex-1">
            <Text className="font-dm-sans text-muted text-xs">Pedido mínimo</Text>
            <Text className="font-dm-sans-medium text-white">{product.minOrder} un</Text>
          </View>
          <View className="bg-surface border border-border rounded-xl p-3 flex-1">
            <Text className="font-dm-sans text-muted text-xs">Estoque</Text>
            <Text className={`font-dm-sans-medium ${outOfStock ? 'text-alert' : 'text-success'}`}>
              {outOfStock ? 'Indisp.' : `${product.stock?.qty} un`}
            </Text>
          </View>
        </View>

        {product.price !== undefined && (
          <Text className="font-jetbrains text-accent text-3xl mb-6">
            {formatCurrency(product.price)}
            <Text className="font-dm-sans text-muted text-base"> / {product.unit}</Text>
          </Text>
        )}

        {/* Seletor de quantidade */}
        <View className="flex-row items-center justify-between bg-surface border border-border rounded-2xl p-4 mb-6">
          <Text className="font-dm-sans text-white">Quantidade</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              className="bg-border rounded-xl w-10 h-10 items-center justify-center"
              onPress={decreaseQty}
              disabled={qty <= product.minOrder}
            >
              <Text className="text-white font-barlow-bold text-xl">−</Text>
            </TouchableOpacity>
            <Text className="font-jetbrains text-white text-xl w-16 text-center">{qty}</Text>
            <TouchableOpacity
              className="bg-accent rounded-xl w-10 h-10 items-center justify-center"
              onPress={increaseQty}
              disabled={outOfStock}
            >
              <Text className="text-background font-barlow-bold text-xl">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="font-dm-sans text-muted">Total desta linha</Text>
          <Text className="font-jetbrains text-accent text-xl">
            {product.price ? formatCurrency(product.price * qty) : '—'}
          </Text>
        </View>

        <TouchableOpacity
          className={`rounded-2xl py-5 items-center ${outOfStock ? 'bg-border' : 'bg-accent'}`}
          onPress={handleAddToCart}
          disabled={outOfStock}
        >
          <Text className={`font-barlow-bold text-2xl ${outOfStock ? 'text-muted' : 'text-background'}`}>
            {outOfStock ? 'INDISPONÍVEL' : 'ADICIONAR AO PEDIDO'}
          </Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </ScrollView>
  )
}

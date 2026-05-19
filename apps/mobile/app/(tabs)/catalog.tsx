import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { api } from '@/lib/api'
import { formatCurrency, Product } from '@pace-it/shared'
import { useCartStore } from '@/store/cart.store'

function StockBadge({ qty }: { qty?: number }) {
  if (qty === undefined) return null
  if (qty === 0) return (
    <View className="bg-alert/20 rounded px-2 py-0.5">
      <Text className="text-alert text-xs font-dm-sans">Indisponível</Text>
    </View>
  )
  if (qty < 10) return (
    <View className="bg-yellow-500/20 rounded px-2 py-0.5">
      <Text className="text-yellow-400 text-xs font-dm-sans">Últimas unidades</Text>
    </View>
  )
  return (
    <View className="bg-success/20 rounded px-2 py-0.5">
      <Text className="text-success text-xs font-dm-sans">Em estoque</Text>
    </View>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore()

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      image: product.images[0],
      unitPrice: product.price ?? 0,
      qty: product.minOrder,
      minOrder: product.minOrder,
      unit: product.unit,
    })
    router.push('/(tabs)/cart')
  }

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-3 flex-1 m-1"
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View className="w-full h-32 bg-border rounded-xl mb-3 overflow-hidden">
        {product.images[0] ? (
          <Image source={{ uri: product.images[0] }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl">📦</Text>
          </View>
        )}
      </View>

      <Text className="font-dm-sans text-muted text-xs mb-1">{product.sku}</Text>
      <Text className="font-dm-sans-medium text-white text-sm mb-2" numberOfLines={2}>
        {product.name}
      </Text>

      <StockBadge qty={product.stock?.qty} />

      {product.price !== undefined && (
        <Text className="font-jetbrains text-accent mt-2">
          {formatCurrency(product.price)}
        </Text>
      )}

      <TouchableOpacity
        className="bg-accent rounded-xl mt-3 py-2 items-center"
        onPress={handleAdd}
        disabled={product.stock?.qty === 0}
      >
        <Text className="font-barlow-bold text-background">+ ADICIONAR</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ category?: string }>()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(params.category ?? '')

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, selectedCategory],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: {
          search: search || undefined,
          category: selectedCategory || undefined,
        },
      })
      return data.data as Product[]
    },
  })

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-14 pb-4">
        <Text className="font-barlow-bold text-3xl text-white mb-4">CATÁLOGO</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-white font-dm-sans mb-3"
          placeholder="Buscar produtos..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#C8FF00" size="large" />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-4xl mb-4">🔍</Text>
              <Text className="font-barlow-bold text-xl text-white">Nenhum produto</Text>
              <Text className="font-dm-sans text-muted">Tente outro filtro</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

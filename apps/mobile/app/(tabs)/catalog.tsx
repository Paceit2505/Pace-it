import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Image, ActivityIndicator, ScrollView
} from 'react-native'
import { useState, useCallback } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { api } from '@/lib/api'
import { formatCurrency } from '@pace-it/shared'
import { useCartStore } from '@/store/cart.store'
import Toast from 'react-native-toast-message'

interface Product {
  id: string
  sku: string
  name: string
  category: string
  images: string[]
  unit: string
  unitQty: number
  minOrder: number
  price: number | null
  stock?: { qty: number }
}

function StockBadge({ qty }: { qty?: number }) {
  if (qty === undefined || qty === null) return null
  if (qty === 0) return (
    <View className="bg-alert/20 rounded-md px-2 py-0.5 self-start">
      <Text className="text-alert text-xs font-dm-sans">Indisponível</Text>
    </View>
  )
  if (qty < 10) return (
    <View className="bg-yellow-500/20 rounded-md px-2 py-0.5 self-start">
      <Text className="text-yellow-400 text-xs font-dm-sans">Últimas unidades</Text>
    </View>
  )
  return (
    <View className="bg-success/20 rounded-md px-2 py-0.5 self-start">
      <Text className="text-success text-xs font-dm-sans">Em estoque</Text>
    </View>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore()
  const outOfStock = (product.stock?.qty ?? 0) === 0

  const handleQuickAdd = () => {
    if (outOfStock) return
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
    Toast.show({ type: 'success', text1: 'Adicionado! 🏃', text2: product.name, visibilityTime: 1500 })
  }

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-3 flex-1 m-1.5"
      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.8}
    >
      {/* Imagem */}
      <View className="w-full h-28 bg-border rounded-xl mb-3 overflow-hidden items-center justify-center">
        {product.images[0] ? (
          <Image source={{ uri: product.images[0] }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 36 }}>📦</Text>
        )}
      </View>

      {/* SKU */}
      <Text className="font-jetbrains text-muted text-xs mb-1">{product.sku}</Text>

      {/* Nome */}
      <Text className="font-dm-sans-medium text-white text-sm mb-2 leading-tight" numberOfLines={2}>
        {product.name}
      </Text>

      {/* Badge de estoque */}
      <StockBadge qty={product.stock?.qty} />

      {/* Preço */}
      {product.price != null && (
        <Text className="font-jetbrains text-accent mt-2 text-sm">
          {formatCurrency(product.price)}
        </Text>
      )}

      {/* Botão rápido */}
      <TouchableOpacity
        className={`rounded-xl mt-3 py-2 items-center ${outOfStock ? 'bg-border' : 'bg-accent'}`}
        onPress={handleQuickAdd}
        disabled={outOfStock}
      >
        <Text className={`font-barlow-bold text-sm ${outOfStock ? 'text-muted' : 'text-background'}`}>
          {outOfStock ? 'INDISPONÍVEL' : '+ PEDIDO'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const SORT_OPTIONS = [
  { value: 'name', label: 'A–Z' },
  { value: 'price', label: 'Preço' },
  { value: 'stock', label: 'Estoque' },
] as const

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ category?: string }>()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(params.category ?? '')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/products/categories')
      return data.data as string[]
    },
    staleTime: 1000 * 60 * 10,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['products', search, selectedCategory, inStockOnly, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get('/products', {
        params: {
          search: search || undefined,
          category: selectedCategory || undefined,
          inStock: inStockOnly ? 'true' : undefined,
          sortBy,
          page: pageParam,
          limit: 20,
        },
      })
      return data
    },
    getNextPageParam: (lastPage) => {
      const { meta } = lastPage
      return meta.page < meta.totalPages ? meta.page + 1 : undefined
    },
    initialPageParam: 1,
  })

  const products = data?.pages.flatMap((p) => p.data) ?? []

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <View className="flex-1 bg-background">
      {/* Header e busca */}
      <View className="px-5 pt-14 pb-3">
        <Text className="font-barlow-bold text-3xl text-white mb-4">CATÁLOGO</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-white font-dm-sans"
          placeholder="Buscar produtos..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Filtros de categoria */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
      >
        <TouchableOpacity
          className={`rounded-full px-4 py-2 border ${selectedCategory === '' ? 'bg-accent border-accent' : 'bg-surface border-border'}`}
          onPress={() => setSelectedCategory('')}
        >
          <Text className={`font-dm-sans text-sm ${selectedCategory === '' ? 'text-background' : 'text-white'}`}>
            Todos
          </Text>
        </TouchableOpacity>

        {categories?.map((cat) => (
          <TouchableOpacity
            key={cat}
            className={`rounded-full px-4 py-2 border ${selectedCategory === cat ? 'bg-accent border-accent' : 'bg-surface border-border'}`}
            onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
          >
            <Text className={`font-dm-sans text-sm ${selectedCategory === cat ? 'text-background' : 'text-white'}`}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Toggle estoque */}
        <TouchableOpacity
          className={`rounded-full px-4 py-2 border ${inStockOnly ? 'bg-success border-success' : 'bg-surface border-border'}`}
          onPress={() => setInStockOnly(!inStockOnly)}
        >
          <Text className={`font-dm-sans text-sm ${inStockOnly ? 'text-background' : 'text-white'}`}>
            Em estoque
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Ordenação */}
      <View className="flex-row px-5 pb-3 gap-2">
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            className={`rounded-lg px-3 py-1.5 border ${sortBy === opt.value ? 'border-accent bg-accent/10' : 'border-border bg-surface'}`}
            onPress={() => setSortBy(opt.value)}
          >
            <Text className={`font-dm-sans text-xs ${sortBy === opt.value ? 'text-accent' : 'text-muted'}`}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de produtos */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#C8FF00" size="large" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 6 }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#C8FF00" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-5xl mb-4">🔍</Text>
              <Text className="font-barlow-bold text-xl text-white">Nenhum produto</Text>
              <Text className="font-dm-sans text-muted text-center px-8">
                Tente remover alguns filtros
              </Text>
            </View>
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}

      <Toast />
    </View>
  )
}

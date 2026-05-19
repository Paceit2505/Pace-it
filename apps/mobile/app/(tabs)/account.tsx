import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { formatCNPJ, Store } from '@pace-it/shared'

export default function AccountScreen() {
  const { logout } = useAuthStore()

  const { data: store } = useQuery({
    queryKey: ['store-me'],
    queryFn: async () => {
      const { data } = await api.get('/stores/me')
      return data.data as Store
    },
  })

  const handleLogout = async () => {
    await logout()
    router.replace('/(auth)/login')
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20 }}>
      <Text className="font-barlow-bold text-3xl text-white pt-14 mb-6">MINHA CONTA</Text>

      {/* Dados da loja */}
      <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <Text className="font-barlow-bold text-lg text-white mb-1">{store?.nomeFantasia}</Text>
        <Text className="font-dm-sans text-muted text-sm">{store?.razaoSocial}</Text>
        <Text className="font-jetbrains text-muted text-sm mt-1">
          {store?.cnpj ? formatCNPJ(store.cnpj) : ''}
        </Text>
        <Text className="font-dm-sans text-muted text-sm mt-1">{store?.email}</Text>
        <Text className="font-dm-sans text-muted text-sm">{store?.phone}</Text>
      </View>

      {/* Ações */}
      <TouchableOpacity
        className="bg-surface border border-border rounded-2xl p-4 mb-3 flex-row justify-between items-center"
        onPress={() => {}}
      >
        <Text className="font-dm-sans text-white">Configurações de notificação</Text>
        <Text className="text-muted">›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-alert/10 border border-alert/30 rounded-2xl p-4 mt-4 items-center"
        onPress={handleLogout}
      >
        <Text className="font-barlow-bold text-alert text-lg">SAIR</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

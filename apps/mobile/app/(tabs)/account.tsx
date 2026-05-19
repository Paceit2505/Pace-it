import {
  View, Text, ScrollView, TouchableOpacity, Linking, Alert
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { formatCNPJ } from '@pace-it/shared'

export default function AccountScreen() {
  const { logout } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: store } = useQuery({
    queryKey: ['store-me'],
    queryFn: async () => {
      const { data } = await api.get('/stores/me')
      return data.data
    },
  })

  const handleWhatsApp = () => {
    const phone = store?.representative?.phone?.replace(/\D/g, '')
    if (!phone) return
    const url = `https://wa.me/55${phone}`
    Linking.openURL(url)
  }

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          queryClient.clear()
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  const address = store?.address

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <Text className="font-barlow-bold text-3xl text-white pt-14 mb-6">MINHA CONTA</Text>

      {/* Dados da loja */}
      <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <Text className="font-dm-sans text-muted text-xs mb-3">DADOS DA LOJA</Text>

        <Text className="font-barlow-bold text-2xl text-white">{store?.nomeFantasia}</Text>
        <Text className="font-dm-sans text-muted text-sm mt-0.5">{store?.razaoSocial}</Text>

        <View className="h-px bg-border my-3" />

        <View className="gap-1.5">
          <View className="flex-row justify-between">
            <Text className="font-dm-sans text-muted text-sm">CNPJ</Text>
            <Text className="font-jetbrains text-white text-sm">
              {store?.cnpj ? formatCNPJ(store.cnpj) : '—'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-dm-sans text-muted text-sm">E-mail</Text>
            <Text className="font-dm-sans text-white text-sm">{store?.email}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-dm-sans text-muted text-sm">Telefone</Text>
            <Text className="font-dm-sans text-white text-sm">{store?.phone}</Text>
          </View>
        </View>

        {address && (
          <>
            <View className="h-px bg-border my-3" />
            <Text className="font-dm-sans text-muted text-sm">
              {address.street}, {address.number}
              {address.complement ? `, ${address.complement}` : ''}
            </Text>
            <Text className="font-dm-sans text-muted text-sm">
              {address.neighborhood} — {address.city}/{address.state}
            </Text>
            <Text className="font-dm-sans text-muted text-sm">{address.zipCode}</Text>
          </>
        )}
      </View>

      {/* Tabela de preços */}
      {store?.priceTable && (
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="font-dm-sans text-muted text-xs mb-2">TABELA DE PREÇOS</Text>
          <View className="flex-row justify-between items-center">
            <Text className="font-barlow-bold text-xl text-white">{store.priceTable.name}</Text>
            {store.priceTable.discount > 0 && (
              <View className="bg-success/20 rounded-full px-3 py-1">
                <Text className="font-dm-sans text-success text-sm">
                  {store.priceTable.discount}% desconto
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Representante */}
      {store?.representative && (
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="font-dm-sans text-muted text-xs mb-3">MEU REPRESENTANTE</Text>
          <Text className="font-barlow-bold text-xl text-white mb-1">
            {store.representative.name}
          </Text>
          <Text className="font-dm-sans text-muted text-sm mb-4">
            {store.representative.phone}
          </Text>
          <TouchableOpacity
            className="bg-success/20 border border-success/40 rounded-xl py-3 flex-row items-center justify-center gap-2"
            onPress={handleWhatsApp}
          >
            <Text style={{ fontSize: 18 }}>💬</Text>
            <Text className="font-barlow-bold text-success">CHAMAR NO WHATSAPP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ações */}
      <TouchableOpacity
        className="bg-surface border border-border rounded-2xl p-4 mb-3 flex-row justify-between items-center"
      >
        <Text className="font-dm-sans text-white">Notificações</Text>
        <Text className="text-muted text-lg">›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-alert/10 border border-alert/30 rounded-2xl p-4 mt-2 items-center"
        onPress={handleLogout}
      >
        <Text className="font-barlow-bold text-alert text-lg">SAIR DA CONTA</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

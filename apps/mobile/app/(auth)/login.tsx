import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import Toast from 'react-native-toast-message'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { formatCNPJ } from '@pace-it/shared'

export default function LoginScreen() {
  const [cnpj, setCnpj] = useState('')
  const [password, setPassword] = useState('')
  const { setUser } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/login', {
        cnpj: cnpj.replace(/\D/g, ''),
        password,
      })
      return data
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync('accessToken', data.accessToken)
      await SecureStore.setItemAsync('refreshToken', data.refreshToken)
      await SecureStore.setItemAsync('user', JSON.stringify(data.user))
      setUser(data.user)
      router.replace('/(tabs)')
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        Toast.show({
          type: 'error',
          text1: 'Acesso negado',
          text2: error.response.data?.message ?? 'Conta pendente ou bloqueada',
        })
      } else if (!error.response) {
        Toast.show({
          type: 'error',
          text1: 'Sem conexão',
          text2: 'Verifique sua internet e tente novamente',
        })
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro ao entrar',
          text2: error.response?.data?.message ?? 'Verifique suas credenciais',
        })
      }
    },
  })

  const handleCNPJChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 14)
    setCnpj(formatCNPJ(digits))
  }

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="font-barlow-bold text-4xl text-white mb-2">
        PACE IT
      </Text>
      <Text className="font-dm-sans text-muted mb-10">
        Hub de Pedidos B2B
      </Text>

      <Text className="font-dm-sans text-white mb-2">CNPJ</Text>
      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-4 text-white font-dm-sans mb-4"
        placeholder="00.000.000/0000-00"
        placeholderTextColor="#888"
        value={cnpj}
        onChangeText={handleCNPJChange}
        keyboardType="numeric"
        autoCorrect={false}
      />

      <Text className="font-dm-sans text-white mb-2">Senha</Text>
      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-4 text-white font-dm-sans mb-6"
        placeholder="Sua senha"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className="bg-accent rounded-xl py-4 items-center"
        onPress={() => {
          if (!cnpj || cnpj.replace(/\D/g, '').length !== 14) {
            Toast.show({ type: 'error', text1: 'Digite um CNPJ válido' })
            return
          }
          if (!password) {
            Toast.show({ type: 'error', text1: 'Digite sua senha' })
            return
          }
          loginMutation.mutate()
        }}
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <Text className="font-barlow-bold text-xl text-background">ENTRAR</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 items-center"
        onPress={() => router.push('/(auth)/register')}
      >
        <Text className="font-dm-sans text-muted">
          Novo lojista?{' '}
          <Text className="text-accent">Cadastre sua loja</Text>
        </Text>
      </TouchableOpacity>

      <Toast />
    </View>
  )
}

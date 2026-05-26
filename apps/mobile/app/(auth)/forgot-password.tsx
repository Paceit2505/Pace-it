import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { api } from '@/lib/api'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/forgot-password', { email })
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'E-mail enviado',
        text2: 'Verifique sua caixa de entrada.',
      })
      setTimeout(() => router.back(), 2000)
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Erro ao enviar e-mail' })
    },
  })

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <TouchableOpacity onPress={() => router.back()} className="mb-8">
        <Text className="text-accent font-dm-sans">← Voltar</Text>
      </TouchableOpacity>

      <Text className="font-barlow-bold text-3xl text-white mb-2">RECUPERAR SENHA</Text>
      <Text className="font-dm-sans text-muted mb-8">
        Informe seu e-mail cadastrado e enviaremos as instruções.
      </Text>

      <Text className="font-dm-sans text-white mb-2">E-mail</Text>
      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-4 text-white font-dm-sans mb-6"
        placeholder="seu@email.com.br"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        className="bg-accent rounded-xl py-4 items-center"
        onPress={() => {
          if (!email.includes('@')) {
            Toast.show({ type: 'error', text1: 'Digite um e-mail válido' })
            return
          }
          mutation.mutate()
        }}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <Text className="font-barlow-bold text-xl text-background">ENVIAR</Text>
        )}
      </TouchableOpacity>

      <Toast />
    </View>
  )
}

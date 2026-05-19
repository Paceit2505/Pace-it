import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { api } from '@/lib/api'
import { formatCNPJ } from '@pace-it/shared'

interface ReceitaWSData {
  nome: string
  fantasia: string
  email: string
  telefone: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  cep: string
}

export default function RegisterScreen() {
  const [step, setStep] = useState<'cnpj' | 'dados' | 'senha' | 'aguardo'>('cnpj')
  const [cnpj, setCnpj] = useState('')
  const [receitaData, setReceitaData] = useState<ReceitaWSData | null>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const receitaMutation = useMutation({
    mutationFn: async (cnpjDigits: string) => {
      const { data } = await api.get(`/auth/cnpj/${cnpjDigits}`)
      return data as ReceitaWSData
    },
    onSuccess: (data) => {
      setReceitaData(data)
      setEmail(data.email ?? '')
      setPhone(data.telefone ?? '')
      setStep('dados')
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'CNPJ não encontrado ou inválido' })
    },
  })

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!receitaData) throw new Error('Dados da empresa não carregados')
      await api.post('/auth/register', {
        cnpj: cnpj.replace(/\D/g, ''),
        razaoSocial: receitaData.nome,
        nomeFantasia: receitaData.fantasia || receitaData.nome,
        email,
        phone,
        address: {
          street: receitaData.logradouro,
          number: receitaData.numero,
          complement: receitaData.complemento,
          neighborhood: receitaData.bairro,
          city: receitaData.municipio,
          state: receitaData.uf,
          zipCode: receitaData.cep,
        },
        password,
      })
    },
    onSuccess: () => setStep('aguardo'),
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Erro no cadastro',
        text2: error.response?.data?.message ?? 'Tente novamente',
      })
    },
  })

  const handleCNPJChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 14)
    setCnpj(formatCNPJ(digits))
  }

  if (step === 'aguardo') {
    return (
      <View className="flex-1 bg-background px-6 justify-center items-center">
        <Text className="text-6xl mb-6">🏃</Text>
        <Text className="font-barlow-bold text-3xl text-white text-center mb-4">
          CONTA EM ANÁLISE
        </Text>
        <Text className="font-dm-sans text-muted text-center mb-8">
          Sua conta está em análise. Você receberá um e-mail em até 24h com a confirmação de acesso.
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-xl py-4 px-8"
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="font-barlow-bold text-xl text-background">VOLTAR AO LOGIN</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} className="mb-6">
        <Text className="text-accent font-dm-sans">← Voltar</Text>
      </TouchableOpacity>

      <Text className="font-barlow-bold text-3xl text-white mb-2">CADASTRO</Text>
      <Text className="font-dm-sans text-muted mb-8">Nova loja parceira</Text>

      {step === 'cnpj' && (
        <View>
          <Text className="font-dm-sans text-white mb-2">CNPJ da empresa</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-4 text-white font-dm-sans mb-6"
            placeholder="00.000.000/0000-00"
            placeholderTextColor="#888"
            value={cnpj}
            onChangeText={handleCNPJChange}
            keyboardType="numeric"
          />
          <TouchableOpacity
            className="bg-accent rounded-xl py-4 items-center"
            onPress={() => receitaMutation.mutate(cnpj.replace(/\D/g, ''))}
            disabled={receitaMutation.isPending || cnpj.replace(/\D/g, '').length !== 14}
          >
            {receitaMutation.isPending ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text className="font-barlow-bold text-xl text-background">BUSCAR DADOS</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === 'dados' && receitaData && (
        <View>
          <View className="bg-surface border border-border rounded-xl p-4 mb-6">
            <Text className="font-barlow-bold text-lg text-white">{receitaData.nome}</Text>
            <Text className="font-dm-sans text-muted">{cnpj}</Text>
          </View>

          <Text className="font-dm-sans text-white mb-2">E-mail</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-4 text-white font-dm-sans mb-4"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#888"
          />

          <Text className="font-dm-sans text-white mb-2">Telefone</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-4 text-white font-dm-sans mb-4"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#888"
          />

          <Text className="font-dm-sans text-white mb-2">Nome do responsável</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-4 text-white font-dm-sans mb-6"
            value={responsavel}
            onChangeText={setResponsavel}
            placeholderTextColor="#888"
          />

          <TouchableOpacity
            className="bg-accent rounded-xl py-4 items-center"
            onPress={() => setStep('senha')}
            disabled={!email || !phone}
          >
            <Text className="font-barlow-bold text-xl text-background">CONTINUAR</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'senha' && (
        <View>
          <Text className="font-dm-sans text-white mb-2">Crie sua senha</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-4 text-white font-dm-sans mb-4"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#888"
          />

          <Text className="font-dm-sans text-white mb-2">Confirme a senha</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-4 text-white font-dm-sans mb-6"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor="#888"
          />

          <TouchableOpacity
            className="bg-accent rounded-xl py-4 items-center"
            onPress={() => {
              if (password !== confirmPassword) {
                Toast.show({ type: 'error', text1: 'As senhas não coincidem' })
                return
              }
              if (password.length < 8) {
                Toast.show({ type: 'error', text1: 'Senha deve ter no mínimo 8 caracteres' })
                return
              }
              registerMutation.mutate()
            }}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text className="font-barlow-bold text-xl text-background">CADASTRAR</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Toast />
    </ScrollView>
  )
}

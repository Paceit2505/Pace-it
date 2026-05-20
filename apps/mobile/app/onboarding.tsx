import {
  View, Text, TouchableOpacity, Dimensions, ScrollView
} from 'react-native'
import { useState, useRef } from 'react'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

interface OnboardingStep {
  emoji: string
  title: string
  subtitle: string
  description: string
  accentText?: string
}

const STEPS: OnboardingStep[] = [
  {
    emoji: '📦',
    title: 'CATÁLOGO\nCOMPLETO',
    subtitle: 'Todos os produtos Pace It',
    description:
      'Explore hidrogéis, eletrólitos, proteínas, acessórios e merch. Preços exclusivos da sua tabela, direto no app.',
    accentText: 'Seus preços, sempre atualizados.',
  },
  {
    emoji: '🛒',
    title: 'PEDIDO\nRÁPIDO',
    subtitle: 'Do catálogo ao pedido em segundos',
    description:
      'Monte seu pedido, escolha boleto ou PIX, e confirme. Sem WhatsApp, sem e-mail, sem espera. Seu pedido vai direto para a Pace It.',
    accentText: 'Carrinho salvo automáticamente.',
  },
  {
    emoji: '🏃',
    title: 'ACOMPANHE\nTUDO',
    subtitle: 'Status em tempo real',
    description:
      'Receba notificações quando seu pedido for confirmado, faturado e enviado. Acesse a nota fiscal direto no app.',
    accentText: 'No ritmo da performance.',
  },
]

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const goToStep = (index: number) => {
    setCurrentStep(index)
    scrollRef.current?.scrollTo({ x: index * width, animated: true })
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1)
    } else {
      handleFinish()
    }
  }

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true')
    router.replace('/(tabs)')
  }

  const step = STEPS[currentStep]

  return (
    <View className="flex-1 bg-background">
      {/* Skip */}
      <TouchableOpacity
        className="absolute top-14 right-6 z-10"
        onPress={handleFinish}
      >
        <Text className="font-dm-sans text-muted">Pular</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        className="flex-1"
      >
        {STEPS.map((s, index) => (
          <View
            key={index}
            style={{ width }}
            className="flex-1 items-center justify-center px-8"
          >
            {/* Ícone grande */}
            <View className="w-40 h-40 bg-accent/10 border border-accent/30 rounded-full items-center justify-center mb-10">
              <Text style={{ fontSize: 72 }}>{s.emoji}</Text>
            </View>

            {/* Título */}
            <Text className="font-barlow-bold text-5xl text-white text-center mb-2 leading-tight">
              {s.title}
            </Text>

            {/* Subtítulo */}
            <Text className="font-dm-sans text-muted text-center mb-6">{s.subtitle}</Text>

            {/* Descrição */}
            <Text className="font-dm-sans text-white/80 text-center leading-relaxed mb-4">
              {s.description}
            </Text>

            {/* Accent text */}
            {s.accentText && (
              <View className="bg-accent/10 border border-accent/30 rounded-xl px-5 py-2">
                <Text className="font-barlow-bold text-accent text-center">{s.accentText}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Indicadores de progresso */}
      <View className="flex-row justify-center gap-2 mb-8">
        {STEPS.map((_, index) => (
          <TouchableOpacity
            key={index}
            className={`h-1.5 rounded-full ${
              index === currentStep ? 'w-8 bg-accent' : 'w-3 bg-border'
            }`}
            style={{ transition: 'width 0.3s' }}
            onPress={() => goToStep(index)}
          />
        ))}
      </View>

      {/* Botão de ação */}
      <View className="px-6 pb-12">
        <TouchableOpacity
          className="bg-accent rounded-2xl py-5 items-center"
          onPress={handleNext}
        >
          <Text className="font-barlow-bold text-2xl text-background">
            {currentStep < STEPS.length - 1 ? 'PRÓXIMO →' : 'COMEÇAR AGORA'}
          </Text>
        </TouchableOpacity>

        {/* Progresso textual */}
        <Text className="font-dm-sans text-muted text-center mt-4 text-sm">
          {currentStep + 1} de {STEPS.length}
        </Text>
      </View>
    </View>
  )
}

import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'
import { View, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  useEffect(() => {
    AsyncStorage.getItem('onboarding_completed').then((val) => {
      setOnboardingDone(val === 'true')
    })
  }, [])

  if (isLoading || onboardingDone === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#C8FF00" size="large" />
      </View>
    )
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />
  }

  return <Redirect href="/(tabs)" />
}

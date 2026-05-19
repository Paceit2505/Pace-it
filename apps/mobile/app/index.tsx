import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#C8FF00" />
      </View>
    )
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />
}

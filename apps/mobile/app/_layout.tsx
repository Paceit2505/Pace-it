import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import '../global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
})

export default function RootLayout() {
  const { loadFromStorage } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  )
}

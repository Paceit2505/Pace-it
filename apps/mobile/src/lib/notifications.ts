import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { api } from './api'

// Configura o handler de notificações recebidas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Push] Push notifications requerem dispositivo físico')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permissão de notificações negada')
    return null
  }

  // Obtém o token Expo Push
  const tokenData = await Notifications.getExpoPushTokenAsync()
  const token = tokenData.data

  // Registra o token no backend
  try {
    await api.post('/push/token', {
      token,
      platform: Platform.OS as 'ios' | 'android' | 'web',
    })
  } catch (err) {
    console.error('[Push] Erro ao registrar token:', err)
  }

  return token
}

export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await api.delete('/push/token', { data: { token } })
  } catch (err) {
    console.error('[Push] Erro ao desregistrar token:', err)
  }
}

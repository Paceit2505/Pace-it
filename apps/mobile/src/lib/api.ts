import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Injeta o access token em todas as requisições
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh token automático em caso de 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken')
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })

        await SecureStore.setItemAsync('accessToken', data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`

        return api(originalRequest)
      } catch {
        await SecureStore.deleteItemAsync('accessToken')
        await SecureStore.deleteItemAsync('refreshToken')
      }
    }

    return Promise.reject(error)
  }
)

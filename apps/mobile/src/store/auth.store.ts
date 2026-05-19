import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { UserRole } from '@pace-it/shared'

interface AuthUser {
  id: string
  role: UserRole
  storeId?: string
  representativeId?: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    set({ user: null, isAuthenticated: false })
  },

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken')
      const userJson = await SecureStore.getItemAsync('user')

      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthUser
        set({ user, isAuthenticated: true })
      }
    } catch {
      // token inválido ou corrompido — faz logout silencioso
    } finally {
      set({ isLoading: false })
    }
  },
}))

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { PaymentMethod } from '@pace-it/shared'

export interface CartItem {
  productId: string
  name: string
  sku: string
  image?: string
  unitPrice: number
  qty: number
  minOrder: number
  unit: string
}

interface CartState {
  items: CartItem[]
  paymentMethod: PaymentMethod
  notes: string
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setNotes: (notes: string) => void
  clearCart: () => void
  itemCount: () => number
  subtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      paymentMethod: PaymentMethod.BOLETO,
      notes: '',

      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId)
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === item.productId
                ? { ...i, qty: i.qty + item.qty }
                : i
            ),
          }))
        } else {
          set((state) => ({ items: [...state.items, item] }))
        }
      },

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, qty } : i
          ),
        }))
      },

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      setNotes: (notes) => set({ notes }),

      clearCart: () => set({ items: [], notes: '' }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
    }),
    {
      name: 'pace-it-cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

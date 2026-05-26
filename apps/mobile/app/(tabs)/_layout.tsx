import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { useCartStore } from '@/store/cart.store'

function TabIcon({ focused, emoji, label, badge }: {
  focused: boolean; emoji: string; label: string; badge?: number
}) {
  return (
    <View className="items-center">
      <View>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
        {badge != null && badge > 0 && (
          <View className="absolute -top-1 -right-2 bg-accent rounded-full w-4 h-4 items-center justify-center">
            <Text className="text-background font-barlow-bold" style={{ fontSize: 9 }}>
              {badge > 9 ? '9+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text className={`text-xs font-dm-sans mt-1 ${focused ? 'text-accent' : 'text-muted'}`}>
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  const cartCount = useCartStore((s) => s.itemCount())

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#141414',
          borderTopColor: '#2A2A2A',
          height: 72,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🏠" label="Início" />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="📦" label="Catálogo" />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🛒" label="Pedido" badge={cartCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="📋" label="Pedidos" />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="👤" label="Conta" />
          ),
        }}
      />
    </Tabs>
  )
}

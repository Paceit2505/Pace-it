import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'

function TabIcon({ focused, emoji, label }: { focused: boolean; emoji: string; label: string }) {
  return (
    <View className="items-center">
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text
        className={`text-xs font-dm-sans mt-1 ${focused ? 'text-accent' : 'text-muted'}`}
      >
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
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
            <TabIcon focused={focused} emoji="🛒" label="Pedido" />
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

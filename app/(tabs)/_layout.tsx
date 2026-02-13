import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Home, List, User } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.textSecondary,
        headerShown: false,
        // Removed HapticTab and TabBarBackground for simplicity and to fix build errors
        // tabBarButton: HapticTab, 
        // tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: Colors.dark.card,
            borderTopColor: Colors.dark.border,
          },
          default: {
            backgroundColor: Colors.dark.card,
            borderTopColor: Colors.dark.border,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kitchens',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'My Orders',
          tabBarIcon: ({ color }) => <List color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

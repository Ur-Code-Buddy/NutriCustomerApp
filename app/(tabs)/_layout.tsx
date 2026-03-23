import { Tabs } from 'expo-router';
import React from 'react';

import { PillTabBar } from '../../components/PillTabBar';
import { TabBarScrollProvider } from '../../context/TabBarScrollContext';

export default function TabLayout() {
  return (
    <TabBarScrollProvider>
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Kitchens' }} />
      <Tabs.Screen name="orders" options={{ title: 'My Orders' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
    </TabBarScrollProvider>
  );
}

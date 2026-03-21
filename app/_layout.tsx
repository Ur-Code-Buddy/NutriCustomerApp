import { ChevronLeft, X } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { setupNotificationChannel, setupNotificationListeners } from '../services/notifications';
import { Colors } from '../constants/Colors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

function InitializingGuard({ children }: { children: React.ReactNode }) {
  const { isInitializing } = useAuth();
  if (isInitializing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    setupNotificationChannel();
    const cleanup = setupNotificationListeners();
    return () => {
      cleanup();
    };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="light" />
        <InitializingGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: Colors.dark.background,
            },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="kitchen/[id]"
            options={({ navigation }) => ({
              headerShown: true,
              headerBackVisible: false,
              title: 'Kitchen Details',
              headerStyle: { backgroundColor: Colors.dark.card },
              headerTintColor: Colors.dark.text,
              headerLeftContainerStyle: styles.headerLeftContainer,
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.headerBack}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  activeOpacity={0.6}
                >
                  <ChevronLeft size={26} color={Colors.dark.text} strokeWidth={2.5} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="cart"
            options={({ navigation }) => ({
              presentation: 'modal',
              headerShown: true,
              headerBackVisible: false,
              title: 'Your Cart',
              headerStyle: { backgroundColor: Colors.dark.card },
              headerTintColor: Colors.dark.text,
              headerLeftContainerStyle: styles.headerLeftContainer,
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.headerBack}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  activeOpacity={0.6}
                >
                  <X size={24} color={Colors.dark.text} strokeWidth={2} />
                </TouchableOpacity>
              ),
            })}
          />
        </Stack>
        </InitializingGuard>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  headerLeftContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
    minWidth: 44,
  },
  headerBack: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
});

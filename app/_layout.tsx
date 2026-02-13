import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
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
          options={{
            headerShown: true,
            title: 'Kitchen Details',
            headerStyle: { backgroundColor: Colors.dark.background },
            headerTintColor: Colors.dark.text,
          }}
        />
        <Stack.Screen
          name="cart"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Your Cart',
            headerStyle: { backgroundColor: Colors.dark.card },
            headerTintColor: Colors.dark.text,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}

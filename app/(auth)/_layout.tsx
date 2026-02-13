import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.dark.background,
                },
                headerTintColor: Colors.dark.text,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                contentStyle: {
                    backgroundColor: Colors.dark.background,
                },
            }}
        >
            <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
            <Stack.Screen name="register" options={{ title: 'Create Account', headerShown: false }} />
        </Stack>
    );
}

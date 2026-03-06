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
            <Stack.Screen
                name="email-verification-pending"
                options={{ title: 'Verify Email', headerShown: false }}
            />
            <Stack.Screen
                name="phone-verify-otp"
                options={{ title: 'Verify Phone', headerShown: false }}
            />
            <Stack.Screen
                name="forgot-password"
                options={{ title: 'Forgot Password', headerShown: false }}
            />
            <Stack.Screen
                name="reset-password"
                options={{ title: 'Reset Password', headerShown: false }}
            />
        </Stack>
    );
}

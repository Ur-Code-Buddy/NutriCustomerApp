import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { authService } from '../../services/api';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        setLoading(true);
        try {
            await authService.forgotPassword(email.trim().toLowerCase());
            Alert.alert(
                'Check your email',
                'A 6-digit OTP has been sent. Use it to reset your password.',
                [
                    {
                        text: 'OK',
                        onPress: () =>
                            router.replace({
                                pathname: '/(auth)/reset-password',
                                params: { email: email.trim().toLowerCase() },
                            }),
                    },
                ]
            );
        } catch (err: any) {
            Alert.alert(
                'Error',
                err?.response?.data?.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <View style={styles.iconWrap}>
                        <Mail color={Colors.dark.primary} size={48} />
                    </View>
                    <Text style={styles.title}>Forgot password?</Text>
                    <Text style={styles.subtitle}>
                        Enter your email and we'll send you a 6-digit OTP to reset your password.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Mail color={Colors.dark.textSecondary} size={20} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="your@email.com"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.dark.primaryForeground} size="small" />
                        ) : (
                            <Text style={styles.btnPrimaryText}>Send OTP</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnGhost}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.btnGhostText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    content: {
        alignItems: 'center',
    },
    iconWrap: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        marginBottom: 24,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        width: '100%',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: Colors.dark.text,
        fontSize: 16,
    },
    btn: {
        width: '100%',
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    btnPrimary: {
        backgroundColor: Colors.dark.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnPrimaryText: {
        color: Colors.dark.primaryForeground,
        fontSize: 16,
        fontWeight: 'bold',
    },
    btnGhost: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
    },
    btnGhostText: {
        color: Colors.dark.primary,
        fontSize: 14,
    },
    btnDisabled: {
        opacity: 0.6,
    },
});

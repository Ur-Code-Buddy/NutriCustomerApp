import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
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

export default function ResetPasswordScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async () => {
        if (!email?.trim()) {
            Alert.alert('Error', 'Email is required. Please start from Forgot Password.');
            return;
        }
        if (!/^\d{6}$/.test(otp.trim())) {
            Alert.alert('Error', 'OTP must be 6 digits');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await authService.resetPassword(email.trim().toLowerCase(), otp.trim(), newPassword);
            Alert.alert('Success', 'Your password has been reset. Please log in.', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') },
            ]);
        } catch (err: any) {
            Alert.alert(
                'Reset Failed',
                err?.response?.data?.message || 'Invalid OTP or link expired. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        router.replace('/(auth)/login');
        return null;
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <Text style={styles.title}>Reset password</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit OTP from your email and your new password.
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="6-digit OTP"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={otp}
                            onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock color={Colors.dark.textSecondary} size={20} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="New password (min 6 chars)"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock color={Colors.dark.textSecondary} size={20} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm password"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
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
                            <Text style={styles.btnPrimaryText}>Reset Password</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnGhost}
                        onPress={() => router.replace('/(auth)/login')}
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
        marginBottom: 16,
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

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Smartphone } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

const RESEND_COOLDOWN_SEC = 60;

function maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '****';
    return `******${phone.slice(-4)}`;
}

export default function PhoneVerifyOtpScreen() {
    const { email, phone } = useLocalSearchParams<{ email: string; phone: string }>();
    const router = useRouter();
    const { signIn, pendingCredentials, clearPendingCredentials } = useAuth();

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resending, setResending] = useState(false);
    const cooldownRef = useRef<NodeJS.Timeout | null>(null);

    const startCooldown = useCallback(() => {
        setResendCooldown(RESEND_COOLDOWN_SEC);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    if (cooldownRef.current) {
                        clearInterval(cooldownRef.current);
                        cooldownRef.current = null;
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleVerify = async () => {
        if (!phone || !otp.trim()) {
            Alert.alert('Error', 'Please enter the 4-digit OTP');
            return;
        }
        if (!/^\d{4}$/.test(otp.trim())) {
            Alert.alert('Error', 'OTP must be 4 digits');
            return;
        }

        setLoading(true);
        try {
            await authService.verifyPhone(phone, otp.trim());
            if (pendingCredentials) {
                await signIn({
                    username: pendingCredentials.username,
                    password: pendingCredentials.password,
                });
                clearPendingCredentials();
                router.replace('/(tabs)');
            } else {
                clearPendingCredentials();
                router.replace('/(auth)/login');
            }
        } catch (err: any) {
            Alert.alert(
                'Verification Failed',
                err?.response?.data?.message || 'Invalid OTP. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!phone || resendCooldown > 0 || resending) return;
        setResending(true);
        try {
            await authService.resendPhoneOtp(phone);
            startCooldown();
            Alert.alert('Success', 'A new OTP has been sent to your phone.');
        } catch (err: any) {
            Alert.alert(
                'Error',
                err?.response?.data?.message || 'Failed to resend OTP.'
            );
        } finally {
            setResending(false);
        }
    };

    if (!email || !phone) {
        router.replace('/(auth)/register');
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <Smartphone color={Colors.dark.primary} size={48} />
                </View>
                <Text style={styles.title}>Verify your phone</Text>
                <Text style={styles.subtitle}>
                    Enter the 4-digit code sent to
                </Text>
                <Text style={styles.phone}>{maskPhone(phone)}</Text>

                <TextInput
                    style={styles.otpInput}
                    placeholder="0000"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={otp}
                    onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                    editable={!loading}
                />

                <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
                    onPress={handleVerify}
                    disabled={loading || otp.length !== 4}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.dark.primaryForeground} size="small" />
                    ) : (
                        <Text style={styles.btnPrimaryText}>Verify</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btn, styles.btnGhost, (resendCooldown > 0 || resending) && styles.btnDisabled]}
                    onPress={handleResendOtp}
                    disabled={resendCooldown > 0 || resending}
                >
                    {resending ? (
                        <ActivityIndicator color={Colors.dark.primary} size="small" />
                    ) : resendCooldown > 0 ? (
                        <Text style={styles.btnGhostText}>Resend OTP ({resendCooldown}s)</Text>
                    ) : (
                        <Text style={styles.btnGhostText}>Resend OTP</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        paddingHorizontal: 24,
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
        marginBottom: 4,
        textAlign: 'center',
    },
    phone: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.primary,
        marginBottom: 24,
        textAlign: 'center',
    },
    otpInput: {
        width: '100%',
        height: 56,
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        paddingHorizontal: 20,
        fontSize: 24,
        letterSpacing: 12,
        color: Colors.dark.text,
        textAlign: 'center',
        marginBottom: 24,
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
    },
    btnGhostText: {
        color: Colors.dark.primary,
        fontSize: 14,
    },
    btnDisabled: {
        opacity: 0.6,
    },
});

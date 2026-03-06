import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

const POLL_INTERVAL_MS = 10000; // 10 seconds
const RESEND_COOLDOWN_SEC = 30;

function isVerifiedResponse(data: any): boolean {
    return (
        data?.verified === true ||
        data?.is_verified === true ||
        data?.email_verified === true
    );
}

export default function EmailVerificationPendingScreen() {
    const { email, phone } = useLocalSearchParams<{ email: string; phone?: string }>();
    const router = useRouter();
    const { pendingCredentials, clearPendingCredentials } = useAuth();

    const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SEC);
    const [resending, setResending] = useState(false);
    const [polling, setPolling] = useState(true);
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

    useEffect(() => {
        startCooldown();
        return () => {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, [startCooldown]);

    const checkVerified = useCallback(async () => {
        if (!email) return false;
        try {
            const data = await authService.checkEmailVerified(email);
            if (isVerifiedResponse(data)) {
                setPolling(false);
                if (phone) {
                    router.replace({
                        pathname: '/(auth)/phone-verify-otp',
                        params: { email, phone },
                    });
                } else {
                    clearPendingCredentials();
                    router.replace('/(auth)/login');
                }
                return true;
            }
        } catch (err: any) {
            if (err?.response?.status === 429) {
                // Rate limit – skip this poll, will retry next interval
            }
        }
        return false;
    }, [email, phone, clearPendingCredentials, router]);

    useEffect(() => {
        if (!email || !polling) return;

        const poll = async () => {
            const verified = await checkVerified();
            if (verified) setPolling(false);
        };

        poll();
        const id = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [email, polling, checkVerified]);

    const handleResend = async () => {
        if (!email || resendCooldown > 0 || resending) return;
        setResending(true);
        try {
            await authService.resendVerification(email);
            startCooldown();
            Alert.alert('Success', 'Verification email sent. Please check your inbox.');
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message;
            if (status === 404) {
                Alert.alert('Error', 'No account found for this email.');
            } else if (status === 400) {
                Alert.alert('Info', msg || 'Email is already verified.');
            } else {
                Alert.alert('Error', msg || 'Failed to resend verification email.');
            }
        } finally {
            setResending(false);
        }
    };

    const handleChangeEmail = () => {
        clearPendingCredentials();
        router.replace('/(auth)/register');
    };

    const handleGoToLogin = () => {
        clearPendingCredentials();
        router.replace('/(auth)/login');
    };

    if (!email) {
        router.replace('/(auth)/register');
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <Mail color={Colors.dark.primary} size={48} />
                </View>
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>
                    We sent a verification link to
                </Text>
                <Text style={styles.email}>{email}</Text>
                <Text style={styles.hint}>
                    Click the link to verify your email. Then verify your phone with the OTP sent via SMS.
                </Text>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.btn,
                            styles.btnPrimary,
                            (resendCooldown > 0 || resending) && styles.btnDisabled,
                        ]}
                        onPress={handleResend}
                        disabled={resendCooldown > 0 || resending}
                    >
                        {resending ? (
                            <ActivityIndicator color={Colors.dark.primaryForeground} size="small" />
                        ) : resendCooldown > 0 ? (
                            <Text style={styles.btnPrimaryText}>
                                Resend ({resendCooldown}s)
                            </Text>
                        ) : (
                            <Text style={styles.btnPrimaryText}>Resend email</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnSecondary]}
                        onPress={handleChangeEmail}
                        disabled={resendCooldown > 0}
                    >
                        <Text style={styles.btnSecondaryText}>Change email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnGhost]}
                        onPress={handleGoToLogin}
                    >
                        <Text style={styles.btnGhostText}>Go to Login</Text>
                    </TouchableOpacity>
                </View>
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
        marginBottom: 4,
        textAlign: 'center',
    },
    email: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    hint: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    actions: {
        width: '100%',
    },
    btn: {
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
    btnSecondary: {
        backgroundColor: Colors.dark.card,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    btnSecondaryText: {
        color: Colors.dark.text,
        fontSize: 16,
    },
    btnGhost: {
        backgroundColor: 'transparent',
    },
    btnGhostText: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
    },
    btnDisabled: {
        opacity: 0.6,
    },
});

import { KeyRound } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { premiumCardShadowSoft } from '../constants/appChrome';
import { Colors } from '../constants/Colors';
import { useDeliveryHandoffOtp } from '../hooks/useDeliveryHandoffOtp';

function formatMmSs(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

type Props = {
    orderId: string;
    /** When false, hook stays idle (e.g. order not OUT_FOR_DELIVERY). */
    visible: boolean;
    /** Compact layout for the live map bottom sheet */
    compact?: boolean;
};

export default function DeliveryHandoffOtpCard({ orderId, visible, compact }: Props) {
    const { state, secondsRemaining, refetch } = useDeliveryHandoffOtp(orderId, visible);

    if (!visible) {
        return null;
    }

    return (
        <View style={[styles.card, premiumCardShadowSoft, compact && styles.cardCompact]}>
            <View style={styles.headerRow}>
                <View style={styles.headerTitle}>
                    <KeyRound size={compact ? 18 : 20} color={Colors.dark.primary} />
                    <Text style={[styles.title, compact && styles.titleCompact]}>Driver at door</Text>
                </View>
            </View>
            <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
                Show this code to your delivery partner so they can complete handoff.
            </Text>

            {state.status === 'loading' ? (
                <View style={styles.loadingRow}>
                    <ActivityIndicator color={Colors.dark.primary} />
                    <Text style={styles.loadingText}>Loading code…</Text>
                </View>
            ) : null}

            {state.status === 'error' ? (
                <View style={styles.errorBlock}>
                    <Text style={styles.errorText}>{state.message}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={refetch} activeOpacity={0.7}>
                        <Text style={styles.retryBtnText}>Try again</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {state.status === 'ready' ? (
                <>
                    <Text style={[styles.otp, compact && styles.otpCompact]} selectable>
                        {state.otp}
                    </Text>
                    <Text style={styles.expiry}>
                        {secondsRemaining > 0
                            ? `Refreshes in ${formatMmSs(secondsRemaining)}`
                            : 'Refreshing code…'}
                    </Text>
                </>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.dark.cardElevated,
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    cardCompact: {
        marginBottom: 12,
        padding: 14,
        borderRadius: 16,
    },
    headerRow: {
        marginBottom: 8,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: -0.2,
    },
    titleCompact: {
        fontSize: 15,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        lineHeight: 20,
        marginBottom: 14,
    },
    subtitleCompact: {
        fontSize: 13,
        marginBottom: 10,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    errorBlock: {
        gap: 12,
    },
    errorText: {
        fontSize: 14,
        color: Colors.dark.danger,
        lineHeight: 20,
    },
    retryBtn: {
        alignSelf: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 999,
        backgroundColor: Colors.dark.primary,
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
    },
    retryBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.dark.primaryForeground,
    },
    otp: {
        fontSize: 40,
        fontWeight: '800',
        letterSpacing: 10,
        color: Colors.dark.text,
        fontVariant: ['tabular-nums'],
        marginBottom: 8,
    },
    otpCompact: {
        fontSize: 32,
        letterSpacing: 8,
    },
    expiry: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
});

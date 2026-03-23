import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { CreditCard, Minus, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { confirmPaymentWithRetry } from '../lib/paymentConfirmRetry';
import { isUserCancelledRazorpayError, isRazorpayNativeAvailable, openRazorpayCheckout } from '../lib/razorpayCheckout';
import {
    chargesService,
    getCachedPlatformCharges,
    isValidPlatformCharges,
    paymentService,
    type CreatePaymentOrderDto,
    type PlatformCharges,
} from '../services/api';

function scheduledDateFromOffsetDays(offsetDays: 1 | 2 | 3): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function paymentErrorMessage(err: unknown): string {
    if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        if (data?.message) return data.message;
        if (typeof data?.error === 'string') return data.error;
        if (err.response?.status === 400) {
            return 'Payment could not be verified. Your card may not have been charged — you can try again or contact support.';
        }
        if (err.message) return err.message;
    }
    if (err instanceof Error) return err.message;
    return 'Something went wrong. Please try again.';
}

export default function CartScreen() {
    const { user } = useAuth();
    const { cartItems, kitchenId, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
    const [submitting, setSubmitting] = useState(false);
    const [paymentPhase, setPaymentPhase] = useState<'idle' | 'initiate' | 'checkout' | 'confirm'>('idle');
    const [scheduleOffsetDays, setScheduleOffsetDays] = useState<1 | 2 | 3>(1);
    const pendingOrderDtoRef = useRef<CreatePaymentOrderDto | null>(null);
    const [charges, setCharges] = useState<PlatformCharges | null>(null);
    const [chargesUi, setChargesUi] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const fetchCharges = useCallback(async () => {
        if (cartItems.length === 0) return;
        const cached = getCachedPlatformCharges();
        const canUseStale = isValidPlatformCharges(cached);
        if (canUseStale) {
            setCharges(cached);
            setChargesUi('success');
        } else {
            setChargesUi('loading');
            setCharges(null);
        }
        try {
            const data = await chargesService.get();
            if (!isValidPlatformCharges(data)) {
                throw new Error('Invalid charges response');
            }
            setCharges(data);
            setChargesUi('success');
        } catch {
            if (canUseStale) {
                setCharges(cached);
                setChargesUi('success');
            } else {
                setCharges(null);
                setChargesUi('error');
            }
        }
    }, [cartItems.length]);

    useEffect(() => {
        if (cartItems.length === 0) {
            setCharges(null);
            setChargesUi('idle');
            return;
        }
        fetchCharges();
    }, [cartItems.length, fetchCharges]);

    const buildOrderDto = useCallback((): CreatePaymentOrderDto | null => {
        if (!kitchenId || cartItems.length === 0) return null;
        return {
            kitchen_id: kitchenId,
            scheduled_for: scheduledDateFromOffsetDays(scheduleOffsetDays),
            items: cartItems.map(({ item, quantity }) => ({
                food_item_id: item.id,
                quantity,
            })),
        };
    }, [kitchenId, cartItems, scheduleOffsetDays]);

    const handlePayWithRazorpay = async () => {
        if (!user) {
            Alert.alert('Sign in required', 'Please log in to complete payment.');
            return;
        }
        if (!kitchenId || cartItems.length === 0 || chargesUi !== 'success' || !charges) return;

        if (!isRazorpayNativeAvailable()) {
            Alert.alert(
                'Payment unavailable',
                'This preview (Expo Go) cannot open Razorpay. Install the release APK built with EAS (preview or production profile), not the development-client build.',
            );
            return;
        }

        const originalDto = buildOrderDto();
        if (!originalDto) return;

        const platformFee = Number(charges.platform_fees);
        const deliveryFee = Number(charges.delivery_fees);
        const orderTotalRupee = totalAmount + platformFee + deliveryFee;
        const fallbackAmountPaise = Math.round(orderTotalRupee * 100);

        setSubmitting(true);
        setPaymentPhase('initiate');
        pendingOrderDtoRef.current = originalDto;

        try {
            const initiated = await paymentService.initiate(originalDto);
            const amountPaise =
                initiated.amount !== undefined && Number.isFinite(initiated.amount)
                    ? Math.round(initiated.amount)
                    : fallbackAmountPaise;

            setPaymentPhase('checkout');
            const razorpayResult = await openRazorpayCheckout({
                key: initiated.publicKey,
                orderId: initiated.razorpayOrderId,
                amountPaise,
                description: `Order for ${originalDto.scheduled_for}`,
                prefill: {
                    email: user.email,
                    contact: user.phone_number,
                    name: user.name,
                },
                themeColor: Colors.dark.primary,
            });

            const dto = pendingOrderDtoRef.current;
            if (!dto) {
                throw new Error('Checkout session expired. Please try again.');
            }

            setPaymentPhase('confirm');
            const created = (await confirmPaymentWithRetry({
                razorpayOrderId: razorpayResult.razorpay_order_id,
                razorpayPaymentId: razorpayResult.razorpay_payment_id,
                razorpaySignature: razorpayResult.razorpay_signature,
                originalDto: dto,
            })) as { id?: string } | undefined;

            pendingOrderDtoRef.current = null;
            await clearCart();

            const rawId = created && typeof created === 'object' ? (created as { id?: string }).id : undefined;
            const orderId = typeof rawId === 'string' ? rawId : null;
            Alert.alert(
                'Payment successful',
                'Your order is confirmed.',
                orderId
                    ? [
                          { text: 'View order', onPress: () => router.replace(`/order/${orderId}`) },
                          { text: 'All orders', onPress: () => router.replace('/(tabs)/orders') },
                      ]
                    : [{ text: 'View orders', onPress: () => router.replace('/(tabs)/orders') }],
            );
        } catch (error: unknown) {
            console.error(error);
            if (isUserCancelledRazorpayError(error)) {
                // User closed checkout — no alert noise
            } else {
                const msg = paymentErrorMessage(error);
                Alert.alert('Payment', msg, [
                    { text: 'OK', style: 'cancel' },
                    {
                        text: 'Contact support',
                        onPress: () => router.push('/(tabs)/profile'),
                    },
                ]);
            }
        } finally {
            setPaymentPhase('idle');
            setSubmitting(false);
        }
    };

    const renderCartItem = ({ item }: { item: { item: any, quantity: number } }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item.name}</Text>
                <Text style={styles.itemPrice}>₹{Number(item.item.price).toFixed(2)}</Text>
            </View>

            <View style={styles.quantityContainer}>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.item.id, item.quantity - 1)}
                >
                    <Minus size={16} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.item.id, item.quantity + 1)}
                >
                    <Plus size={16} color={Colors.dark.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.totalContainer}>
                <Text style={styles.itemTotal}>₹{(Number(item.item.price) * item.quantity).toFixed(2)}</Text>
                <TouchableOpacity
                    onPress={() => removeFromCart(item.item.id)}
                    style={styles.removeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Trash2 color={Colors.dark.danger} size={18} strokeWidth={2} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (cartItems.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Your cart is empty</Text>
                <TouchableOpacity
                    style={styles.browsingButton}
                    onPress={() => router.back()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.browsingButtonText}>Start Browsing</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const platformFee = charges ? Number(charges.platform_fees) : NaN;
    const deliveryFee = charges ? Number(charges.delivery_fees) : NaN;
    const feesReady = chargesUi === 'success' && charges && Number.isFinite(platformFee) && Number.isFinite(deliveryFee);
    const orderTotal = feesReady ? totalAmount + platformFee + deliveryFee : NaN;

    const feeValueContent = (amount: number) => {
        if (chargesUi === 'loading' && !charges) {
            return <ActivityIndicator size="small" color={Colors.dark.textSecondary} />;
        }
        if (chargesUi === 'error' || !Number.isFinite(amount)) {
            return <Text style={styles.feeValueMuted}>—</Text>;
        }
        return <Text style={styles.feeValue}>₹{amount.toFixed(2)}</Text>;
    };

    const footer = (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Subtotal</Text>
                <Text style={styles.feeValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Platform fee</Text>
                {feeValueContent(platformFee)}
            </View>
            <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Delivery fee</Text>
                {feeValueContent(deliveryFee)}
            </View>
            <View style={[styles.totalRow, styles.totalRowBorder]}>
                <Text style={styles.totalLabel}>Total</Text>
                {feesReady ? (
                    <Text style={styles.totalAmount}>₹{orderTotal.toFixed(2)}</Text>
                ) : chargesUi === 'loading' && !charges ? (
                    <ActivityIndicator size="small" color={Colors.dark.primary} />
                ) : (
                    <Text style={styles.totalAmountMuted}>—</Text>
                )}
            </View>
            {chargesUi === 'error' && (
                <View style={styles.chargesErrorBox}>
                    <Text style={styles.chargesErrorText}>Could not load fees. Check your connection and try again.</Text>
                    <TouchableOpacity onPress={fetchCharges} style={styles.retryButton} activeOpacity={0.85}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}
            <Text style={styles.scheduleLabel}>Delivery date</Text>
            <View style={styles.scheduleRow}>
                {([1, 2, 3] as const).map((d) => {
                    const label =
                        d === 1 ? 'Tomorrow' : d === 2 ? 'In 2 days' : 'In 3 days';
                    const selected = scheduleOffsetDays === d;
                    return (
                        <TouchableOpacity
                            key={d}
                            style={[styles.scheduleChip, selected && styles.scheduleChipSelected]}
                            onPress={() => setScheduleOffsetDays(d)}
                            disabled={submitting}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.scheduleChipText, selected && styles.scheduleChipTextSelected]}>
                                {label}
                            </Text>
                            <Text style={[styles.scheduleChipSub, selected && styles.scheduleChipSubSelected]}>
                                {scheduledDateFromOffsetDays(d)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <TouchableOpacity
                style={[
                    styles.checkoutButton,
                    (submitting || !feesReady) && styles.checkoutButtonDisabled,
                ]}
                onPress={handlePayWithRazorpay}
                disabled={submitting || !feesReady}
                activeOpacity={0.85}
            >
                {submitting ? (
                    <View style={styles.checkoutLoadingRow}>
                        <ActivityIndicator color={Colors.dark.primaryForeground} />
                        <Text style={styles.checkoutLoadingText}>
                            {paymentPhase === 'initiate'
                                ? 'Starting payment…'
                                : paymentPhase === 'confirm'
                                  ? 'Confirming order…'
                                  : paymentPhase === 'checkout'
                                    ? 'Opening checkout…'
                                    : 'Please wait…'}
                        </Text>
                    </View>
                ) : (
                    <>
                        <CreditCard color={Colors.dark.primaryForeground} size={20} style={styles.checkoutIcon} />
                        <Text style={styles.checkoutText}>Pay with Razorpay</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: 200 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Order Summary</Text>
                        <TouchableOpacity onPress={clearCart} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <Text style={styles.clearText}>Clear Cart</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
            <View style={styles.footerWrapper}>{footer}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
    emptyText: {
        color: Colors.dark.textSecondary,
        fontSize: 18,
        marginBottom: 20,
    },
    browsingButton: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    browsingButtonText: {
        color: Colors.dark.primaryForeground,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    itemPrice: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
        backgroundColor: Colors.dark.background,
        borderRadius: 8,
        padding: 4,
    },
    quantityButton: {
        padding: 4,
    },
    quantityText: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: 'bold',
        marginHorizontal: 8,
        minWidth: 20,
        textAlign: 'center',
    },
    totalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    removeButton: {
        padding: 4,
    },
    clearText: {
        color: Colors.dark.danger,
        fontSize: 14,
        fontWeight: '500',
    },
    footerWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.dark.card,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    feeLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    feeValue: {
        fontSize: 14,
        color: Colors.dark.text,
    },
    feeValueMuted: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    totalAmountMuted: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.textSecondary,
    },
    chargesErrorBox: {
        marginBottom: 12,
        padding: 12,
        borderRadius: 10,
        backgroundColor: Colors.dark.background,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    chargesErrorText: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginBottom: 10,
        lineHeight: 18,
    },
    retryButton: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: Colors.dark.primary,
    },
    retryButtonText: {
        color: Colors.dark.primaryForeground,
        fontSize: 14,
        fontWeight: '600',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalRowBorder: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textSecondary,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.primary,
    },
    checkoutButton: {
        backgroundColor: Colors.dark.primary,
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkoutButtonDisabled: {
        opacity: 0.45,
    },
    checkoutIcon: {
        marginRight: 10,
    },
    checkoutText: {
        color: Colors.dark.primaryForeground,
        fontSize: 18,
        fontWeight: 'bold',
    },
    checkoutLoadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkoutLoadingText: {
        color: Colors.dark.primaryForeground,
        fontSize: 15,
        fontWeight: '600',
    },
    scheduleLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        marginBottom: 8,
    },
    scheduleRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    scheduleChip: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        backgroundColor: Colors.dark.background,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    scheduleChipSelected: {
        borderColor: Colors.dark.primary,
        backgroundColor: Colors.dark.card,
    },
    scheduleChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        textAlign: 'center',
    },
    scheduleChipTextSelected: {
        color: Colors.dark.primary,
    },
    scheduleChipSub: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },
    scheduleChipSubSelected: {
        color: Colors.dark.text,
    },
});

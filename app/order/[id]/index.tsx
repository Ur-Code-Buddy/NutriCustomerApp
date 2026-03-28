import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Phone } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeliveryTrackingCard from '../../../components/DeliveryTrackingCard';
import { premiumCardShadowSoft, SCREEN_PADDING_H } from '../../../constants/appChrome';
import { Colors } from '../../../constants/Colors';
import { orderService } from '../../../services/api';

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    READY: 'Ready for pickup',
    PICKED_UP: 'Picked up',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: Colors.dark.primary,
    ACCEPTED: Colors.dark.success,
    REJECTED: Colors.dark.danger,
    READY: Colors.dark.success,
    PICKED_UP: Colors.dark.success,
    OUT_FOR_DELIVERY: Colors.dark.success,
    DELIVERED: Colors.dark.success,
};

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const data = await orderService.getById(id);
                setOrder(data);
            } catch (e) {
                Alert.alert('Error', 'Could not load order');
                router.back();
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const openCall = (phone: string) => {
        const num = String(phone || '').replace(/[^\d+]/g, '');
        if (!num) return;
        const url = num.startsWith('+') ? `tel:${num}` : `tel:+91${num}`;
        Linking.openURL(url).catch(() => Alert.alert('Unable to call', `Dial ${phone} manually.`));
    };

    const openMaps = (address: string) => {
        const query = encodeURIComponent(address);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() =>
            Alert.alert('Unable to open', 'Could not open maps.')
        );
    };

    if (loading || !order) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    const status = (order.status || '').toUpperCase();
    const statusColor = STATUS_COLORS[status] ?? Colors.dark.textSecondary;
    const itemsSubtotal = order.items?.reduce((s: number, o: any) =>
        s + Number(o.snapshot_price || 0) * (o.quantity || 0), 0) ?? 0;
    const parseOptionalMoney = (v: unknown): number | null => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };
    const platformFee = parseOptionalMoney(order.platform_fees);
    const deliveryFee = parseOptionalMoney(order.delivery_fees);
    const totalFromOrder = Number(order.total_price);
    let totalPrice: number | null = null;
    if (Number.isFinite(totalFromOrder)) {
        totalPrice = totalFromOrder;
    } else if (platformFee !== null && deliveryFee !== null) {
        totalPrice = itemsSubtotal + platformFee + deliveryFee;
    }
    const formatMoney = (n: number | null) => (n !== null ? `₹${n.toFixed(2)}` : '—');
    const itemName = (o: any) => o.name ?? o.food_item?.name ?? 'Item';
    const kitchen = order.kitchen || {};
    const driver = order.delivery_driver;

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
                    <ChevronLeft size={28} color={Colors.dark.text} strokeWidth={2} />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerEyebrow}>Order</Text>
                    <Text style={styles.headerTitle}>Details</Text>
                </View>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, premiumCardShadowSoft]}>
                    <View style={styles.statusRow}>
                        <Text style={styles.kitchenName}>{kitchen.name || 'Kitchen'}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[status] || status}</Text>
                        </View>
                    </View>
                    <Text style={styles.date}>Ordered: {new Date(order.created_at).toLocaleDateString()}</Text>
                    {order.scheduled_for && (
                        <Text style={styles.date}>Scheduled: {order.scheduled_for}</Text>
                    )}
                </View>

                {kitchen.name && (
                    <View style={[styles.card, premiumCardShadowSoft]}>
                        <Text style={styles.sectionTitle}>Kitchen</Text>
                        <Text style={styles.sectionValue}>{kitchen.name}</Text>
                        {kitchen.phone && (
                            <TouchableOpacity style={styles.actionRow} onPress={() => openCall(kitchen.phone)}>
                                <Phone size={18} color={Colors.dark.primary} />
                                <Text style={styles.actionText}>{kitchen.phone}</Text>
                                <Text style={styles.actionLabel}>Call</Text>
                            </TouchableOpacity>
                        )}
                        {kitchen.address && (
                            <TouchableOpacity style={styles.actionRow} onPress={() => openMaps(kitchen.address)}>
                                <MapPin size={18} color={Colors.dark.primary} />
                                <Text style={styles.actionText} numberOfLines={2}>{kitchen.address}</Text>
                                <Text style={styles.actionLabel}>Directions</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {(status === 'PICKED_UP' || status === 'OUT_FOR_DELIVERY') && driver && (
                    <View style={[styles.card, premiumCardShadowSoft]}>
                        <Text style={styles.sectionTitle}>Delivery driver</Text>
                        <Text style={styles.sectionValue}>{driver.name}</Text>
                        <TouchableOpacity style={styles.callDriverBtn} onPress={() => openCall(driver.phone_number)}>
                            <Phone size={18} color={Colors.dark.primaryForeground} />
                            <Text style={styles.callDriverText}>Call driver</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {(status === 'PICKED_UP' || status === 'OUT_FOR_DELIVERY') && (
                    <DeliveryTrackingCard orderId={String(id)} status={status} />
                )}

                <View style={[styles.card, premiumCardShadowSoft]}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {order.items?.map((oi: any, i: number) => (
                        <View key={i} style={styles.itemRow}>
                            {oi.image_url ? (
                                <Image source={{ uri: oi.image_url }} style={styles.itemImage} />
                            ) : (
                                <View style={[styles.itemImage, styles.itemImagePlaceholder]} />
                            )}
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{oi.quantity}x {itemName(oi)}</Text>
                                <Text style={styles.itemPrice}>₹{(Number(oi.snapshot_price) * oi.quantity).toFixed(2)}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={[styles.card, premiumCardShadowSoft]}>
                    <Text style={styles.sectionTitle}>Fees</Text>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Items subtotal</Text>
                        <Text style={styles.feeValue}>₹{itemsSubtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Platform fee</Text>
                        <Text style={styles.feeValue}>{formatMoney(platformFee)}</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Delivery fee</Text>
                        <Text style={styles.feeValue}>{formatMoney(deliveryFee)}</Text>
                    </View>
                    <View style={[styles.feeRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatMoney(totalPrice)}</Text>
                    </View>
                </View>
            </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SCREEN_PADDING_H,
        paddingBottom: 14,
    },
    headerTitles: {
        alignItems: 'center',
    },
    headerEyebrow: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.dark.primary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: -0.4,
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: SCREEN_PADDING_H,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: Colors.dark.cardElevated,
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    kitchenName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    date: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.dark.textSecondary,
        marginBottom: 10,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    sectionValue: {
        fontSize: 16,
        color: Colors.dark.text,
        marginBottom: 8,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    actionText: {
        flex: 1,
        fontSize: 15,
        color: Colors.dark.text,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.primary,
    },
    callDriverBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 999,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
    },
    callDriverText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.primaryForeground,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    itemImage: {
        width: 52,
        height: 52,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: Colors.dark.border,
    },
    itemImagePlaceholder: {
        backgroundColor: Colors.dark.border,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    itemPrice: {
        fontSize: 14,
        color: Colors.dark.primary,
        marginTop: 2,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    feeLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    feeValue: {
        fontSize: 14,
        color: Colors.dark.text,
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.primary,
    },
});

import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { premiumCardShadowSoft, SCREEN_PADDING_H } from '../../constants/appChrome';
import { Colors } from '../../constants/Colors';
import { useTabBarScrollProps } from '../../context/TabBarScrollContext';
import { useTabBarContentPadding } from '../../hooks/useTabBarContentPadding';
import { orderService } from '../../services/api';

export default function OrdersScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tabBarScrollProps = useTabBarScrollProps();
    const tabBarPadBottom = useTabBarContentPadding();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const data = await orderService.getMyOrders();
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACCEPTED':
            case 'READY':
            case 'PICKED_UP':
            case 'OUT_FOR_DELIVERY':
            case 'DELIVERED':
                return Colors.dark.success;
            case 'PENDING':
                return Colors.dark.primary;
            case 'REJECTED':
                return Colors.dark.danger;
            default:
                return Colors.dark.textSecondary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return 'Pending';
            case 'ACCEPTED': return 'Accepted';
            case 'REJECTED': return 'Rejected';
            case 'READY': return 'Ready for pickup';
            case 'PICKED_UP': return 'Picked up';
            case 'OUT_FOR_DELIVERY': return 'Out for delivery';
            case 'DELIVERED': return 'Delivered';
            default: return status || 'Unknown';
        }
    };

    const formatDate = (d: string | undefined) => {
        if (!d) return '';
        const date = new Date(d);
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
    };

    const renderOrderItem = ({ item }: { item: any }) => {
        const totalPrice = Number(item.total_price) ?? 0;
        const itemCount = item.items?.reduce((sum: number, o: any) => sum + (o.quantity || 0), 0) ?? 0;

        const stripeColor = getStatusColor(item.status);

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    premiumCardShadowSoft,
                    { borderLeftWidth: 4, borderLeftColor: stripeColor },
                ]}
                onPress={() => router.push(`/order/${item.id}`)}
                activeOpacity={0.9}
            >
                <View style={styles.cardTop}>
                    <View style={styles.cardTopText}>
                        <Text style={styles.kitchenName} numberOfLines={1}>
                            {item.kitchen?.name || 'Unknown Kitchen'}
                        </Text>
                        <Text style={styles.orderHint}>Tap for details</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: stripeColor + '22' }]}>
                        <Text style={[styles.statusText, { color: stripeColor }]}>{getStatusLabel(item.status)}</Text>
                    </View>
                </View>

                <View style={styles.dateRow}>
                    {item.scheduled_for && (
                        <Text style={styles.date}>Scheduled: {item.scheduled_for}</Text>
                    )}
                    {formatDate(item.created_at) && (
                        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                    )}
                </View>

                {item.status?.toUpperCase() === 'OUT_FOR_DELIVERY' && item.delivery_driver && (
                    <View style={styles.driverSection}>
                        <Text style={styles.driverLabel}>Driver: {item.delivery_driver.name}</Text>
                        <TouchableOpacity
                            style={styles.callDriverBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                const num = String(item.delivery_driver.phone_number || '').replace(/[^\d+]/g, '');
                                if (!num) return;
                                const url = num.startsWith('+') ? `tel:${num}` : `tel:+91${num}`;
                                Linking.openURL(url).catch(() =>
                                    Alert.alert('Unable to call', `Dial ${item.delivery_driver.phone_number} manually.`)
                                );
                            }}
                        >
                            <Text style={styles.callDriverText}>Call driver</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.footer}>
                    <Text style={styles.itemCount}>
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </Text>
                    <View style={styles.footerRight}>
                        <Text style={styles.totalAmount}>₹{totalPrice.toFixed(2)}</Text>
                        <ChevronRight size={18} color={Colors.dark.muted} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
                <Text style={styles.headerEyebrow}>Your activity</Text>
                <Text style={styles.screenTitle}>My orders</Text>
                <Text style={styles.screenSubtitle}>Track status and reach your driver anytime</Text>
            </View>
            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: tabBarPadBottom }]}
                {...tabBarScrollProps}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No orders yet</Text>
                        <Text style={styles.emptyText}>When you place an order, it will show up here.</Text>
                    </View>
                }
            />
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
    headerBar: {
        paddingHorizontal: SCREEN_PADDING_H,
        marginBottom: 18,
    },
    headerEyebrow: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.dark.primary,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: -0.8,
    },
    screenSubtitle: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        marginTop: 8,
        lineHeight: 22,
    },
    listContent: {
        paddingHorizontal: SCREEN_PADDING_H,
        paddingTop: 0,
    },
    card: {
        backgroundColor: Colors.dark.cardElevated,
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 12,
    },
    cardTopText: {
        flex: 1,
    },
    orderHint: {
        fontSize: 12,
        color: Colors.dark.muted,
        marginTop: 4,
    },
    kitchenName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
        letterSpacing: -0.3,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    driverSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(48, 209, 88, 0.1)',
        padding: 12,
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(48, 209, 88, 0.28)',
    },
    driverLabel: {
        fontSize: 14,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    callDriverBtn: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 999,
    },
    callDriverText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.primaryForeground,
    },
    date: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    itemCount: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.dark.primary,
        letterSpacing: -0.3,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyTitle: {
        color: Colors.dark.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptyText: {
        color: Colors.dark.textSecondary,
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
});

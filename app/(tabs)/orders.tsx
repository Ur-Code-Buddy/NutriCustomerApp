import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { orderService } from '../../services/api';

export default function OrdersScreen() {
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

    const renderOrderItem = ({ item }: { item: any }) => {
        const itemsSubtotal = item.items?.reduce((sum: number, o: any) =>
            sum + Number(o.snapshot_price || 0) * (o.quantity || 0), 0) ?? 0;
        const platformFee = Number(item.platform_fees) ?? 10;
        const deliveryFee = Number(item.delivery_fees) ?? 20;
        const totalPrice = Number(item.total_price) ?? itemsSubtotal + platformFee + deliveryFee;
        const itemName = (o: any) => o.name ?? o.food_item?.name ?? 'Item';

        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.kitchenName}>{item.kitchen?.name || 'Unknown Kitchen'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                    </View>
                </View>

                <View style={styles.dateRow}>
                    <Text style={styles.date}>Ordered: {new Date(item.created_at).toLocaleDateString()}</Text>
                    {item.scheduled_for && (
                        <Text style={styles.date}>Scheduled: {item.scheduled_for}</Text>
                    )}
                </View>

                {item.status?.toUpperCase() === 'OUT_FOR_DELIVERY' && item.delivery_driver && (
                    <View style={styles.driverSection}>
                        <Text style={styles.driverLabel}>Driver: {item.delivery_driver.name}</Text>
                        <TouchableOpacity
                            style={styles.callDriverBtn}
                            onPress={() => {
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

                <View style={styles.itemsContainer}>
                    {item.items?.map((orderItem: any, index: number) => (
                        <View key={index} style={styles.orderItemRow}>
                            <Text style={styles.itemName}>{orderItem.quantity}x {itemName(orderItem)}</Text>
                            <Text style={styles.itemPrice}>₹{(Number(orderItem.snapshot_price) * orderItem.quantity).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.feeSection}>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Items subtotal</Text>
                        <Text style={styles.feeValue}>₹{itemsSubtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Platform fee</Text>
                        <Text style={styles.feeValue}>₹{platformFee}</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Delivery fee</Text>
                        <Text style={styles.feeValue}>₹{deliveryFee}</Text>
                    </View>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>₹{totalPrice.toFixed(2)}</Text>
                </View>
            </View>
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
            <View style={styles.headerBar}>
                <Text style={styles.screenTitle}>My Orders</Text>
            </View>
            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
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
        paddingTop: 60,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
    headerBar: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 0,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    kitchenName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    driverSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(48, 209, 88, 0.12)',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(48, 209, 88, 0.3)',
    },
    driverLabel: {
        fontSize: 14,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    callDriverBtn: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
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
    itemsContainer: {
        marginBottom: 12,
    },
    orderItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemName: {
        color: Colors.dark.text,
        fontSize: 14,
    },
    itemPrice: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginBottom: 12,
    },
    feeSection: {
        marginBottom: 8,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    feeLabel: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
    },
    feeValue: {
        fontSize: 13,
        color: Colors.dark.text,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark.textSecondary,
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.primary,
    },
    emptyContainer: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.dark.textSecondary,
        fontSize: 16,
    },
});

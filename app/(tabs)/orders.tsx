import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
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
        switch (status.toLowerCase()) {
            case 'completed':
            case 'accepted':
                return Colors.dark.success;
            case 'pending': return '#eab308'; // Yellow
            case 'rejected': return Colors.dark.danger;
            default: return Colors.dark.textSecondary;
        }
    };

    const renderOrderItem = ({ item }: { item: any }) => {
        const totalAmount = item.items?.reduce((sum: number, orderItem: any) => {
            return sum + (Number(orderItem.snapshot_price) * orderItem.quantity);
        }, 0) || 0;

        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.kitchenName}>{item.kitchen?.name || 'Unknown Kitchen'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.dateRow}>
                    <Text style={styles.date}>Ordered: {new Date(item.created_at).toLocaleDateString()}</Text>
                    {item.scheduled_for && (
                        <Text style={styles.date}>Scheduled: {item.scheduled_for}</Text>
                    )}
                </View>

                <View style={styles.itemsContainer}>
                    {item.items?.map((orderItem: any, index: number) => (
                        <View key={index} style={styles.orderItemRow}>
                            <Text style={styles.itemName}>{orderItem.quantity}x {orderItem.food_item?.name || 'Item'}</Text>
                            <Text style={styles.itemPrice}>${(Number(orderItem.snapshot_price) * orderItem.quantity).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
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
            <Text style={styles.screenTitle}>My Orders</Text>
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
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.dark.text,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    card: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
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

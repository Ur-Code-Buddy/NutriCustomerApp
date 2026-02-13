import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { CreditCard, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { kitchenService, orderService } from '../services/api';

export default function CartScreen() {
    const [cartTitle, setCartTitle] = useState('My Order');
    const [kitchenId, setKitchenId] = useState<string | null>(null);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [cartItems, setCartItems] = useState<{ item: any, quantity: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            const kId = await SecureStore.getItemAsync('cart_kitchen_id');
            const savedCart = await SecureStore.getItemAsync('cart');
            setKitchenId(kId);

            if (kId && savedCart) {
                const cartCounts = JSON.parse(savedCart);
                const menuData = await kitchenService.getMenu(kId);
                setMenuItems(menuData);

                const items = [];
                for (const [itemId, quantity] of Object.entries(cartCounts)) {
                    const item = menuData.find((m: any) => m.id === itemId);
                    if (item) {
                        items.push({ item, quantity: Number(quantity) });
                    }
                }
                setCartItems(items);
            }
        } catch (error) {
            console.error('Failed to load cart', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, { item, quantity }) => total + (Number(item.price) * quantity), 0);
    };

    const handlePlaceOrder = async () => {
        if (!kitchenId || cartItems.length === 0) return;

        setSubmitting(true);
        try {
            const orderPayload = {
                kitchen_id: kitchenId,
                items: cartItems.map(({ item, quantity }) => ({
                    food_item_id: item.id,
                    quantity
                }))
            };

            await orderService.create(orderPayload);

            await SecureStore.deleteItemAsync('cart');
            await SecureStore.deleteItemAsync('cart_kitchen_id');

            Alert.alert('Success', 'Order placed successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/orders') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClearCart = async () => {
        await SecureStore.deleteItemAsync('cart');
        await SecureStore.deleteItemAsync('cart_kitchen_id');
        setCartItems([]);
        setKitchenId(null);
    };

    const renderCartItem = ({ item }: { item: { item: any, quantity: number } }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item.name}</Text>
                <Text style={styles.itemPrice}>${Number(item.item.price).toFixed(2)} x {item.quantity}</Text>
            </View>
            <Text style={styles.itemTotal}>${(Number(item.item.price) * item.quantity).toFixed(2)}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    if (cartItems.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Your cart is empty.</Text>
                <TouchableOpacity style={styles.browsingButton} onPress={() => router.back()}>
                    <Text style={styles.browsingButtonText}>Start Browsing</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Order Summary</Text>
                        <TouchableOpacity onPress={handleClearCart}>
                            <Trash2 color={Colors.dark.danger} size={20} />
                        </TouchableOpacity>
                    </View>
                }
            />

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
                </View>

                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={handlePlaceOrder}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <CreditCard color="white" size={20} style={{ marginRight: 8 }} />
                            <Text style={styles.checkoutText}>Place Order</Text>
                        </>
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
        color: 'white',
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
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
        marginTop: 2,
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
        backgroundColor: Colors.dark.card,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
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
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkoutText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

import { useRouter } from 'expo-router';
import { CreditCard, Minus, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/api';

export default function CartScreen() {
    const { cartItems, kitchenId, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

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
            await clearCart();

            Alert.alert('Success', 'Order placed successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Dismiss the modal first, then navigate to the existing tab
                        // preventing stack replacement issues that might cause app close/crash
                        if (router.canDismiss()) {
                            router.dismiss();
                        }
                        router.navigate('/(tabs)/orders');
                    }
                }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    const renderCartItem = ({ item }: { item: { item: any, quantity: number } }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item.name}</Text>
                <Text style={styles.itemPrice}>${Number(item.item.price).toFixed(2)}</Text>
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
                <Text style={styles.itemTotal}>${(Number(item.item.price) * item.quantity).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.item.id)} style={styles.removeButton}>
                    <Trash2 color={Colors.dark.danger} size={20} />
                </TouchableOpacity>
            </View>
        </View>
    );

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
                        <TouchableOpacity onPress={clearCart}>
                            <Text style={styles.clearText}>Clear Cart</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
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
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
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
        alignItems: 'flex-end',
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    removeButton: {
        padding: 4,
    },
    clearText: {
        color: Colors.dark.danger,
        fontSize: 14,
        fontWeight: '500',
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

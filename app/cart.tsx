import { useRouter } from 'expo-router';
import { CreditCard, Minus, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/api';

export default function CartScreen() {
    const { cartItems, kitchenId, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handlePlaceOrder = async () => {
        if (!kitchenId || cartItems.length === 0) return;

        setSubmitting(true);
        try {
            // Calculate tomorrow's date as YYYY-MM-DD
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const scheduledFor = tomorrow.toISOString().split('T')[0];

            const orderPayload = {
                kitchen_id: kitchenId,
                scheduled_for: scheduledFor,
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
                        // Use replace to prevent stacking issues
                        router.replace('/(tabs)/orders');
                    }
                }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
        } finally {
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

    const platformFee = 10;
    const deliveryFee = 20;
    const orderTotal = totalAmount + platformFee + deliveryFee;

    const footer = (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Subtotal</Text>
                <Text style={styles.feeValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Platform fee</Text>
                <Text style={styles.feeValue}>₹{platformFee}</Text>
            </View>
            <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Delivery fee</Text>
                <Text style={styles.feeValue}>₹{deliveryFee}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowBorder]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹{orderTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
                style={[styles.checkoutButton, submitting && styles.checkoutButtonDisabled]}
                onPress={handlePlaceOrder}
                disabled={submitting}
                activeOpacity={0.85}
            >
                {submitting ? (
                    <ActivityIndicator color={Colors.dark.primaryForeground} />
                ) : (
                    <>
                        <CreditCard color={Colors.dark.primaryForeground} size={20} style={styles.checkoutIcon} />
                        <Text style={styles.checkoutText}>Place Order</Text>
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
        opacity: 0.8,
    },
    checkoutIcon: {
        marginRight: 10,
    },
    checkoutText: {
        color: Colors.dark.primaryForeground,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

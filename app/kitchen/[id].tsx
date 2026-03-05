import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Clock, MapPin, Phone, Plus, ShoppingCart } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useCart } from '../../context/CartContext';
import { kitchenService } from '../../services/api';

export default function KitchenDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [kitchen, setKitchen] = useState<any>(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    // const [cart, setCart] = useState<{ [key: string]: number }>({}); // Removed local cart
    const { addToCart, count, cartItems, updateQuantity } = useCart(); // Use global cart
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kitchenData, menuData] = await Promise.all([
                    kitchenService.getById(id as string),
                    kitchenService.getMenu(id as string)
                ]);
                setKitchen(kitchenData);
                setMenuItems(menuData);
            } catch (error) {
                console.error('Failed to fetch kitchen details', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleAddToCart = async (item: any) => {
        await addToCart(item, 1, id as string);
    };

    const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const DAY_LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

    const getOperatingHoursList = (hours: Record<string, { open?: string; close?: string }> | undefined) => {
        if (!hours) return [];
        return DAY_ORDER
            .filter((day) => hours[day]?.open && hours[day]?.close)
            .map((day) => ({ day: DAY_LABELS[day], time: `${hours[day].open}–${hours[day].close}` }));
    };

    const getHoursSummary = (list: { day: string; time: string }[]) => {
        if (list.length === 0) return '';
        const times = [...new Set(list.map((x) => x.time))];
        if (times.length === 1) return `Mon–Sun: ${times[0]}`;
        return `${list[0].day}–${list[list.length - 1].day}: varies`;
    };

    const getQuantity = (itemId: string) => {
        const cartItem = cartItems.find((ci) => ci.item.id === itemId);
        return cartItem ? cartItem.quantity : 0;
    };

    const renderMenuItem = ({ item }: { item: any }) => {
        const qty = getQuantity(item.id);

        return (
            <View style={styles.menuItem}>
                <Image source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} style={styles.menuImage} />
                <View style={styles.menuContent}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{item.price}</Text>
                        {qty > 0 ? (
                            <View style={styles.quantityContainer}>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => updateQuantity(item.id, qty - 1)}
                                >
                                    <View style={styles.iconButton}>
                                        <Text style={styles.iconButtonText}>-</Text>
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.quantityText}>{qty}</Text>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => updateQuantity(item.id, qty + 1)}
                                >
                                    <View style={styles.iconButton}>
                                        <Text style={styles.iconButtonText}>+</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
                                <Plus size={16} color={Colors.dark.primaryForeground} />
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        )}
                    </View>
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
            {kitchen && (
                <View style={styles.header}>
                    <Text style={styles.title}>{kitchen.name}</Text>
                    {(kitchen.details?.description || kitchen.description) && (
                        <Text style={styles.subtitle}>{kitchen.details?.description || kitchen.description}</Text>
                    )}

                    {(kitchen.details?.phone || kitchen.details?.address || getOperatingHoursList(kitchen.operating_hours).length > 0) && (
                        <View style={styles.detailsSection}>
                            <TouchableOpacity
                                style={styles.detailsHeader}
                                onPress={() => setDetailsExpanded((v) => !v)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.detailsTitle}>Kitchen details</Text>
                                {!detailsExpanded && getOperatingHoursList(kitchen.operating_hours).length > 0 && (
                                    <Text style={styles.detailsSummary} numberOfLines={1}>
                                        {getHoursSummary(getOperatingHoursList(kitchen.operating_hours))}
                                    </Text>
                                )}
                                {detailsExpanded ? (
                                    <ChevronUp size={22} color={Colors.dark.textSecondary} />
                                ) : (
                                    <ChevronDown size={22} color={Colors.dark.textSecondary} />
                                )}
                            </TouchableOpacity>
                            {detailsExpanded && (
                                <View style={styles.detailsContent}>
                                    {kitchen.details?.phone && (
                                        <TouchableOpacity
                                            style={styles.contactRow}
                                            onPress={() => {
                                                const raw = String(kitchen.details.phone);
                                                const num = raw.replace(/[^\d+]/g, '');
                                                if (!num) return;
                                                const url = num.startsWith('+') ? `tel:${num}` : `tel:+91${num}`;
                                                Linking.openURL(url).catch(() =>
                                                    Alert.alert('Unable to call', `Dial ${raw} manually.`)
                                                );
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.contactIcon}>
                                                <Phone size={18} color={Colors.dark.primary} />
                                            </View>
                                            <Text style={styles.contactValue}>{kitchen.details.phone}</Text>
                                            <View style={styles.callBadge}>
                                                <Text style={styles.callBadgeText}>Call</Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                    {kitchen.details?.address && (
                                        <View style={styles.contactRow}>
                                            <View style={styles.contactIcon}>
                                                <MapPin size={18} color={Colors.dark.primary} />
                                            </View>
                                            <Text style={styles.contactValue} numberOfLines={2}>{kitchen.details.address}</Text>
                                        </View>
                                    )}
                                    {getOperatingHoursList(kitchen.operating_hours).length > 0 && (
                                        <View style={styles.hoursBlock}>
                                            <View style={styles.hoursHeader}>
                                                <Clock size={18} color={Colors.dark.primary} />
                                                <Text style={styles.hoursTitle}>Hours</Text>
                                            </View>
                                            <View style={styles.hoursGrid}>
                                                {getOperatingHoursList(kitchen.operating_hours).map(({ day, time }) => (
                                                    <View key={day} style={styles.hoursRow}>
                                                        <Text style={styles.hoursDay}>{day}</Text>
                                                        <Text style={styles.hoursTime}>{time}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            )}

            <FlatList
                data={menuItems}
                renderItem={renderMenuItem}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.listContent}
            />

            {count > 0 && (
                <View style={styles.floatingCartContainer}>
                    <TouchableOpacity style={styles.floatingCart} onPress={() => router.push('/cart')}>
                        <View style={styles.cartInfo}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{count}</Text>
                            </View>
                            <Text style={styles.viewCartText}>View Cart</Text>
                        </View>
                        <ShoppingCart color="white" size={24} />
                    </TouchableOpacity>
                </View>
            )}
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
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        backgroundColor: Colors.dark.card,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.dark.text,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        marginTop: 6,
        lineHeight: 22,
    },
    detailsSection: {
        marginTop: 20,
        backgroundColor: Colors.dark.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        overflow: 'hidden',
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        gap: 12,
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    detailsSummary: {
        flex: 1,
        fontSize: 13,
        color: Colors.dark.textSecondary,
    },
    detailsContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.dark.card,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    contactIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactValue: {
        flex: 1,
        fontSize: 15,
        color: Colors.dark.text,
    },
    callBadge: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    callBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.primaryForeground,
    },
    hoursBlock: {
        marginTop: 4,
    },
    hoursHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    hoursTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    hoursGrid: {
        marginTop: 12,
        gap: 8,
    },
    hoursRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    hoursDay: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    hoursTime: {
        fontSize: 14,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingBottom: 100,
    },
    menuItem: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    menuImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: Colors.dark.border,
    },
    menuContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    menuName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    menuDesc: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.primary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    addButtonText: {
        color: Colors.dark.primaryForeground,
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: 12,
    },
    floatingCartContainer: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
    },
    floatingCart: {
        backgroundColor: Colors.dark.primary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cartInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: Colors.dark.primaryForeground,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 10,
    },
    badgeText: {
        color: Colors.dark.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    viewCartText: {
        color: Colors.dark.primaryForeground,
        fontSize: 18,
        fontWeight: 'bold',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 8,
    },
    quantityButton: {
        padding: 5,
    },
    iconButton: {
        backgroundColor: Colors.dark.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonText: {
        color: Colors.dark.primaryForeground,
        fontWeight: 'bold',
        fontSize: 14,
        lineHeight: 16,
    },
    quantityText: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 10,
        minWidth: 20,
        textAlign: 'center',
    },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronDown, ChevronUp, Clock, MapPin, Phone, Plus, ShoppingCart, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { premiumCardShadowSoft, SCREEN_PADDING_H } from '../../constants/appChrome';
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

    const isVeg = (item: any) => {
        if (item.is_veg === true || item.veg === true) return true;
        if (item.is_veg === false || item.veg === false) return false;
        if (item.type?.toLowerCase() === 'veg') return true;
        if (item.type?.toLowerCase() === 'nonveg') return false;
        return null;
    };

    const renderMenuItem = ({ item }: { item: any }) => {
        const qty = getQuantity(item.id);
        const veg = isVeg(item);

        return (
            <View style={[styles.menuItem, premiumCardShadowSoft]}>
                <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                    style={styles.menuImage}
                    contentFit="cover"
                    transition={150}
                />
                <View style={styles.menuContent}>
                    <View style={styles.menuNameRow}>
                        <Text style={styles.menuName}>{item.name}</Text>
                        {veg !== null && (
                            <View style={[styles.vegBadge, veg ? styles.vegBadgeGreen : styles.vegBadgeRed]}>
                                <Text style={styles.vegBadgeText}>{veg ? 'Veg' : 'Non-Veg'}</Text>
                            </View>
                        )}
                    </View>
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

    const heroUri = kitchen?.image_url as string | undefined;

    return (
        <View style={styles.container}>
            {kitchen && (
                <View style={styles.header}>
                    {heroUri ? (
                        <View style={styles.heroWrap}>
                            <Image source={{ uri: heroUri }} style={styles.heroImage} contentFit="cover" transition={200} />
                            <View style={styles.heroTextBlock}>
                                <Text style={styles.titleOnHero} numberOfLines={2}>
                                    {kitchen.name}
                                </Text>
                                {kitchen.rating != null && (
                                    <View style={styles.heroRating}>
                                        <Star size={14} color={Colors.dark.primary} fill={Colors.dark.primary} />
                                        <Text style={styles.heroRatingText}>{kitchen.rating}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.title}>{kitchen.name}</Text>
                            {kitchen.rating != null && (
                                <View style={styles.titleRowRating}>
                                    <Star size={14} color={Colors.dark.primary} fill={Colors.dark.primary} />
                                    <Text style={styles.heroRatingText}>{kitchen.rating}</Text>
                                </View>
                            )}
                        </>
                    )}
                    {(kitchen.details?.description || kitchen.description) && (
                        <Text style={[styles.subtitle, heroUri && styles.subtitleBelowHero]}>
                            {kitchen.details?.description || kitchen.description}
                        </Text>
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
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    menuItems.length > 0 ? (
                        <Text style={styles.menuSectionLabel}>Menu</Text>
                    ) : null
                }
            />

            {count > 0 && (
                <View style={styles.floatingCartContainer}>
                    <TouchableOpacity style={[styles.floatingCart, premiumCardShadowSoft]} onPress={() => router.push('/cart')}>
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
        paddingHorizontal: SCREEN_PADDING_H,
        paddingTop: 16,
        paddingBottom: 22,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        backgroundColor: Colors.dark.sheetTint,
    },
    heroWrap: {
        height: 168,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: Colors.dark.backgroundSecondary,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroTextBlock: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 14,
    },
    titleOnHero: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0,0,0,0.55)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 8,
    },
    heroRating: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 8,
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: 'rgba(12, 12, 14, 0.65)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    heroRatingText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: -0.6,
    },
    titleRowRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: Colors.dark.primaryMuted,
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        marginTop: 6,
        lineHeight: 22,
    },
    subtitleBelowHero: {
        marginTop: 0,
    },
    menuSectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.dark.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 14,
    },
    detailsSection: {
        marginTop: 18,
        backgroundColor: Colors.dark.backgroundSecondary,
        borderRadius: 16,
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
        backgroundColor: Colors.dark.cardElevated,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
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
        paddingHorizontal: SCREEN_PADDING_H,
        paddingTop: 20,
        paddingBottom: 112,
    },
    menuItem: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.cardElevated,
        borderRadius: 18,
        marginBottom: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    menuImage: {
        width: 88,
        height: 88,
        borderRadius: 14,
        backgroundColor: Colors.dark.border,
    },
    menuContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    menuNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuName: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.dark.text,
        letterSpacing: -0.2,
    },
    vegBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    vegBadgeGreen: {
        backgroundColor: 'rgba(48, 209, 88, 0.2)',
        borderWidth: 1,
        borderColor: Colors.dark.success,
    },
    vegBadgeRed: {
        backgroundColor: 'rgba(255, 69, 58, 0.2)',
        borderWidth: 1,
        borderColor: '#FF453A',
    },
    vegBadgeText: {
        fontSize: 10,
        fontWeight: '600',
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
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
    },
    addButtonText: {
        color: Colors.dark.primaryForeground,
        fontWeight: '800',
        marginLeft: 4,
        fontSize: 13,
    },
    floatingCartContainer: {
        position: 'absolute',
        bottom: 22,
        left: SCREEN_PADDING_H,
        right: SCREEN_PADDING_H,
    },
    floatingCart: {
        backgroundColor: Colors.dark.primary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 16,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
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
        backgroundColor: Colors.dark.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 999,
        paddingHorizontal: 2,
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

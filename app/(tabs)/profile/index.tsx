import { useFocusEffect, useRouter } from 'expo-router';
import {
    ChevronRight,
    FileText,
    LogOut,
    Mail,
    MapPin,
    Pencil,
    Phone,
    RefreshCw,
    Shield,
    UserCircle,
    Wallet,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { premiumCardShadowSoft, SCREEN_PADDING_H } from '../../../constants/appChrome';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import {
    useTabBarScrollProps,
    useTabBarScrollResetOnFocus,
} from '../../../context/TabBarScrollContext';
import { useTabBarContentPadding } from '../../../hooks/useTabBarContentPadding';
import { userService } from '../../../services/api';
import { LEGAL_SLUGS } from '../../../constants/legalDocuments';

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tabBarScrollProps = useTabBarScrollProps();
    const tabBarPadBottom = useTabBarContentPadding();
    useTabBarScrollResetOnFocus();
    const { signOut, user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const data = await userService.getProfile();
            setProfile(data);
        } catch (error) {
            console.log('Failed to fetch profile', error);
            if (user) setProfile(user);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile();
    }, []);

    return (
        <View style={styles.container}>
            <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
                <Text style={styles.headerEyebrow}>Account</Text>
                <Text style={styles.headerTitle}>Profile</Text>
                <Text style={styles.headerSubtitle}>Details, wallet & preferences</Text>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadBottom }]}
                {...tabBarScrollProps}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
                }
            >
                <View style={[styles.profileCard, premiumCardShadowSoft]}>
                    <View style={styles.avatarRing}>
                        <View style={styles.avatarContainer}>
                            <UserCircle size={76} color={Colors.dark.text} strokeWidth={1.2} />
                        </View>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={Colors.dark.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <>
                            <Text style={styles.username}>{profile?.name || profile?.username || 'User'}</Text>
                            {profile?.username && (
                                <Text style={styles.usernameHandle}>@{profile.username}</Text>
                            )}
                            <View style={styles.roleBadgeWrap}>
                                <Text style={styles.roleBadge}>{profile?.role || 'CLIENT'}</Text>
                            </View>

                            {profile?.credits != null && (
                                <View style={styles.creditsCard}>
                                    <Wallet size={24} color={Colors.dark.primary} />
                                    <View>
                                        <Text style={styles.creditsLabel}>Credits</Text>
                                        <Text style={styles.creditsAmount}>₹{profile.credits}</Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.infoSection}>
                                <View style={styles.infoRow}>
                                    <Mail size={18} color={Colors.dark.textSecondary} />
                                    <Text style={styles.infoText}>{profile?.email || 'No email'}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Phone size={18} color={Colors.dark.textSecondary} />
                                    <Text style={styles.infoText}>{profile?.phone_number || 'No phone'}</Text>
                                </View>
                                {profile?.address && (
                                    <View style={styles.infoRow}>
                                        <MapPin size={18} color={Colors.dark.textSecondary} />
                                        <Text style={styles.infoText}>{profile.address}</Text>
                                    </View>
                                )}
                                {profile?.pincode && (
                                    <View style={styles.infoRow}>
                                        <MapPin size={18} color={Colors.dark.textSecondary} />
                                        <Text style={styles.infoText}>Pincode: {profile.pincode}</Text>
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                </View>

                <Text style={styles.sectionLabel}>Quick actions</Text>
                <View style={[styles.actionSection, premiumCardShadowSoft]}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/(tabs)/profile/edit')}
                    >
                        <View style={styles.menuIconPrimary}>
                            <Pencil size={20} color={Colors.dark.primary} />
                        </View>
                        <Text style={[styles.menuText, styles.menuTextPrimary]}>Edit profile</Text>
                        <ChevronRight size={20} color={Colors.dark.muted} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionLabel}>Legal</Text>
                <View style={[styles.actionSection, premiumCardShadowSoft]}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push(`/(tabs)/profile/legal/${LEGAL_SLUGS.PRIVACY}`)}
                    >
                        <View style={styles.menuIconMuted}>
                            <Shield size={20} color={Colors.dark.textSecondary} />
                        </View>
                        <Text style={styles.menuText}>Privacy policy</Text>
                        <ChevronRight size={20} color={Colors.dark.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push(`/(tabs)/profile/legal/${LEGAL_SLUGS.TERMS}`)}
                    >
                        <View style={styles.menuIconMuted}>
                            <FileText size={20} color={Colors.dark.textSecondary} />
                        </View>
                        <Text style={styles.menuText}>Terms & conditions</Text>
                        <ChevronRight size={20} color={Colors.dark.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.menuItem, styles.menuItemLast]}
                        onPress={() => router.push(`/(tabs)/profile/legal/${LEGAL_SLUGS.REFUND}`)}
                    >
                        <View style={styles.menuIconMuted}>
                            <RefreshCw size={20} color={Colors.dark.textSecondary} />
                        </View>
                        <Text style={styles.menuText}>Refund & cancellation</Text>
                        <ChevronRight size={20} color={Colors.dark.muted} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.actionSection, styles.signOutSection, premiumCardShadowSoft]}>
                    <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={signOut}>
                        <View style={styles.menuIconDanger}>
                            <LogOut size={20} color={Colors.dark.danger} />
                        </View>
                        <Text style={[styles.menuText, styles.menuTextDanger]}>Sign out</Text>
                    </TouchableOpacity>
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
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: -0.8,
    },
    headerSubtitle: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        marginTop: 8,
        lineHeight: 22,
    },
    scrollContent: {
        paddingHorizontal: SCREEN_PADDING_H,
    },
    profileCard: {
        alignItems: 'center',
        backgroundColor: Colors.dark.cardElevated,
        borderRadius: 24,
        padding: 26,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    avatarRing: {
        padding: 4,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: Colors.dark.primaryBorder,
        backgroundColor: Colors.dark.primaryMuted,
        marginBottom: 18,
    },
    avatarContainer: {
        borderRadius: 999,
        overflow: 'hidden',
    },
    username: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.dark.text,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    usernameHandle: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginBottom: 10,
    },
    roleBadgeWrap: {
        marginBottom: 16,
    },
    roleBadge: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.dark.primary,
        backgroundColor: Colors.dark.primaryMuted,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        overflow: 'hidden',
        letterSpacing: 0.6,
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
    },
    creditsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: Colors.dark.primaryMuted,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 16,
        marginBottom: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
    },
    creditsLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    creditsAmount: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.dark.primary,
        letterSpacing: -0.3,
    },
    infoSection: {
        width: '100%',
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.dark.backgroundSecondary,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    infoText: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        flex: 1,
        lineHeight: 21,
    },
    actionSection: {
        backgroundColor: Colors.dark.cardElevated,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.dark.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginTop: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuIconPrimary: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.dark.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
    },
    menuIconMuted: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.dark.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuIconDanger: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 69, 58, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: {
        fontSize: 16,
        marginLeft: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        flex: 1,
    },
    menuTextPrimary: {
        color: Colors.dark.primary,
    },
    menuTextDanger: {
        color: Colors.dark.danger,
    },
    signOutSection: {
        marginTop: 16,
    },
});

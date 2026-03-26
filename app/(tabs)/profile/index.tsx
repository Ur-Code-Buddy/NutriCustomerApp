import { useFocusEffect, useRouter } from 'expo-router';
import {
    Bug,
    ChevronRight,
    FileText,
    LogOut,
    Mail,
    MapPin,
    Pencil,
    Phone,
    RefreshCw,
    Shield,
    Wallet,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
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

const AVATAR_SIZE = 80;

function profilePictureUri(p: Record<string, unknown> | null | undefined): string | null {
    if (!p) return null;
    for (const key of ['avatar_url', 'image_url', 'profile_image', 'photo_url'] as const) {
        const v = p[key];
        if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return null;
}

function initialsFromDisplayName(name: string): string {
    const t = name.trim();
    if (!t) return '?';
    return t.slice(0, 2).toUpperCase();
}

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
    const [contactModalVisible, setContactModalVisible] = useState(false);

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

    const avatarSource = profile ?? user;
    const avatarUri = profilePictureUri(avatarSource);
    const avatarName = avatarSource?.name || avatarSource?.username || 'User';

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
                    <View style={styles.avatarCircle}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarInitials} numberOfLines={1}>
                                {initialsFromDisplayName(avatarName)}
                            </Text>
                        )}
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
                        </>
                    )}
                </View>

                <Text style={styles.sectionLabel}>Quick actions</Text>
                <View style={[styles.actionSection, premiumCardShadowSoft]}>
                    {!loading && (
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => setContactModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconMuted}>
                                <Mail size={20} color={Colors.dark.textSecondary} />
                            </View>
                            <Text style={styles.menuText}>Contact & address</Text>
                            <ChevronRight size={20} color={Colors.dark.muted} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/(tabs)/profile/bug-report')}
                    >
                        <View style={styles.menuIconMuted}>
                            <Bug size={20} color={Colors.dark.textSecondary} />
                        </View>
                        <Text style={styles.menuText}>Report a bug</Text>
                        <ChevronRight size={20} color={Colors.dark.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.menuItem, styles.menuItemLast]}
                        onPress={() => router.push('/(tabs)/profile/edit')}
                    >
                        <View style={styles.menuIconMuted}>
                            <Pencil size={20} color={Colors.dark.textSecondary} />
                        </View>
                        <Text style={styles.menuText}>Edit profile</Text>
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

            <Modal
                visible={contactModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setContactModalVisible(false)}
            >
                <View
                    style={[
                        styles.modalRoot,
                        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
                    ]}
                >
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setContactModalVisible(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Close contact details"
                    />
                    <View style={styles.modalPanel}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Contact & address</Text>
                            <Text style={styles.modalSubtitle}>How we reach you and where meals go</Text>
                        </View>
                        <ScrollView
                            style={styles.modalScroll}
                            contentContainerStyle={styles.modalScrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.modalDetailGroup}>
                                {(
                                    [
                                        {
                                            key: 'email',
                                            Icon: Mail,
                                            label: 'Email',
                                            value: profile?.email || 'No email',
                                        },
                                        {
                                            key: 'phone',
                                            Icon: Phone,
                                            label: 'Phone',
                                            value: profile?.phone_number || 'No phone',
                                        },
                                        ...(profile?.address
                                            ? [
                                                  {
                                                      key: 'address',
                                                      Icon: MapPin,
                                                      label: 'Address',
                                                      value: profile.address as string,
                                                  },
                                              ]
                                            : []),
                                        ...(profile?.pincode
                                            ? [
                                                  {
                                                      key: 'pincode',
                                                      Icon: MapPin,
                                                      label: 'Pincode',
                                                      value: String(profile.pincode),
                                                  },
                                              ]
                                            : []),
                                    ] as const
                                ).map((row, i, arr) => {
                                    const Icon = row.Icon;
                                    return (
                                        <View key={row.key}>
                                            <View style={styles.modalDetailRow}>
                                                <View style={styles.modalDetailIconWrap}>
                                                    <Icon size={18} color={Colors.dark.primary} />
                                                </View>
                                                <View style={styles.modalDetailBody}>
                                                    <Text style={styles.modalDetailLabel}>{row.label}</Text>
                                                    <Text style={styles.modalDetailValue}>{row.value}</Text>
                                                </View>
                                            </View>
                                            {i < arr.length - 1 ? (
                                                <View style={styles.modalDetailHairline} />
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalDone}
                            onPress={() => setContactModalVisible(false)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.modalDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    avatarCircle: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 2,
        borderColor: Colors.dark.primaryBorder,
        backgroundColor: Colors.dark.primaryMuted,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarInitials: {
        fontSize: 30,
        fontWeight: '800',
        color: Colors.dark.primary,
        letterSpacing: -0.8,
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
    modalRoot: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SCREEN_PADDING_H,
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.dark.overlay,
    },
    modalPanel: {
        width: '100%',
        maxHeight: '82%',
        zIndex: 1,
        backgroundColor: Colors.dark.cardElevated,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        paddingTop: 22,
        paddingHorizontal: 20,
        paddingBottom: 20,
        overflow: 'hidden',
    },
    modalHeader: {
        paddingBottom: 18,
        marginBottom: 4,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.dark.borderLight,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: -0.4,
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    modalScroll: {
        maxHeight: 400,
    },
    modalScrollContent: {
        paddingTop: 4,
        paddingBottom: 4,
    },
    modalDetailGroup: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        backgroundColor: Colors.dark.backgroundSecondary,
        overflow: 'hidden',
    },
    modalDetailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    modalDetailIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.dark.primaryMuted,
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    modalDetailBody: {
        flex: 1,
        minWidth: 0,
    },
    modalDetailLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.dark.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        marginBottom: 5,
    },
    modalDetailValue: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.dark.text,
        lineHeight: 22,
    },
    modalDetailHairline: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.dark.border,
        marginLeft: 66,
    },
    modalDone: {
        marginTop: 18,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: Colors.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalDoneText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.primaryForeground,
        letterSpacing: 0.2,
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
    menuTextDanger: {
        color: Colors.dark.danger,
    },
    signOutSection: {
        marginTop: 16,
    },
});

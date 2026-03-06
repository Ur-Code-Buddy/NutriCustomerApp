import { useRouter } from 'expo-router';
import { LogOut, Mail, MapPin, Pencil, Phone, UserCircle, Wallet } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import { userService } from '../../../services/api';

export default function ProfileScreen() {
    const router = useRouter();
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

    useEffect(() => {
        fetchProfile();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>My Profile</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
                }
            >
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <UserCircle size={80} color={Colors.dark.text} strokeWidth={1} />
                    </View>

                    {loading ? (
                        <ActivityIndicator color={Colors.dark.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <>
                            <Text style={styles.username}>{profile?.name || profile?.username || 'User'}</Text>
                            {profile?.username && (
                                <Text style={styles.usernameHandle}>@{profile.username}</Text>
                            )}
                            <Text style={styles.roleBadge}>{profile?.role || 'CLIENT'}</Text>

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

                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/(tabs)/profile/edit')}
                    >
                        <Pencil size={20} color={Colors.dark.primary} />
                        <Text style={[styles.menuText, { color: Colors.dark.primary }]}>Edit Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={signOut}>
                        <LogOut size={20} color={Colors.dark.danger} />
                        <Text style={[styles.menuText, { color: Colors.dark.danger }]}>Sign Out</Text>
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
        paddingTop: 50,
    },
    headerBar: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    profileCard: {
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    usernameHandle: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginBottom: 8,
    },
    roleBadge: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.dark.primary,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    creditsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.3)',
    },
    creditsLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    creditsAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.primary,
    },
    infoSection: {
        width: '100%',
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        flex: 1,
    },
    actionSection: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    menuText: {
        fontSize: 16,
        marginLeft: 12,
        fontWeight: '500',
    },
});

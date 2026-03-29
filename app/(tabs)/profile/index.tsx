import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
    Bug,
    Camera,
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
    type LucideIcon,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { PasswordInput } from '../../../components/passwordInput';
import { premiumCardShadowSoft, SCREEN_PADDING_H } from '../../../constants/appChrome';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import {
    useTabBarScrollProps,
    useTabBarScrollResetOnFocus,
} from '../../../context/TabBarScrollContext';
import { useTabBarContentPadding } from '../../../hooks/useTabBarContentPadding';
import { uploadImageFile, userService } from '../../../services/api';
import { LEGAL_SLUGS } from '../../../constants/legalDocuments';

const AVATAR_SIZE = 80;

function profilePictureUri(p: Record<string, unknown> | null | undefined): string | null {
    if (!p) return null;
    for (const key of [
        'profile_picture_url',
        'avatar_url',
        'image_url',
        'profile_image',
        'photo_url',
    ] as const) {
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

function ProfileMenuRow({
    title,
    icon: Icon,
    onPress,
    last,
}: {
    title: string;
    icon: LucideIcon;
    onPress: () => void;
    last?: boolean;
}) {
    return (
        <TouchableOpacity
            style={[styles.menuItem, last ? styles.menuItemLast : undefined]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.menuIconTile}>
                <Icon size={20} color={Colors.dark.text} strokeWidth={2} />
            </View>
            <View style={styles.menuItemBody}>
                <Text style={styles.menuItemTitle}>{title}</Text>
            </View>
            <ChevronRight size={20} color={Colors.dark.muted} />
        </TouchableOpacity>
    );
}

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tabBarScrollProps = useTabBarScrollProps();
    const tabBarPadBottom = useTabBarContentPadding();
    useTabBarScrollResetOnFocus();
    const { signOut, user, refreshUser } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [contactModalVisible, setContactModalVisible] = useState(false);
    const [photoConfirmVisible, setPhotoConfirmVisible] = useState(false);
    const [photoPassword, setPhotoPassword] = useState('');
    const [pickedImage, setPickedImage] = useState<{
        uri: string;
        mimeType: string;
        filename: string;
    } | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    const resetPhotoFlow = useCallback(() => {
        setPhotoConfirmVisible(false);
        setPhotoPassword('');
        setPickedImage(null);
        setPhotoUploading(false);
    }, []);

    const beginPhotoConfirm = useCallback((asset: ImagePicker.ImagePickerAsset) => {
        setPickedImage({
            uri: asset.uri,
            mimeType: asset.mimeType ?? 'image/jpeg',
            filename: asset.fileName ?? `profile-${Date.now()}.jpg`,
        });
        setPhotoPassword('');
        setPhotoConfirmVisible(true);
    }, []);

    const pickFromLibrary = useCallback(async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permission needed', 'Allow photo library access to set your profile picture.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });
        if (!result.canceled && result.assets[0]) {
            beginPhotoConfirm(result.assets[0]);
        }
    }, [beginPhotoConfirm]);

    const pickFromCamera = useCallback(async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permission needed', 'Allow camera access to take a profile picture.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });
        if (!result.canceled && result.assets[0]) {
            beginPhotoConfirm(result.assets[0]);
        }
    }, [beginPhotoConfirm]);

    const handleAvatarPress = useCallback(() => {
        Alert.alert('Profile photo', 'Choose a source', [
            { text: 'Photo library', onPress: () => void pickFromLibrary() },
            { text: 'Camera', onPress: () => void pickFromCamera() },
            { text: 'Cancel', style: 'cancel' },
        ]);
    }, [pickFromLibrary, pickFromCamera]);

    const submitProfilePhoto = async () => {
        if (!pickedImage) return;
        if (!photoPassword.trim()) {
            Alert.alert('Password required', 'Enter your current password to save the new photo.');
            return;
        }
        setPhotoUploading(true);
        try {
            const imageUrl = await uploadImageFile(
                pickedImage.uri,
                pickedImage.mimeType,
                pickedImage.filename
            );
            await userService.updateProfile({
                current_password: photoPassword,
                profile_picture_url: imageUrl,
            });
            const fresh = await refreshUser();
            if (fresh) setProfile(fresh);
            else await fetchProfile();
            resetPhotoFlow();
            Alert.alert('Success', 'Profile photo updated.');
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string | string[] } }; message?: string };
            const raw = err?.response?.data?.message;
            const msg = Array.isArray(raw) ? raw.join(', ') : raw ?? err?.message;
            Alert.alert('Error', typeof msg === 'string' ? msg : 'Could not update profile photo');
        } finally {
            setPhotoUploading(false);
        }
    };

    const fetchProfile = useCallback(async () => {
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
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            void fetchProfile();
        }, [fetchProfile])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        void fetchProfile();
    }, [fetchProfile]);

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
                    <Pressable
                        onPress={handleAvatarPress}
                        disabled={loading}
                        style={({ pressed }) => [
                            styles.avatarTouch,
                            pressed && !loading ? styles.avatarTouchPressed : undefined,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Change profile photo"
                    >
                        <View
                            style={[
                                styles.avatarCircle,
                                avatarUri ? styles.avatarCircleWithPhoto : styles.avatarCircleInitials,
                            ]}
                        >
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarInitials} numberOfLines={1}>
                                    {initialsFromDisplayName(avatarName)}
                                </Text>
                            )}
                        </View>
                        <View style={styles.avatarCameraBadge} pointerEvents="none">
                            <Camera size={16} color={Colors.dark.primaryForeground} strokeWidth={2.2} />
                        </View>
                    </Pressable>

                    {loading ? (
                        <ActivityIndicator color={Colors.dark.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <>
                            <Text style={styles.username}>{profile?.name || profile?.username || 'User'}</Text>
                            {profile?.username && (
                                <Text style={styles.usernameHandle}>@{profile.username}</Text>
                            )}

                            {profile?.credits != null && (
                                <View style={styles.creditsCard}>
                                    <Wallet size={22} color={Colors.dark.textSecondary} />
                                    <View>
                                        <Text style={styles.creditsLabel}>Credits</Text>
                                        <Text style={styles.creditsAmount}>₹{profile.credits}</Text>
                                    </View>
                                </View>
                            )}
                        </>
                    )}
                </View>

                <View style={[styles.actionSection, premiumCardShadowSoft]}>
                    <Text style={styles.sectionLabelInCard}>Quick actions</Text>
                    {!loading && (
                        <ProfileMenuRow
                            title="Contact & address"
                            icon={Mail}
                            onPress={() => setContactModalVisible(true)}
                        />
                    )}
                    <ProfileMenuRow
                        title="Report a bug"
                        icon={Bug}
                        onPress={() => router.push('/(tabs)/profile/bug-report')}
                        last={loading}
                    />
                    {!loading && (
                        <ProfileMenuRow
                            title="Edit profile"
                            icon={Pencil}
                            onPress={() => router.push('/(tabs)/profile/edit')}
                            last
                        />
                    )}
                </View>

                <View style={[styles.actionSection, premiumCardShadowSoft]}>
                    <Text style={styles.sectionLabelInCard}>Legal</Text>
                    <ProfileMenuRow
                        title="Privacy policy"
                        icon={Shield}
                        onPress={() => router.push(`/(tabs)/profile/legal/${LEGAL_SLUGS.PRIVACY}`)}
                    />
                    <ProfileMenuRow
                        title="Terms & conditions"
                        icon={FileText}
                        onPress={() => router.push(`/(tabs)/profile/legal/${LEGAL_SLUGS.TERMS}`)}
                    />
                    <ProfileMenuRow
                        title="Refund & cancellation"
                        icon={RefreshCw}
                        onPress={() => router.push(`/(tabs)/profile/legal/${LEGAL_SLUGS.REFUND}`)}
                        last
                    />
                </View>

                <View style={[styles.actionSection, styles.signOutSection, premiumCardShadowSoft]}>
                    <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={signOut}>
                        <View style={styles.menuIconDanger}>
                            <LogOut size={20} color={Colors.dark.danger} />
                        </View>
                        <View style={styles.menuItemBody}>
                            <Text style={[styles.menuItemTitle, styles.menuItemTitleDanger]}>Sign out</Text>
                        </View>
                        <ChevronRight size={20} color={Colors.dark.muted} />
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

            <Modal
                visible={photoConfirmVisible}
                transparent
                animationType="fade"
                onRequestClose={photoUploading ? undefined : resetPhotoFlow}
            >
                <View
                    style={[
                        styles.modalRoot,
                        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
                    ]}
                >
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={photoUploading ? undefined : resetPhotoFlow}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss"
                    />
                    <View style={styles.modalPanel}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New profile photo</Text>
                            <Text style={styles.modalSubtitle}>
                                Enter your password to save this picture to your account.
                            </Text>
                        </View>
                        {pickedImage ? (
                            <Image source={{ uri: pickedImage.uri }} style={styles.photoPreview} />
                        ) : null}
                        <Text style={styles.photoPasswordLabel}>Current password</Text>
                        <PasswordInput
                            containerStyle={styles.photoPasswordBox}
                            inputStyle={styles.photoPasswordField}
                            value={photoPassword}
                            onChangeText={setPhotoPassword}
                            placeholder="Required to confirm"
                            placeholderTextColor={Colors.dark.textSecondary}
                            editable={!photoUploading}
                        />
                        <TouchableOpacity
                            style={[styles.modalDone, photoUploading && styles.modalDoneDisabled]}
                            onPress={() => void submitProfilePhoto()}
                            disabled={photoUploading}
                            activeOpacity={0.85}
                        >
                            {photoUploading ? (
                                <ActivityIndicator color={Colors.dark.primaryForeground} />
                            ) : (
                                <Text style={styles.modalDoneText}>Save photo</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.photoCancelBtn}
                            onPress={resetPhotoFlow}
                            disabled={photoUploading}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.photoCancelBtnText}>Cancel</Text>
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
        borderRadius: 28,
        padding: 28,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    avatarTouch: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    avatarTouchPressed: {
        opacity: 0.88,
    },
    avatarCircle: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarCameraBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.dark.primary,
        borderWidth: 2,
        borderColor: Colors.dark.cardElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarCircleInitials: {
        backgroundColor: Colors.dark.primary,
    },
    avatarCircleWithPhoto: {
        backgroundColor: Colors.dark.input,
        borderWidth: 1,
        borderColor: Colors.dark.borderLight,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarInitials: {
        fontSize: 30,
        fontWeight: '800',
        color: Colors.dark.primaryForeground,
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
    creditsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: Colors.dark.backgroundSecondary,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 16,
        marginBottom: 4,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    creditsLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    creditsAmount: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.dark.text,
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
    modalDoneDisabled: {
        opacity: 0.75,
    },
    modalDoneText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.dark.primaryForeground,
        letterSpacing: 0.2,
    },
    photoPreview: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignSelf: 'center',
        marginBottom: 16,
        backgroundColor: Colors.dark.input,
    },
    photoPasswordLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.dark.textSecondary,
        marginBottom: 8,
    },
    photoPasswordBox: {
        backgroundColor: Colors.dark.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minHeight: 50,
        marginBottom: 4,
    },
    photoPasswordField: {
        fontSize: 16,
        color: Colors.dark.text,
        paddingVertical: 4,
    },
    photoCancelBtn: {
        marginTop: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    photoCancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    actionSection: {
        backgroundColor: Colors.dark.cardElevated,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: 22,
    },
    sectionLabelInCard: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.dark.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuIconTile: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.dark.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuIconDanger: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 69, 58, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemBody: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'center',
    },
    menuItemTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.dark.text,
        letterSpacing: -0.2,
    },
    menuItemTitleDanger: {
        color: Colors.dark.danger,
    },
    signOutSection: {
        marginTop: 0,
    },
});

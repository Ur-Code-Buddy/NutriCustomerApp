import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PasswordInput } from '../../../components/passwordInput';
import { SCREEN_PADDING_H } from '../../../constants/appChrome';
import { Colors } from '../../../constants/Colors';
import {
    useTabBarScrollProps,
    useTabBarScrollResetOnFocus,
} from '../../../context/TabBarScrollContext';
import { useTabBarContentPadding } from '../../../hooks/useTabBarContentPadding';
import { userService } from '../../../services/api';

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tabBarScrollProps = useTabBarScrollProps();
    const tabBarPadBottom = useTabBarContentPadding();
    useTabBarScrollResetOnFocus();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [pincode, setPincode] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const data = await userService.getProfile();
                setPhone(data.phone_number || '');
                setAddress(data.address || '');
                setPincode(data.pincode || '');
            } catch (e) {
                Alert.alert('Error', 'Failed to load profile');
                router.back();
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        if (!currentPassword.trim()) {
            Alert.alert('Error', 'Current password is required to save changes');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('Error', 'Phone number is required');
            return;
        }
        if (phone.length !== 10) {
            Alert.alert('Error', 'Phone number must be 10 digits');
            return;
        }
        if (!pincode.trim()) {
            Alert.alert('Error', 'Pincode is required');
            return;
        }
        if (pincode.length !== 6) {
            Alert.alert('Error', 'Pincode must be 6 digits');
            return;
        }

        setSaving(true);
        try {
            const result = await userService.updateProfile({
                current_password: currentPassword,
                phone_number: phone.trim(),
                address: address.trim(),
                pincode: pincode.trim(),
            });
            const msg = result?.phone_verification_required
                ? 'Profile updated. An OTP has been sent to your new phone for verification.'
                : 'Profile updated';
            Alert.alert('Success', msg, [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
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
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
                    <ChevronLeft size={28} color={Colors.dark.text} strokeWidth={2} />
                </TouchableOpacity>
                <View style={styles.headerTitleBlock}>
                    <Text style={styles.headerEyebrow}>Account</Text>
                    <Text style={styles.headerTitle}>Edit profile</Text>
                </View>
                <View style={{ width: 28 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={80}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadBottom }]}
                    keyboardShouldPersistTaps="handled"
                    {...tabBarScrollProps}
                >
                    <Text style={styles.label}>Current password</Text>
                    <PasswordInput
                        containerStyle={styles.passwordContainer}
                        inputStyle={styles.passwordField}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Enter your password to confirm"
                        placeholderTextColor={Colors.dark.textSecondary}
                    />

                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit phone number"
                        placeholderTextColor={Colors.dark.textSecondary}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />

                    <Text style={styles.label}>Address</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Full address"
                        placeholderTextColor={Colors.dark.textSecondary}
                        multiline
                    />

                    <Text style={styles.label}>Pincode</Text>
                    <TextInput
                        style={styles.input}
                        value={pincode}
                        onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit pincode"
                        placeholderTextColor={Colors.dark.textSecondary}
                        keyboardType="number-pad"
                        maxLength={6}
                    />

                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={Colors.dark.primaryForeground} />
                        ) : (
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    flex: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SCREEN_PADDING_H,
        paddingBottom: 14,
    },
    headerTitleBlock: {
        alignItems: 'center',
    },
    headerEyebrow: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.dark.primary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: -0.3,
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: SCREEN_PADDING_H,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.dark.textSecondary,
        marginBottom: 8,
        marginTop: 18,
        letterSpacing: 0.3,
    },
    input: {
        backgroundColor: Colors.dark.cardElevated,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: Colors.dark.text,
    },
    passwordContainer: {
        backgroundColor: Colors.dark.cardElevated,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 52,
    },
    passwordField: {
        paddingVertical: 4,
        fontSize: 16,
        color: Colors.dark.text,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveBtn: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 999,
        paddingVertical: 16,
        marginTop: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
    },
    saveBtnDisabled: {
        opacity: 0.7,
    },
    saveBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.primaryForeground,
    },
});

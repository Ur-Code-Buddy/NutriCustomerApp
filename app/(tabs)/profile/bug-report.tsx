import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
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
import { SCREEN_PADDING_H } from '../../../constants/appChrome';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import {
    useTabBarScrollProps,
    useTabBarScrollResetOnFocus,
} from '../../../context/TabBarScrollContext';
import { useTabBarContentPadding } from '../../../hooks/useTabBarContentPadding';
import { submitBugReport } from '../../../services/bugReportService';
import { userService } from '../../../services/api';

type ProfileRow = {
    username?: string;
    name?: string;
    email?: string;
};

export default function BugReportScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tabBarScrollProps = useTabBarScrollProps();
    const tabBarPadBottom = useTabBarContentPadding();
    useTabBarScrollResetOnFocus();
    const { user: authUser } = useAuth();

    const [profile, setProfile] = useState<ProfileRow | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [description, setDescription] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [descriptionError, setDescriptionError] = useState('');
    const [emailError, setEmailError] = useState('');

    const loadProfile = useCallback(async () => {
        try {
            const data = await userService.getProfile();
            setProfile(data as ProfileRow);
        } catch {
            if (authUser && typeof authUser === 'object') {
                setProfile(authUser as ProfileRow);
            }
        } finally {
            setLoadingProfile(false);
        }
    }, [authUser]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const hasProfileEmail = Boolean(profile?.email?.trim());

    const clearFieldErrors = () => {
        setDescriptionError('');
        setEmailError('');
    };

    const handleSubmit = async () => {
        clearFieldErrors();

        const trimmed = description.trim();
        if (trimmed.length < 10) {
            setDescriptionError('Please use at least 10 characters.');
            return;
        }

        if (!hasProfileEmail) {
            const me = manualEmail.trim();
            if (!me) {
                setEmailError('Email is required so we can reply.');
                return;
            }
        }

        setSubmitting(true);
        try {
            let fresh: ProfileRow = profile ?? (authUser as ProfileRow) ?? {};
            try {
                fresh = (await userService.getProfile()) as ProfileRow;
                setProfile(fresh);
            } catch {
                // keep last known profile
            }

            const result = await submitBugReport({
                description,
                user: fresh,
                manualEmail: hasProfileEmail ? undefined : manualEmail,
            });

            if (result.ok) {
                setDescription('');
                setManualEmail('');
                Alert.alert('Thanks', result.message, [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                if (result.field === 'description') {
                    setDescriptionError(result.error);
                } else if (result.field === 'email') {
                    setEmailError(result.error);
                } else {
                    Alert.alert('Could not send', result.error);
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingProfile) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                    disabled={submitting}
                >
                    <ChevronLeft size={28} color={Colors.dark.text} strokeWidth={2} />
                </TouchableOpacity>
                <View style={styles.headerTitleBlock}>
                    <Text style={styles.headerEyebrow}>Help</Text>
                    <Text style={styles.headerTitle}>Report a bug</Text>
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
                    <Text style={styles.helper}>
                        Tell us what went wrong. We include your app version with the report.
                    </Text>

                    <Text style={styles.label}>What happened?</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, descriptionError ? styles.inputError : null]}
                        value={description}
                        onChangeText={(t) => {
                            setDescription(t);
                            if (descriptionError) setDescriptionError('');
                        }}
                        placeholder="Describe the issue (minimum 10 characters)"
                        placeholderTextColor={Colors.dark.textSecondary}
                        multiline
                        editable={!submitting}
                    />
                    {descriptionError ? <Text style={styles.errorText}>{descriptionError}</Text> : null}

                    {!hasProfileEmail ? (
                        <>
                            <Text style={styles.label}>Email for reply</Text>
                            <TextInput
                                style={[styles.input, emailError ? styles.inputError : null]}
                                value={manualEmail}
                                onChangeText={(t) => {
                                    setManualEmail(t);
                                    if (emailError) setEmailError('');
                                }}
                                placeholder="you@example.com"
                                placeholderTextColor={Colors.dark.textSecondary}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!submitting}
                            />
                            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                            <Text style={styles.hint}>
                                Your profile does not have an email yet. Add one in Edit profile anytime.
                            </Text>
                        </>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        {submitting ? (
                            <View style={styles.submittingRow}>
                                <ActivityIndicator color={Colors.dark.primaryForeground} />
                                <Text style={styles.submitBtnText}>Sending…</Text>
                            </View>
                        ) : (
                            <Text style={styles.submitBtnText}>Send report</Text>
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
    helper: {
        fontSize: 14,
        lineHeight: 21,
        color: Colors.dark.textSecondary,
        marginBottom: 8,
        marginTop: 4,
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
    inputError: {
        borderColor: Colors.dark.danger,
    },
    textArea: {
        minHeight: 140,
        textAlignVertical: 'top',
    },
    errorText: {
        color: Colors.dark.danger,
        fontSize: 13,
        marginTop: 8,
        fontWeight: '600',
    },
    hint: {
        fontSize: 13,
        color: Colors.dark.muted,
        marginTop: 10,
        lineHeight: 19,
    },
    submitBtn: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 999,
        paddingVertical: 16,
        marginTop: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.primaryForeground,
    },
    submittingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
});

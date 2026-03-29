import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Check, MapPin, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { PasswordInput } from '../../components/passwordInput';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getRegistrationEmailDomainError } from '../../lib/registrationEmail';
import { userService } from '../../services/api';

const STEPS = 2;
const LOCATION_TIMEOUT_MS = 20_000;

function formatAddressFromPlacemark(a: Location.LocationGeocodedAddress): string {
    if (a.formattedAddress?.trim()) {
        return a.formattedAddress.trim();
    }
    const streetLine = [a.streetNumber, a.street].filter(Boolean).join(' ').trim();
    const parts: string[] = [];
    const push = (value: string | null | undefined) => {
        const t = value?.trim();
        if (t && !parts.includes(t)) {
            parts.push(t);
        }
    };
    push(streetLine || a.name || undefined);
    push(a.district);
    push(a.city);
    push(a.subregion);
    push(a.region);
    push(a.postalCode);
    push(a.country);
    return parts.join(', ');
}

export default function RegisterScreen() {
    const [step, setStep] = useState(1);
    const [showVerification, setShowVerification] = useState(false);
    const [username, setUsername] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [suggestedUsername, setSuggestedUsername] = useState<string | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [pincode, setPincode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [emailValidationError, setEmailValidationError] = useState('');

    const { signUp, setPendingCredentials } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const trimmed = username.trim();
        if (!trimmed) {
            setUsernameAvailable(null);
            setSuggestedUsername(null);
            return;
        }
        let cancelled = false;
        const t = setTimeout(async () => {
            setCheckingUsername(true);
            try {
                const { exists, suggested_username } = await userService.checkUsername(trimmed);
                if (!cancelled) {
                    setUsernameAvailable(!exists);
                    const s =
                        typeof suggested_username === 'string' ? suggested_username.trim() : '';
                    setSuggestedUsername(exists && s ? s : null);
                }
            } catch {
                if (!cancelled) {
                    setUsernameAvailable(null);
                    setSuggestedUsername(null);
                }
            } finally {
                if (!cancelled) setCheckingUsername(false);
            }
        }, 2000);
        return () => {
            cancelled = true;
            clearTimeout(t);
            setUsernameAvailable(null);
            setSuggestedUsername(null);
        };
    }, [username]);

    const validateStep1 = () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please fill in Username');
            return false;
        }
        if (usernameAvailable !== true) {
            Alert.alert('Error', 'Please choose an available username');
            return false;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Please fill in Email');
            return false;
        }
        const emailDomainError = getRegistrationEmailDomainError(email);
        if (emailDomainError) {
            setEmailValidationError(emailDomainError);
            return false;
        }
        setEmailValidationError('');
        if (!phoneNumber.trim()) {
            Alert.alert('Error', 'Please fill in Phone number');
            return false;
        }
        if (!/^\d{10}$/.test(phoneNumber.trim())) {
            Alert.alert('Error', 'Phone number must be exactly 10 digits');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please fill in Name');
            return false;
        }
        if (!address.trim()) {
            Alert.alert('Error', 'Please fill in Address');
            return false;
        }
        if (!pincode.trim()) {
            Alert.alert('Error', 'Please fill in Pincode');
            return false;
        }
        if (!/^\d{6}$/.test(pincode.trim())) {
            Alert.alert('Error', 'Pincode must be exactly 6 digits');
            return false;
        }
        if (!password.trim()) {
            Alert.alert('Error', 'Please fill in Password');
            return false;
        }
        return true;
    };

    const handleContinue = () => {
        if (step === 1) {
            if (!validateStep1()) return;
            setStep(2);
        } else {
            if (!validateStep2()) return;
            setShowVerification(true);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        }
    };

    const handleDetectLocation = async () => {
        if (detectingLocation) return;

        setDetectingLocation(true);
        try {
            const servicesEnabled = await Location.hasServicesEnabledAsync();
            if (!servicesEnabled) {
                Alert.alert(
                    'Location services off',
                    'Turn on location services in your device settings, then try again. You can also type your address manually.'
                );
                return;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== Location.PermissionStatus.GRANTED) {
                Alert.alert(
                    'Location permission needed',
                    'Allow location access to detect your address, or enter your address manually.'
                );
                return;
            }

            let locationTimeoutId: ReturnType<typeof setTimeout> | undefined;
            const timeoutPromise = new Promise<never>((_, reject) => {
                locationTimeoutId = setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), LOCATION_TIMEOUT_MS);
            });
            let position: Location.LocationObject;
            try {
                position = await Promise.race([
                    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
                    timeoutPromise,
                ]);
            } finally {
                if (locationTimeoutId !== undefined) {
                    clearTimeout(locationTimeoutId);
                }
            }

            const results = await Location.reverseGeocodeAsync({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });

            const first = results[0];
            if (!first) {
                Alert.alert(
                    'Address not found',
                    'We could not resolve an address for your location. Please enter your address manually.'
                );
                return;
            }

            const line = formatAddressFromPlacemark(first);
            if (!line.trim()) {
                Alert.alert(
                    'Address not found',
                    'We could not resolve an address for your location. Please enter your address manually.'
                );
                return;
            }

            setAddress(line);

            const digits = first.postalCode?.replace(/\D/g, '') ?? '';
            if (/^\d{6}$/.test(digits)) {
                setPincode(digits);
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.message === 'LOCATION_TIMEOUT') {
                Alert.alert(
                    'Location timed out',
                    'Getting your location took too long. Move to an area with a clearer signal, try again, or enter your address manually.'
                );
                return;
            }

            const message = err instanceof Error ? err.message : '';
            const lower = message.toLowerCase();
            if (
                lower.includes('denied') ||
                lower.includes('permission') ||
                lower.includes('authorization')
            ) {
                Alert.alert(
                    'Location permission needed',
                    'Allow location access to detect your address, or enter your address manually.'
                );
                return;
            }

            Alert.alert(
                'Could not get location',
                'Something went wrong while fetching your location. Please try again or enter your address manually.'
            );
        } finally {
            setDetectingLocation(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const result = await signUp({
                username: username.trim(),
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone_number: phoneNumber.trim(),
                address: address.trim(),
                pincode: pincode.trim(),
                password,
            });

            setShowVerification(false);

            if (result?.needsLogin) {
                setPendingCredentials({ username: username.trim(), password });
                router.replace({
                    pathname: '/(auth)/email-verification-pending',
                    params: { email: result.email, phone: phoneNumber.trim() },
                });
            }
        } catch (error: any) {
            Alert.alert(
                'Registration Failed',
                error.response?.data?.message || 'Could not create account'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.header}>
                    <Text style={styles.stepIndicator}>Step {step} of {STEPS}</Text>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join NutriTiffin for fresh home-cooked meals</Text>
                </View>

                <View style={styles.form}>
                    {step === 1 && (
                        <>
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>Username</Text>
                                <View style={styles.usernameRow}>
                                    <TextInput
                                        style={[styles.input, styles.usernameInput]}
                                        placeholder="Choose a username"
                                        placeholderTextColor={Colors.dark.textSecondary}
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                    {checkingUsername && (
                                        <ActivityIndicator size="small" color={Colors.dark.primary} style={styles.usernameIcon} />
                                    )}
                                    {!checkingUsername && username.trim() && usernameAvailable === true && (
                                        <Check size={22} color={Colors.dark.success} style={styles.usernameIcon} />
                                    )}
                                    {!checkingUsername && username.trim() && usernameAvailable === false && (
                                        <X size={22} color={Colors.dark.danger} style={styles.usernameIcon} />
                                    )}
                                </View>
                                {!checkingUsername && username.trim() && usernameAvailable === false && (
                                    <>
                                        <Text style={styles.usernameError}>Username is taken</Text>
                                        {suggestedUsername &&
                                            suggestedUsername !== username.trim() && (
                                                <View style={styles.usernameSuggestionRow}>
                                                    <Text
                                                        style={styles.usernameSuggestionText}
                                                        numberOfLines={1}
                                                    >
                                                        Try{' '}
                                                        <Text style={styles.usernameSuggestionValue}>
                                                            {suggestedUsername}
                                                        </Text>
                                                    </Text>
                                                    <Pressable
                                                        onPress={() => setUsername(suggestedUsername)}
                                                        style={({ pressed }) => [
                                                            styles.usernameUseThis,
                                                            pressed && styles.usernameUseThisPressed,
                                                        ]}
                                                        accessibilityRole="button"
                                                        accessibilityLabel={`Use suggested username ${suggestedUsername}`}
                                                    >
                                                        <Text style={styles.usernameUseThisLabel}>
                                                            Use this
                                                        </Text>
                                                    </Pressable>
                                                </View>
                                            )}
                                    </>
                                )}
                            </View>
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>Email</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="your@email.com"
                                        placeholderTextColor={Colors.dark.textSecondary}
                                        value={email}
                                        onChangeText={(t) => {
                                            setEmail(t);
                                            if (emailValidationError) setEmailValidationError('');
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                {emailValidationError ? (
                                    <Text style={styles.usernameError}>{emailValidationError}</Text>
                                ) : null}
                            </View>
                            <FormField label="Phone Number">
                                <TextInput
                                    style={styles.input}
                                    placeholder="10-digit phone number"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    value={phoneNumber}
                                    onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, '').slice(0, 10))}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </FormField>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <FormField label="Full Name">
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your full name"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </FormField>
                            <View style={styles.fieldWrapper}>
                                <View style={styles.addressLabelRow}>
                                    <Text style={[styles.fieldLabel, styles.addressFieldLabel]}>Address</Text>
                                    <TouchableOpacity
                                        style={styles.detectLocationButton}
                                        onPress={handleDetectLocation}
                                        disabled={detectingLocation}
                                        accessibilityRole="button"
                                        accessibilityLabel="Detect my location"
                                    >
                                        {detectingLocation ? (
                                            <ActivityIndicator size="small" color={Colors.dark.primary} />
                                        ) : (
                                            <>
                                                <MapPin size={16} color={Colors.dark.primary} />
                                                <Text style={styles.detectLocationText}>Detect My Location</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputContainer, styles.addressInputContainer]}>
                                    <TextInput
                                        style={[styles.input, styles.addressInput]}
                                        placeholder="City, State, Country"
                                        placeholderTextColor={Colors.dark.textSecondary}
                                        value={address}
                                        onChangeText={setAddress}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                            <FormField label="Pincode">
                                <TextInput
                                    style={styles.input}
                                    placeholder="6-digit pincode"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    value={pincode}
                                    onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </FormField>
                            <FormField label="Password">
                                <PasswordInput
                                    containerStyle={styles.passwordInputRow}
                                    inputStyle={styles.input}
                                    placeholder="Create a password"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </FormField>
                        </>
                    )}

                    <View style={styles.buttonRow}>
                        {step === 2 && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBack}
                            >
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                step === 2 && styles.buttonFlex,
                                step === 1 && usernameAvailable !== true && styles.buttonDisabled,
                            ]}
                            onPress={handleContinue}
                            disabled={step === 1 && usernameAvailable !== true}
                        >
                            <Text style={styles.buttonText}>
                                {step === 1 ? 'Continue' : 'Review'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.linkText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <Modal
                visible={showVerification}
                transparent
                animationType="fade"
                onRequestClose={() => setShowVerification(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowVerification(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Verify your details</Text>
                        <Text style={styles.modalSubtitle}>Please confirm before submitting</Text>

                        <View style={styles.verificationRow}>
                            <Text style={styles.verificationLabel}>Email</Text>
                            <Text style={styles.verificationValue}>{email}</Text>
                        </View>
                        <View style={styles.verificationRow}>
                            <Text style={styles.verificationLabel}>Username</Text>
                            <Text style={styles.verificationValue}>{username}</Text>
                        </View>
                        <View style={styles.verificationRow}>
                            <Text style={styles.verificationLabel}>Phone</Text>
                            <Text style={styles.verificationValue}>{phoneNumber}</Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalBackButton}
                                onPress={() => setShowVerification(false)}
                                disabled={loading}
                            >
                                <Text style={styles.modalBackButtonText}>Go Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSubmitButton}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={Colors.dark.primaryForeground} size="small" />
                                ) : (
                                    <Text style={styles.modalSubmitButtonText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </KeyboardAvoidingView>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.inputContainer}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 48,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    stepIndicator: {
        fontSize: 14,
        color: Colors.dark.primary,
        fontWeight: '600',
        marginBottom: 8,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    fieldWrapper: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    addressLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 8,
    },
    addressFieldLabel: {
        marginBottom: 0,
        flexShrink: 1,
    },
    detectLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 4,
        minHeight: 28,
    },
    detectLocationText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.primary,
    },
    inputContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    passwordInputRow: {
        alignSelf: 'stretch',
        minWidth: 0,
        minHeight: 52,
    },
    addressInputContainer: {
        minHeight: 100,
        height: undefined,
        paddingVertical: 12,
        alignItems: 'stretch',
    },
    addressInput: {
        minHeight: 76,
    },
    usernameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        paddingHorizontal: 16,
        height: 52,
    },
    usernameInput: {
        flex: 1,
        minWidth: 0,
        backgroundColor: 'transparent',
        borderWidth: 0,
        paddingLeft: 0,
        paddingRight: 12,
    },
    usernameIcon: {
        marginLeft: 0,
    },
    usernameError: {
        fontSize: 12,
        color: Colors.dark.danger,
        marginTop: 6,
        marginLeft: 4,
    },
    usernameSuggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginLeft: 4,
        gap: 8,
    },
    usernameSuggestionText: {
        flex: 1,
        minWidth: 0,
        fontSize: 13,
        color: Colors.dark.textSecondary,
    },
    usernameSuggestionValue: {
        color: Colors.dark.text,
        fontWeight: '600',
    },
    usernameUseThis: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    usernameUseThisPressed: {
        opacity: 0.7,
    },
    usernameUseThisLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.primary,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    input: {
        flex: 1,
        minWidth: 0,
        color: Colors.dark.text,
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        alignItems: 'center',
    },
    backButton: {
        backgroundColor: Colors.dark.card,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 100,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    backButtonText: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: '600',
    },
    button: {
        backgroundColor: Colors.dark.primary,
        height: 56,
        borderRadius: 12,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonFlex: {
        flex: 1,
    },
    buttonText: {
        color: Colors.dark.primaryForeground,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
    },
    linkText: {
        color: Colors.dark.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.dark.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 24,
        textAlign: 'center',
    },
    verificationRow: {
        marginBottom: 16,
    },
    verificationLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
    },
    verificationValue: {
        fontSize: 16,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    modalBackButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    modalBackButtonText: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: '600',
    },
    modalSubmitButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.primary,
    },
    modalSubmitButtonText: {
        color: Colors.dark.primaryForeground,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

const STEPS = 2;

export default function RegisterScreen() {
    const [step, setStep] = useState(1);
    const [showVerification, setShowVerification] = useState(false);
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [pincode, setPincode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUp, setPendingCredentials } = useAuth();
    const router = useRouter();

    const validateStep1 = () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please fill in Username');
            return false;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Please fill in Email');
            return false;
        }
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
                            <FormField label="Username">
                                <TextInput
                                    style={styles.input}
                                    placeholder="Choose a username"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                />
                            </FormField>
                            <FormField label="Email">
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </FormField>
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
                            <FormField label="Address">
                                <TextInput
                                    style={styles.input}
                                    placeholder="City, State, Country"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    value={address}
                                    onChangeText={setAddress}
                                />
                            </FormField>
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
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create a password"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
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
                            style={[styles.button, step === 2 && styles.buttonFlex]}
                            onPress={handleContinue}
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
    inputContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    input: {
        flex: 1,
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

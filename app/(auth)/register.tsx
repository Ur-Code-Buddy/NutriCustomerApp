import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
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

    const handleRegister = async () => {
        const fields = [
            { value: username, label: 'Username' },
            { value: name, label: 'Name' },
            { value: email, label: 'Email' },
            { value: phoneNumber, label: 'Phone number' },
            { value: address, label: 'Address' },
            { value: pincode, label: 'Pincode' },
            { value: password, label: 'Password' },
        ];
        const missing = fields.find((f) => !f.value?.trim());
        if (missing) {
            Alert.alert('Error', `Please fill in ${missing.label}`);
            return;
        }

        if (!/^\d{10}$/.test(phoneNumber.trim())) {
            Alert.alert('Error', 'Phone number must be exactly 10 digits');
            return;
        }
        if (!/^\d{6}$/.test(pincode.trim())) {
            Alert.alert('Error', 'Pincode must be exactly 6 digits');
            return;
        }

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
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join NutriTiffin for fresh home-cooked meals</Text>
                </View>

                <View style={styles.form}>
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
                    <FormField label="Full Name">
                        <TextInput
                            style={styles.input}
                            placeholder="Your full name"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={name}
                            onChangeText={setName}
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

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.dark.primaryForeground} />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.linkText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
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
    button: {
        backgroundColor: Colors.dark.primary,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
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
});

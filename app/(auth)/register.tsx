import { useRouter } from 'expo-router';
import { Lock, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await signUp({ username, password });
            // Navigation is handled in AuthContext via segments
        } catch (error: any) {
            Alert.alert('Registration Failed', error.response?.data?.message || 'Could not create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join NutriTiffin for delicious meals</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <User color={Colors.dark.textSecondary} size={20} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock color={Colors.dark.textSecondary} size={20} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.dark.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.input,
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    icon: {
        marginRight: 12,
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
        shadowColor: Colors.dark.primary,
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

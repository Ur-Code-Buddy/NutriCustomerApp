import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { onAuthFailure } from '../lib/authFailure';
import { authService, getAuthToken, setAuthToken, userService } from '../services/api';
import { setupPushNotifications } from '../services/notifications';

export interface PendingCredentials {
    username: string;
    password: string;
}

export interface RegisterNeedsLogin {
    needsLogin: true;
    email: string;
}

interface AuthContextType {
    user: any | null;
    isLoading: boolean;
    isInitializing: boolean;
    pendingCredentials: PendingCredentials | null;
    signIn: (credentials: { username: string; password: string }) => Promise<void>;
    signUp: (userData: RegisterUserData) => Promise<RegisterNeedsLogin | void>;
    signOut: () => Promise<void>;
    /** Refetch GET /users/me, update in-memory user and SecureStore. Returns profile or null on failure. */
    refreshUser: () => Promise<any | null>;
    setPendingCredentials: (creds: PendingCredentials | null) => void;
    clearPendingCredentials: () => void;
}

export interface RegisterUserData {
    username: string;
    name: string;
    email: string;
    phone_number: string;
    address: string;
    pincode: string;
    password: string;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isInitializing: true,
    pendingCredentials: null,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
    refreshUser: async () => null,
    setPendingCredentials: () => { },
    clearPendingCredentials: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [pendingCredentials, setPendingCredentialsState] = useState<PendingCredentials | null>(null);
    const router = useRouter();
    const segments = useSegments();

    const setPendingCredentials = useCallback((creds: PendingCredentials | null) => {
        setPendingCredentialsState(creds);
    }, []);

    const clearPendingCredentials = useCallback(() => {
        setPendingCredentialsState(null);
    }, []);

    useEffect(() => {
        const unregister = onAuthFailure(() => setUser(null));

        const checkAuth = async () => {
            try {
                const token = await getAuthToken();
                const userData = await SecureStore.getItemAsync('user_data');
                if (token) {
                    try {
                        const profile = await userService.getProfile();
                        setUser(profile);
                        setupPushNotifications(token);
                        if (!userData) {
                            await SecureStore.setItemAsync('user_data', JSON.stringify(profile));
                        }
                    } catch (err: any) {
                        if (err?.response?.status === 401) {
                            setUser(null);
                        } else if (userData) {
                            setUser(JSON.parse(userData));
                        } else {
                            setUser({ token });
                        }
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setUser(null);
            } finally {
                setIsInitializing(false);
            }
        };

        checkAuth();
        return unregister;
    }, []);

    // Navigation Protection - only run after initial auth check
    useEffect(() => {
        if (isInitializing) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, isInitializing]);


    const signIn = async (credentials: any) => {
        const data = await authService.login(credentials);
        if (!data?.access_token) {
            throw new Error('Invalid credentials');
        }
        await setAuthToken(data.access_token);
        setupPushNotifications(data.access_token);
        if (data.user) {
            await SecureStore.setItemAsync('user_data', JSON.stringify(data.user));
            setUser(data.user);
        } else {
            setUser({ token: data.access_token });
        }
    };

    const signUp = async (userData: RegisterUserData): Promise<RegisterNeedsLogin | void> => {
        const data = await authService.register(userData);
        if (data?.access_token) {
            await signIn({ username: userData.username, password: userData.password });
            return;
        }
        return { needsLogin: true, email: userData.email };
    };

    const signOut = async () => {
        await authService.logout();
        await SecureStore.deleteItemAsync('user_data');
        setUser(null);
    };

    const refreshUser = useCallback(async () => {
        const token = await getAuthToken();
        if (!token) return null;
        try {
            const profile = await userService.getProfile();
            setUser(profile);
            await SecureStore.setItemAsync('user_data', JSON.stringify(profile));
            return profile;
        } catch {
            return null;
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading: isInitializing,
                isInitializing,
                pendingCredentials,
                signIn,
                signUp,
                signOut,
                refreshUser,
                setPendingCredentials,
                clearPendingCredentials,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

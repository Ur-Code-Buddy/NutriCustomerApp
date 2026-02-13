import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, getAuthToken, setAuthToken } from '../services/api';

interface AuthContextType {
    user: any | null;
    isLoading: boolean;
    signIn: (credentials: any) => Promise<void>;
    signUp: (userData: any) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await getAuthToken();
                if (token) {
                    // Ideally, validate token or fetch user profile here
                    // For now, we assume if token exists, user is logged in
                    setUser({ token });
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Navigation Protection
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // Redirect to the sign-in page.
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            // Redirect away from the sign-in page.
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);


    const signIn = async (credentials: any) => {
        try {
            const data = await authService.login(credentials);
            await setAuthToken(data.access_token);
            setUser(data.user || { token: data.access_token }); // Fallback if user object is missing
        } catch (error) {
            throw error;
        }
    };

    const signUp = async (userData: any) => {
        try {
            await authService.register(userData);
            // Auto login after register or redirect to login? 
            // Let's auto login for better UX
            await signIn({ username: userData.username, password: userData.password });
        } catch (error) {
            throw error;
        }
    };

    const signOut = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

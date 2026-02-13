import { LogOut, UserCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
    const { signOut, user } = useAuth();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <UserCircle size={80} color={Colors.dark.text} strokeWidth={1} />
                <Text style={styles.username}>Client User</Text>
                <Text style={styles.email}>client@example.com</Text>
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={styles.menuItem} onPress={signOut}>
                    <LogOut size={20} color={Colors.dark.danger} />
                    <Text style={[styles.menuText, { color: Colors.dark.danger }]}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginTop: 16,
    },
    email: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    section: {
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

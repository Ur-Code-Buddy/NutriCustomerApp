import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { LegalDocument } from '../../constants/legalDocuments';
import {
    useTabBarScrollProps,
    useTabBarScrollResetOnFocus,
} from '../../context/TabBarScrollContext';
import { useTabBarContentPadding } from '../../hooks/useTabBarContentPadding';

interface LegalDocumentScreenProps {
    document: LegalDocument;
}

export function LegalDocumentScreen({ document: doc }: LegalDocumentScreenProps) {
    const router = useRouter();
    const tabBarScrollProps = useTabBarScrollProps();
    const tabBarPadBottom = useTabBarContentPadding();
    useTabBarScrollResetOnFocus();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
                    <ChevronLeft size={28} color={Colors.dark.text} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {doc.title}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadBottom }]}
                showsVerticalScrollIndicator
                {...tabBarScrollProps}
            >
                <Text style={styles.lastUpdated}>Last updated: {doc.lastUpdated}</Text>
                <Text style={styles.intro}>{doc.intro}</Text>

                {doc.sections.map((section) => (
                    <View key={section.heading} style={styles.section}>
                        <Text style={styles.sectionHeading}>{section.heading}</Text>
                        {section.paragraphs.map((p, i) => (
                            <Text key={i} style={styles.paragraph}>
                                {p}
                            </Text>
                        ))}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingTop: 56,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    headerSpacer: {
        width: 28,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    lastUpdated: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginBottom: 16,
    },
    intro: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.dark.text,
        marginBottom: 24,
    },
    section: {
        marginBottom: 22,
    },
    sectionHeading: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.dark.primary,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.dark.textSecondary,
        marginBottom: 10,
    },
});

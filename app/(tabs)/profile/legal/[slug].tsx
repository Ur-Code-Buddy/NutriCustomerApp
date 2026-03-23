import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { LegalDocumentScreen } from '../../../../components/profile/LegalDocumentScreen';
import { getLegalDocument } from '../../../../constants/legalDocuments';

export default function LegalSlugScreen() {
    const params = useLocalSearchParams<{ slug?: string | string[] }>();
    const raw = params.slug;
    const slug = Array.isArray(raw) ? raw[0] : raw;
    const doc = slug ? getLegalDocument(slug) : null;

    if (!slug || !doc) {
        return <Redirect href="/(tabs)/profile" />;
    }

    return <LegalDocumentScreen document={doc} />;
}

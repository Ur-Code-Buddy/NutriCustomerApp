import { useRouter } from 'expo-router';
import { Maximize2, Navigation } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { premiumCardShadowSoft } from '../constants/appChrome';
import { Colors } from '../constants/Colors';
import { CLIENT_TRACKING_POLL_STATUSES } from '../constants/deliveryTracking';
import { useOrderTracking } from '../hooks/useOrderTracking';
import type { OrderStatus } from '../types/orderTracking';

type Props = {
    orderId: string;
    status: OrderStatus | string;
};

export default function DeliveryTrackingCard({ orderId, status }: Props) {
    const router = useRouter();
    const normalized = String(status || '').toUpperCase() as OrderStatus;
    const showTrackingUi = CLIENT_TRACKING_POLL_STATUSES.includes(normalized);

    const {
        tracking,
        polylineCoordinates,
        mapRegion,
        liveTrackingEndedByServer,
        routeHint,
        routeFallback,
        routeSummary,
        phaseLabel,
    } = useOrderTracking(orderId, showTrackingUi);

    if (!showTrackingUi) {
        return null;
    }

    const openFullMap = () => {
        router.push(`/order/${orderId}/tracking`);
    };

    if (Platform.OS === 'web') {
        return (
            <View style={[styles.card, premiumCardShadowSoft]}>
                <View style={styles.sectionHeader}>
                    <Navigation size={20} color={Colors.dark.primary} />
                    <Text style={styles.sectionTitle}>Track delivery</Text>
                </View>
                <Text style={styles.muted}>
                    Live map and route tracking run in the iOS/Android app. Open this order on your phone after pickup or
                    when it is out for delivery to see the driver and ETA (poll-based, ~5–10s updates on native).
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.card, premiumCardShadowSoft]}>
            <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeader}>
                    <Navigation size={20} color={Colors.dark.primary} />
                    <Text style={styles.sectionTitle}>Track delivery</Text>
                </View>
                {!liveTrackingEndedByServer ? (
                    <TouchableOpacity
                        style={styles.expandBtn}
                        onPress={openFullMap}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                    >
                        <Maximize2 size={18} color={Colors.dark.primary} />
                        <Text style={styles.expandBtnText}>Full map</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {liveTrackingEndedByServer ? (
                <Text style={styles.liveEnded}>
                    {tracking?.order_status === 'DELIVERED'
                        ? 'Delivered — live tracking has ended.'
                        : 'Live tracking has ended for this order.'}
                </Text>
            ) : null}

            {routeHint ? <Text style={styles.routeHint}>{routeHint}</Text> : null}
            {routeFallback ? <Text style={styles.routeFallback}>{routeFallback}</Text> : null}
            {routeSummary ? <Text style={styles.eta}>{routeSummary}</Text> : null}

            {mapRegion ? (
                <TouchableOpacity activeOpacity={0.95} onPress={openFullMap} disabled={liveTrackingEndedByServer}>
                    <MapView
                        style={styles.map}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        initialRegion={mapRegion}
                        region={mapRegion}
                        showsUserLocation
                        showsMyLocationButton={false}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                    >
                        {polylineCoordinates.length > 1 ? (
                            <Polyline
                                coordinates={polylineCoordinates}
                                strokeColor={Colors.dark.primary}
                                strokeWidth={4}
                            />
                        ) : null}
                        {tracking?.driver_position ? (
                            <Marker
                                coordinate={{
                                    latitude: tracking.driver_position.lat,
                                    longitude: tracking.driver_position.lng,
                                }}
                                title="Driver"
                                pinColor={Colors.dark.primary}
                                {...(tracking.driver_position.heading != null
                                    ? { rotation: tracking.driver_position.heading, flat: true as const }
                                    : {})}
                            />
                        ) : null}
                        {tracking?.destination ? (
                            <Marker
                                coordinate={{
                                    latitude: tracking.destination.latitude,
                                    longitude: tracking.destination.longitude,
                                }}
                                title={tracking.phase === 'TO_PICKUP' ? 'Pickup' : 'Your address'}
                                pinColor={Colors.dark.success}
                            />
                        ) : null}
                    </MapView>
                </TouchableOpacity>
            ) : (
                <Text style={styles.muted}>Waiting for driver location or destination…</Text>
            )}

            {phaseLabel ? <Text style={styles.phase}>{phaseLabel}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.dark.cardElevated,
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        color: Colors.dark.text,
        fontWeight: 'bold',
    },
    expandBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
        backgroundColor: Colors.dark.cardElevated,
    },
    expandBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    liveEnded: {
        color: Colors.dark.success,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 10,
    },
    routeHint: {
        color: '#FF9F0A',
        fontSize: 13,
        marginBottom: 8,
    },
    routeFallback: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    eta: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        marginBottom: 8,
    },
    map: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        marginTop: 4,
    },
    muted: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    phase: {
        marginTop: 10,
        fontSize: 13,
        color: Colors.dark.text,
        fontWeight: '600',
    },
});

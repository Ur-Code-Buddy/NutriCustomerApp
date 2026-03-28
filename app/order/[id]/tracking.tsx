import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { premiumCardShadowSoft, SCREEN_PADDING_H } from '../../../constants/appChrome';
import { Colors } from '../../../constants/Colors';
import { isClientTrackingOrderStatus } from '../../../constants/deliveryTracking';
import { useOrderTracking } from '../../../hooks/useOrderTracking';
import { orderService } from '../../../services/api';

export default function OrderTrackingMapScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(true);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await orderService.getById(String(id));
                if (!cancelled) setOrderStatus(String(data?.status || '').toUpperCase());
            } catch {
                if (!cancelled) {
                    Alert.alert('Error', 'Could not load order');
                    router.back();
                }
            } finally {
                if (!cancelled) setLoadingOrder(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, router]);

    const normalized = orderStatus ?? '';
    const isTrackable = isClientTrackingOrderStatus(normalized);

    const {
        tracking,
        polylineCoordinates,
        mapRegion,
        liveTrackingEndedByServer,
        routeHint,
        routeFallback,
        routeSummary,
        phaseLabel,
    } = useOrderTracking(String(id ?? ''), isTrackable && !loadingOrder && Boolean(id));

    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, styles.centeredWeb]}>
                <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
                        <ChevronLeft size={28} color={Colors.dark.text} strokeWidth={2} />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerEyebrow}>Live</Text>
                        <Text style={styles.headerTitle}>Map</Text>
                    </View>
                    <View style={{ width: 28 }} />
                </View>
                <View style={styles.webBody}>
                    <Text style={styles.panelSectionTitle}>Track delivery</Text>
                    <Text style={styles.muted}>
                        Live maps run in the iOS/Android app. Open this order on a device after pickup or when it is out
                        for delivery.
                    </Text>
                </View>
            </View>
        );
    }

    if (loadingOrder || !id) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    if (!isTrackable) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
                        <ChevronLeft size={28} color={Colors.dark.text} strokeWidth={2} />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerEyebrow}>Live</Text>
                        <Text style={styles.headerTitle}>Map</Text>
                    </View>
                    <View style={{ width: 28 }} />
                </View>
                <View style={styles.blockedBody}>
                    <Text style={styles.panelSectionTitle}>Not available</Text>
                    <Text style={styles.muted}>
                        Live tracking is only available while your order is picked up or out for delivery.
                    </Text>
                    <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.7}>
                        <Text style={styles.backLinkText}>Back to order</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={StyleSheet.absoluteFill}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={
                    mapRegion ?? {
                        latitude: 19.076,
                        longitude: 72.8777,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }
                }
                region={mapRegion ?? undefined}
                showsUserLocation
                showsMyLocationButton={false}
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

            <View style={[styles.headerOverlay, { paddingTop: insets.top + 4 }]} pointerEvents="box-none">
                <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => router.back()}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={28} color={Colors.dark.text} strokeWidth={2} />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerEyebrow}>Live</Text>
                    <Text style={styles.headerTitle}>Map</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <View
                style={[
                    styles.bottomPanel,
                    premiumCardShadowSoft,
                    { paddingBottom: Math.max(insets.bottom, 16) + 8 },
                ]}
                pointerEvents="box-none"
            >
                {liveTrackingEndedByServer ? (
                    <Text style={styles.liveEnded}>
                        {tracking?.order_status === 'DELIVERED'
                            ? 'Delivered — live tracking has ended.'
                            : 'Live tracking has ended for this order.'}
                    </Text>
                ) : null}

                {routeHint ? <Text style={styles.routeHint}>{routeHint}</Text> : null}
                {routeFallback ? <Text style={styles.routeFallback}>{routeFallback}</Text> : null}
                {routeSummary ? <Text style={styles.routeSummary}>{routeSummary}</Text> : null}

                {!mapRegion && !liveTrackingEndedByServer ? (
                    <Text style={styles.muted}>Waiting for driver location or destination…</Text>
                ) : null}

                {phaseLabel ? <Text style={styles.phaseLabel}>{phaseLabel}</Text> : null}

                <Text style={styles.panelSectionTitle}>Status</Text>
                <Text style={styles.statusLine}>{tracking?.order_status ?? normalized}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
    centeredWeb: {
        justifyContent: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SCREEN_PADDING_H,
        paddingBottom: 14,
        backgroundColor: Colors.dark.background,
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SCREEN_PADDING_H,
        paddingBottom: 10,
        backgroundColor: 'rgba(15,15,15,0.72)',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.dark.border,
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitles: {
        alignItems: 'center',
    },
    headerEyebrow: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.dark.primary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: -0.4,
        marginTop: 2,
    },
    bottomPanel: {
        position: 'absolute',
        left: SCREEN_PADDING_H,
        right: SCREEN_PADDING_H,
        bottom: 0,
        backgroundColor: Colors.dark.cardElevated,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderBottomWidth: 0,
        paddingHorizontal: 18,
        paddingTop: 16,
        maxHeight: '42%',
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
    routeSummary: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
        marginBottom: 10,
        fontWeight: '500',
    },
    muted: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    phaseLabel: {
        fontSize: 13,
        color: Colors.dark.text,
        fontWeight: '600',
        marginBottom: 14,
    },
    panelSectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.dark.textSecondary,
        marginBottom: 6,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    statusLine: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    webBody: {
        paddingHorizontal: SCREEN_PADDING_H,
        paddingTop: 8,
    },
    blockedBody: {
        flex: 1,
        paddingHorizontal: SCREEN_PADDING_H,
        paddingTop: 24,
    },
    backLink: {
        alignSelf: 'flex-start',
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 999,
        backgroundColor: Colors.dark.primary,
        borderWidth: 1,
        borderColor: Colors.dark.primaryBorder,
    },
    backLinkText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.dark.primaryForeground,
    },
});

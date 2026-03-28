import { Navigation } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Colors } from '../constants/Colors';
import {
    CLIENT_TRACKING_POLL_STATUSES,
    formatDistanceMeters,
    formatDurationSeconds,
    isClientTrackingOrderStatus,
    TRACKING_POLL_MS,
} from '../constants/deliveryTracking';
import { decodeEncodedPolyline } from '../helpers/decodePolyline';
import { orderService } from '../services/api';
import type { OrderStatus, OrderTrackingSnapshot } from '../types/orderTracking';

type Props = {
    orderId: string;
    status: OrderStatus | string;
};

function regionForPoints(points: { latitude: number; longitude: number }[]): Region | null {
    if (points.length === 0) return null;
    let minLat = points[0].latitude;
    let maxLat = minLat;
    let minLng = points[0].longitude;
    let maxLng = minLng;
    for (const p of points) {
        minLat = Math.min(minLat, p.latitude);
        maxLat = Math.max(maxLat, p.latitude);
        minLng = Math.min(minLng, p.longitude);
        maxLng = Math.max(maxLng, p.longitude);
    }
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const latDelta = Math.max((maxLat - minLat) * 1.35, 0.015);
    const lngDelta = Math.max((maxLng - minLng) * 1.35, 0.015);
    return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
    };
}

export default function DeliveryTrackingCard({ orderId, status }: Props) {
    const [tracking, setTracking] = useState<OrderTrackingSnapshot | null>(null);
    const normalized = String(status || '').toUpperCase() as OrderStatus;
    const showTrackingUi = CLIENT_TRACKING_POLL_STATUSES.includes(normalized);

    useEffect(() => {
        if (!showTrackingUi) {
            setTracking(null);
            return;
        }

        let cancelled = false;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const stopPolling = () => {
            if (intervalId != null) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        const tick = async () => {
            try {
                const snap = await orderService.getTracking(orderId);
                if (cancelled) return;
                /** Guide §6: stop when order leaves trackable states (e.g. DELIVERED) even if parent order payload is stale. */
                if (!CLIENT_TRACKING_POLL_STATUSES.includes(snap.order_status)) {
                    setTracking(snap);
                    stopPolling();
                    return;
                }
                setTracking(snap);
            } catch {
                /* 400/403/404 or network — keep last snapshot if any */
            }
        };

        void tick();
        intervalId = setInterval(() => void tick(), TRACKING_POLL_MS);
        return () => {
            cancelled = true;
            stopPolling();
        };
    }, [orderId, showTrackingUi]);

    const polylineCoordinates = useMemo(() => {
        const enc = tracking?.route?.encodedPolyline;
        if (!enc) return [];
        try {
            return decodeEncodedPolyline(enc);
        } catch {
            return [];
        }
    }, [tracking?.route?.encodedPolyline]);

    const mapRegion = useMemo(() => {
        const pts: { latitude: number; longitude: number }[] = [];
        if (tracking?.driver_position) {
            pts.push({
                latitude: tracking.driver_position.lat,
                longitude: tracking.driver_position.lng,
            });
        }
        if (tracking?.destination) {
            pts.push({
                latitude: tracking.destination.latitude,
                longitude: tracking.destination.longitude,
            });
        }
        if (polylineCoordinates.length > 1) {
            return regionForPoints(polylineCoordinates);
        }
        return regionForPoints(pts);
    }, [tracking?.destination, tracking?.driver_position, polylineCoordinates]);

    if (!showTrackingUi) {
        return null;
    }

    const routeHint = tracking?.route_error ?? null;
    const route = tracking?.route ?? null;
    /** Snapshot says live tracking ended server-side (guide §6 — stop on DELIVERED). */
    const liveTrackingEndedByServer =
        tracking != null && !isClientTrackingOrderStatus(tracking.order_status);
    const routeFallback =
        route == null && !routeHint && tracking?.driver_position
            ? 'Route unavailable — driver location may still update.'
            : null;
    const etaClock =
        route?.eta != null
            ? new Date(route.eta).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : null;
    const routeSummary =
        route != null
            ? [
                  formatDistanceMeters(route.distanceMeters),
                  etaClock ? `ETA ${etaClock}` : formatDurationSeconds(route.durationSeconds),
              ].join(' · ')
            : null;

    if (Platform.OS === 'web') {
        return (
            <View style={styles.card}>
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
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Navigation size={20} color={Colors.dark.primary} />
                <Text style={styles.sectionTitle}>Track delivery</Text>
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
                <MapView
                    style={styles.map}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    initialRegion={mapRegion}
                    region={mapRegion}
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
            ) : (
                <Text style={styles.muted}>Waiting for driver location or destination…</Text>
            )}

            {tracking?.phase ? (
                <Text style={styles.phase}>
                    {tracking.phase === 'TO_PICKUP' ? 'Driver heading to kitchen' : 'Driver heading to you'}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        color: Colors.dark.text,
        fontWeight: 'bold',
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

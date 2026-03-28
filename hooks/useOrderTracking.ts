import { useEffect, useMemo, useState } from 'react';
import type { Region } from 'react-native-maps';
import {
    CLIENT_TRACKING_POLL_STATUSES,
    formatDistanceMeters,
    formatDurationSeconds,
    isClientTrackingOrderStatus,
    TRACKING_POLL_MS,
} from '../constants/deliveryTracking';
import { decodeEncodedPolyline } from '../helpers/decodePolyline';
import { orderService } from '../services/api';
import type { OrderTrackingSnapshot } from '../types/orderTracking';

export function regionForPoints(points: { latitude: number; longitude: number }[]): Region | null {
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

export type UseOrderTrackingResult = {
    tracking: OrderTrackingSnapshot | null;
    polylineCoordinates: { latitude: number; longitude: number }[];
    mapRegion: Region | null;
    liveTrackingEndedByServer: boolean;
    routeHint: string | null;
    routeFallback: string | null;
    routeSummary: string | null;
    phaseLabel: string | null;
};

/**
 * Polls GET /orders/:id/tracking while `enabled` (e.g. PICKED_UP / OUT_FOR_DELIVERY).
 * Stops when snapshot order_status leaves client-trackable set.
 */
export function useOrderTracking(orderId: string, enabled: boolean): UseOrderTrackingResult {
    const [tracking, setTracking] = useState<OrderTrackingSnapshot | null>(null);

    useEffect(() => {
        if (!enabled || !orderId) {
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
    }, [orderId, enabled]);

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

    const route = tracking?.route ?? null;
    const routeHint = tracking?.route_error ?? null;
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

    const phaseLabel =
        tracking?.phase === 'TO_PICKUP'
            ? 'Driver heading to kitchen'
            : tracking?.phase === 'TO_DROPOFF'
              ? 'Driver heading to you'
              : null;

    return {
        tracking,
        polylineCoordinates,
        mapRegion,
        liveTrackingEndedByServer,
        routeHint,
        routeFallback,
        routeSummary,
        phaseLabel,
    };
}

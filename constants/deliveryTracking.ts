import type { OrderStatus } from '../types/orderTracking';

/**
 * Client JWT: backend allows GET /orders/:id/tracking only in these statuses
 * (see live-delivery guide §4 — customer row).
 */
export const CLIENT_TRACKING_POLL_STATUSES: OrderStatus[] = ['PICKED_UP', 'OUT_FOR_DELIVERY'];

export function isClientTrackingOrderStatus(s: string | undefined | null): boolean {
    if (!s) return false;
    return CLIENT_TRACKING_POLL_STATUSES.includes(String(s).toUpperCase() as OrderStatus);
}

/** GET /orders/:id/tracking poll interval (guide: every 5–10s) */
export const TRACKING_POLL_MS = 7500;

/** Format driving distance for India (metric). */
export function formatDistanceMeters(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    const km = meters / 1000;
    return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** Short label for remaining duration. */
export function formatDurationSeconds(seconds: number): string {
    if (seconds < 60) return '< 1 min';
    const m = Math.round(seconds / 60);
    return m === 1 ? '~1 min' : `~${m} min`;
}

/** Order statuses returned on orders / tracking DTOs */
export type OrderStatus =
    | 'PENDING'
    | 'ACCEPTED'
    | 'READY'
    | 'PICKED_UP'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'REJECTED';

/** GET /orders/:id/tracking — matches backend TrackingSnapshotDto */
export type OrderTrackingPhase = 'TO_PICKUP' | 'TO_DROPOFF';

export interface OrderTrackingDriverPosition {
    lat: number;
    lng: number;
    heading: number | null;
    recordedAt: string;
}

export interface OrderTrackingRoute {
    encodedPolyline: string;
    distanceMeters: number;
    durationSeconds: number;
    eta: string | null;
}

export interface OrderTrackingSnapshot {
    order_id: string;
    order_status: OrderStatus;
    phase: OrderTrackingPhase;
    driver_position: OrderTrackingDriverPosition | null;
    destination: {
        latitude: number;
        longitude: number;
        label: string;
    } | null;
    route: OrderTrackingRoute | null;
    route_error: string | null;
}

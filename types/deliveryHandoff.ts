/** GET /orders/:id/delivery-handoff-otp — CLIENT only; valid while OUT_FOR_DELIVERY */
export interface DeliveryHandoffOtpResponse {
    otp: string;
    expires_in_seconds: number;
}

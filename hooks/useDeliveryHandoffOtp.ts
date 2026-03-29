import { useCallback, useEffect, useRef, useState } from 'react';
import { orderService } from '../services/api';

type HandoffState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; otp: string; expiresAt: number };

function formatHandoffError(e: unknown): string {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    const m = err?.response?.data?.message ?? err?.message;
    return typeof m === 'string' && m.length > 0 ? m : 'Could not load handoff code';
}

/**
 * Fetches delivery handoff OTP while the order is OUT_FOR_DELIVERY.
 * Refreshes automatically when the server-provided window expires.
 */
export function useDeliveryHandoffOtp(orderId: string | undefined, enabled: boolean) {
    const [state, setState] = useState<HandoffState>({ status: 'idle' });
    const [, bumpTick] = useState(0);
    const refreshLock = useRef(false);

    const load = useCallback(async () => {
        if (!orderId || !enabled) return;
        setState({ status: 'loading' });
        try {
            const r = await orderService.getDeliveryHandoffOtp(orderId);
            const sec = Math.max(0, Number(r.expires_in_seconds) || 0);
            setState({ status: 'ready', otp: String(r.otp ?? ''), expiresAt: Date.now() + sec * 1000 });
        } catch (e) {
            setState({ status: 'error', message: formatHandoffError(e) });
        }
    }, [orderId, enabled]);

    useEffect(() => {
        refreshLock.current = false;
        if (!enabled || !orderId) {
            setState({ status: 'idle' });
            return;
        }
        load();
    }, [enabled, orderId, load]);

    const readyExpiresAt = state.status === 'ready' ? state.expiresAt : 0;

    useEffect(() => {
        if (state.status !== 'ready') return;
        const id = setInterval(() => bumpTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, [state.status, readyExpiresAt]);

    const secondsRemaining =
        state.status === 'ready' ? Math.max(0, Math.ceil((state.expiresAt - Date.now()) / 1000)) : 0;

    useEffect(() => {
        if (state.status !== 'ready' || secondsRemaining > 0 || !enabled || !orderId) return;
        if (refreshLock.current) return;
        refreshLock.current = true;
        (async () => {
            try {
                const r = await orderService.getDeliveryHandoffOtp(orderId);
                const sec = Math.max(0, Number(r.expires_in_seconds) || 0);
                setState({ status: 'ready', otp: String(r.otp ?? ''), expiresAt: Date.now() + sec * 1000 });
            } catch (e) {
                setState({ status: 'error', message: formatHandoffError(e) });
            } finally {
                refreshLock.current = false;
            }
        })();
    }, [secondsRemaining, state.status, enabled, orderId]);

    const refetch = useCallback(() => {
        refreshLock.current = false;
        load();
    }, [load]);

    return { state, secondsRemaining, refetch };
}

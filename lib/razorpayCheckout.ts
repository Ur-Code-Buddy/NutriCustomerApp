import { NativeModules } from 'react-native';

export type RazorpaySuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function normalizeSuccess(data: Record<string, unknown>): RazorpaySuccessPayload {
  const orderId = (data.razorpay_order_id ?? data.razorpayOrderId) as string | undefined;
  const paymentId = (data.razorpay_payment_id ?? data.razorpayPaymentId) as string | undefined;
  const signature = (data.razorpay_signature ?? data.razorpaySignature) as string | undefined;
  if (!orderId || !paymentId || !signature) {
    throw new Error('Razorpay returned an incomplete success payload.');
  }
  return {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  };
}

/** True when the native Razorpay module is linked (custom native build — not Expo Go). */
export function isRazorpayNativeAvailable(): boolean {
  return !!NativeModules.RNRazorpayCheckout;
}

export type OpenRazorpayParams = {
  key: string;
  orderId: string;
  /** Amount in paise; must match the Razorpay order created by the backend. */
  amountPaise: number;
  name?: string;
  description?: string;
  prefill?: { email?: string; contact?: string; name?: string };
  themeColor?: string;
};

/**
 * Opens Razorpay Standard Checkout via the official react-native-razorpay native module.
 * Requires native linking: EAS preview/production(-apk) or `expo run:*` after prebuild — not Expo Go.
 */
export async function openRazorpayCheckout(params: OpenRazorpayParams): Promise<RazorpaySuccessPayload> {
  if (!isRazorpayNativeAvailable()) {
    throw new Error(
      'Razorpay native module is not available. Use a release/preview EAS build or expo run:android after prebuild — Expo Go does not ship this native code.',
    );
  }

  // Require here, not at module load: react-native-razorpay touches NativeEventEmitter at import time
  // and crashes Expo Go / any environment without the native module before cart.tsx can export default.
  const RazorpayCheckout = require('react-native-razorpay').default as {
    open: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };

  const amountPaise = Math.max(1, Math.round(params.amountPaise));
  const options: Record<string, unknown> = {
    description: params.description ?? 'NutriTiffin order',
    currency: 'INR',
    key: params.key,
    amount: String(amountPaise),
    name: params.name ?? 'NutriTiffin',
    order_id: params.orderId,
    prefill: params.prefill ?? {},
    theme: { color: params.themeColor ?? '#22c55e' },
  };

  const raw = (await RazorpayCheckout.open(options)) as Record<string, unknown>;
  return normalizeSuccess(raw);
}

export function isUserCancelledRazorpayError(err: unknown): boolean {
  const e = err as { code?: number | string; description?: string; error?: { description?: string } };
  const code = e?.code;
  if (code === 0 || code === '0' || code === 'PAYMENT_CANCELLED') return true;
  const msg = (e?.description ?? e?.error?.description ?? '').toLowerCase();
  return msg.includes('cancel');
}

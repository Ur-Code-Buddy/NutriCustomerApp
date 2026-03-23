import { isAxiosError } from 'axios';
import type { PaymentConfirmBody } from '../services/api';
import { paymentService } from '../services/api';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Retries confirm on transient network failures (payment already succeeded client-side).
 * Does not retry 4xx/5xx responses that indicate validation/signature errors — those are thrown immediately.
 */
export async function confirmPaymentWithRetry(
  body: PaymentConfirmBody,
  options?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<unknown> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 800;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await paymentService.confirm(body);
    } catch (err) {
      lastError = err;
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status !== undefined && status < 500) {
          throw err;
        }
      }
      if (attempt < maxAttempts - 1) {
        await sleep(baseDelayMs * (attempt + 1));
      }
    }
  }

  throw lastError;
}

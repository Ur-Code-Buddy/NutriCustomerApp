/** Public contact endpoint — not the main API base URL; no app JWT. */
export const CONTACT_API_URL = 'https://emailbackend.v1.nutritiffin.com/contact';

export interface ContactFormPayload {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export class ContactSubmissionError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = 'ContactSubmissionError';
        this.status = status;
        this.body = body;
    }
}

/** Join FastAPI `detail` array items' `msg` for user-visible copy. */
export function formatContactDetailMessage(detail: unknown): string | null {
    if (typeof detail === 'string' && detail.trim()) {
        return detail.trim();
    }
    if (!Array.isArray(detail)) return null;
    const msgs = detail
        .map((item) => (item && typeof item === 'object' && 'msg' in item ? (item as { msg: unknown }).msg : null))
        .filter((m): m is string => typeof m === 'string' && m.length > 0);
    return msgs.length > 0 ? msgs.join(' ') : null;
}

function messageFromResponseBody(data: unknown, fallback: string): string {
    if (!data || typeof data !== 'object') return fallback;
    const detailMsg = formatContactDetailMessage((data as { detail?: unknown }).detail);
    return detailMsg ?? fallback;
}

export async function submitContactForm(payload: ContactFormPayload): Promise<{ message: string }> {
    const res = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: unknown = {};
    if (text) {
        try {
            data = JSON.parse(text) as unknown;
        } catch {
            data = { raw: text };
        }
    }

    if (!res.ok) {
        const fallback = "Couldn't send, try again.";
        throw new ContactSubmissionError(messageFromResponseBody(data, fallback), res.status, data);
    }

    const msg =
        data &&
        typeof data === 'object' &&
        'message' in data &&
        typeof (data as { message: unknown }).message === 'string'
            ? (data as { message: string }).message
            : "Thanks, we received your report.";

    return { message: msg };
}

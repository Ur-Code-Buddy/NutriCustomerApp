import Constants from 'expo-constants';
import { submitContactForm } from './contactApi';

export const BUG_REPORT_SUBJECT = 'Bug report — Nutri Tiffin';

export interface BugReportUser {
    username?: string | null;
    name?: string | null;
    email?: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidReplyEmail(email: string): boolean {
    return EMAIL_REGEX.test(email.trim());
}

export function resolveContactDisplayName(user: BugReportUser, resolvedEmail: string): string {
    const fromProfile = String(user.username || user.name || '').trim();
    if (fromProfile) return fromProfile;
    const local = resolvedEmail.split('@')[0]?.trim();
    if (local) return local;
    return 'User';
}

function appendAppVersion(userMessage: string): string {
    const version = Constants.expoConfig?.version ?? 'unknown';
    return `${userMessage}\n\nApp version: ${version}`;
}

export interface SubmitBugReportParams {
    description: string;
    user: BugReportUser;
    /** Required only when profile has no email (Option A). */
    manualEmail?: string;
}

export type SubmitBugReportResult =
    | { ok: true; message: string }
    | { ok: false; error: string; field?: 'description' | 'email' };

export async function submitBugReport(params: SubmitBugReportParams): Promise<SubmitBugReportResult> {
    const trimmedDescription = params.description.trim();
    if (trimmedDescription.length < 10) {
        return {
            ok: false,
            error: 'Please use at least 10 characters to describe what happened.',
            field: 'description',
        };
    }

    const profileEmail = String(params.user.email ?? '').trim();
    const manual = String(params.manualEmail ?? '').trim();
    const email = profileEmail || manual;

    if (!email) {
        return {
            ok: false,
            error: 'We need an email so we can reply. Add one in your profile or enter it below.',
            field: 'email',
        };
    }

    if (!isValidReplyEmail(email)) {
        return { ok: false, error: 'Enter a valid email address.', field: 'email' };
    }

    const name = resolveContactDisplayName(params.user, email);

    const message = appendAppVersion(trimmedDescription);

    try {
        const { message: serverMessage } = await submitContactForm({
            name,
            email: email.trim(),
            subject: BUG_REPORT_SUBJECT,
            message,
        });
        return { ok: true, message: serverMessage };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Couldn't send, try again.";
        return { ok: false, error: msg };
    }
}

/**
 * Must stay in sync with POST /auth/register email domain rules on the backend.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ALLOWED_REGISTRATION_EMAIL_DOMAINS = [
    'gmail.com',
    'yopmail.com',
    'hotmail.com',
] as const;

/**
 * @returns Error message to show the user, or null if the email is allowed for registration.
 */
export function getRegistrationEmailDomainError(email: string): string | null {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
        return null;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
        return 'Enter a valid email address.';
    }
    const at = trimmed.lastIndexOf('@');
    const domain = at >= 0 ? trimmed.slice(at + 1) : '';
    if (!domain) {
        return 'Enter a valid email address.';
    }
    const allowed = ALLOWED_REGISTRATION_EMAIL_DOMAINS as readonly string[];
    if (allowed.includes(domain)) {
        return null;
    }
    return `Email domain @${domain} is not allowed. Allowed domains are: ${allowed.join(', ')}`;
}

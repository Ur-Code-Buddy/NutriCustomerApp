/**
 * In-app legal copy for the customer app. Replace company name, contact email,
 * and jurisdiction details with your final legal review before production.
 */

export interface LegalSection {
    heading: string;
    paragraphs: string[];
}

export interface LegalDocument {
    title: string;
    lastUpdated: string;
    intro: string;
    sections: LegalSection[];
}

export const LEGAL_LAST_UPDATED = '23 March 2026';

export const privacyPolicy: LegalDocument = {
    title: 'Privacy Policy',
    lastUpdated: LEGAL_LAST_UPDATED,
    intro:
        'This Privacy Policy describes how we collect, use, store, and protect your personal information when you use our mobile application and related services. By using the app, you agree to the practices described below.',
    sections: [
        {
            heading: 'Information we collect',
            paragraphs: [
                'Account details you provide, such as name, email address, phone number, delivery address, and pincode.',
                'Order and transaction information, including items ordered, amounts paid, payment method type (we do not store full card numbers on our servers when payments are processed by a certified provider), credits or wallet balance where applicable, and order status.',
                'Device and usage data such as app version, device type, and diagnostic logs to improve reliability and security.',
                'Communications you send us through support channels.',
            ],
        },
        {
            heading: 'How we use your information',
            paragraphs: [
                'To create and manage your account, authenticate you, and provide customer support.',
                'To process and deliver orders, send order updates, and handle refunds or cancellations in line with our policies.',
                'To improve our services, analyse aggregated usage trends, and fix technical issues.',
                'To comply with legal obligations and respond to lawful requests from authorities.',
                'With your consent where required, to send promotional messages. You may opt out of marketing where applicable.',
            ],
        },
        {
            heading: 'Sharing of information',
            paragraphs: [
                'We may share limited information with kitchens or delivery partners as needed to fulfil your order (for example, name, phone, and address).',
                'We use trusted service providers (e.g. hosting, analytics, payment processors) who process data on our instructions and are bound by confidentiality and security obligations.',
                'We may disclose information if required by law or to protect our rights, users, or the public.',
                'We do not sell your personal information to third parties for their independent marketing.',
            ],
        },
        {
            heading: 'Data retention and security',
            paragraphs: [
                'We retain information for as long as your account is active and as needed to provide services, meet legal requirements, resolve disputes, and enforce our agreements.',
                'We implement appropriate technical and organisational measures to protect your data. No method of transmission or storage is completely secure; we encourage strong passwords and device security.',
            ],
        },
        {
            heading: 'Your choices and rights',
            paragraphs: [
                'You may update certain profile information in the app. You may request access, correction, or deletion of your personal data where applicable law allows, subject to legitimate business or legal retention needs.',
                'You can disable optional permissions (e.g. notifications) through your device settings where supported.',
            ],
        },
        {
            heading: 'Children',
            paragraphs: [
                'Our services are not directed at children under the age required by applicable law to enter into contracts without parental consent. We do not knowingly collect personal information from such children.',
            ],
        },
        {
            heading: 'Changes to this policy',
            paragraphs: [
                'We may update this Privacy Policy from time to time. We will post the updated version in the app and may adjust the “Last updated” date. Continued use after changes constitutes acceptance where permitted by law.',
            ],
        },
        {
            heading: 'Contact',
            paragraphs: [
                'For privacy-related questions or requests, contact us using the support details provided in the app or on our website.',
            ],
        },
    ],
};

export const termsAndConditions: LegalDocument = {
    title: 'Terms & Conditions',
    lastUpdated: LEGAL_LAST_UPDATED,
    intro:
        'These Terms & Conditions (“Terms”) govern your access to and use of our mobile application, website (if any), and related services. Please read them carefully. If you do not agree, do not use the services.',
    sections: [
        {
            heading: 'Eligibility and account',
            paragraphs: [
                'You must be legally able to enter a binding contract in your jurisdiction. You agree to provide accurate registration information and to keep it updated.',
                'You are responsible for maintaining the confidentiality of your account credentials and for activity under your account. Notify us promptly of any unauthorised use.',
            ],
        },
        {
            heading: 'The service',
            paragraphs: [
                'We provide a platform to discover kitchens or vendors, place orders, and manage deliveries or pickups as offered in the app. Availability of items, kitchens, and delivery areas may vary.',
                'We may modify, suspend, or discontinue features with reasonable notice where practicable. We are not liable for third-party services outside our control (e.g. payment networks, carrier networks).',
            ],
        },
        {
            heading: 'Orders, pricing, and payment',
            paragraphs: [
                'When you place an order, you offer to purchase the selected items at the prices shown, plus applicable taxes and fees. We or the kitchen may accept or reject orders; acceptance may be confirmed in the app.',
                'Prices and descriptions are subject to change before checkout. You authorise us and our payment partners to charge your selected payment method for the total amount due.',
                'Credits or wallet balances, if offered, are governed by in-app rules and may expire or be adjusted as disclosed at the time of grant or in these Terms.',
            ],
        },
        {
            heading: 'Delivery and pickup',
            paragraphs: [
                'Estimated delivery or ready times are indicative and not guaranteed. You are responsible for providing a correct address and being available to receive the order or to collect it when pickup is selected.',
                'Risk of loss for goods may pass to you upon delivery to the address or handover at pickup, as applicable under our operational policy.',
            ],
        },
        {
            heading: 'Prohibited conduct',
            paragraphs: [
                'You agree not to misuse the service: no fraud, harassment, illegal activity, scraping or automated abuse, circumvention of security, or interference with other users or our systems.',
                'We may suspend or terminate accounts that violate these Terms or pose risk to the platform.',
            ],
        },
        {
            heading: 'Intellectual property',
            paragraphs: [
                'The app, branding, and content we provide are owned by us or our licensors. You receive a limited, non-exclusive, non-transferable licence to use the app for personal, non-commercial purposes in line with these Terms.',
            ],
        },
        {
            heading: 'Disclaimer and limitation of liability',
            paragraphs: [
                'The service is provided on an “as is” and “as available” basis to the fullest extent permitted by law. We disclaim implied warranties where allowable.',
                'To the maximum extent permitted by applicable law, we and our affiliates are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits or data, arising from your use of the service.',
                'Our aggregate liability for claims relating to the service is limited to the amount you paid us for the specific order or transaction giving rise to the claim in the three months preceding the claim, or as otherwise required by mandatory law.',
            ],
        },
        {
            heading: 'Indemnity',
            paragraphs: [
                'You agree to indemnify and hold harmless us and our affiliates from claims, damages, and expenses (including reasonable legal fees) arising from your violation of these Terms, misuse of the service, or violation of third-party rights.',
            ],
        },
        {
            heading: 'Governing law and disputes',
            paragraphs: [
                'These Terms are governed by the laws of India, without regard to conflict-of-law rules, unless mandatory consumer protections in your jurisdiction require otherwise.',
                'Courts at a location we specify (e.g. principal place of business) shall have exclusive jurisdiction, subject to non-waivable rights you may have as a consumer.',
            ],
        },
        {
            heading: 'Changes',
            paragraphs: [
                'We may update these Terms. Material changes may be communicated through the app. Continued use after the effective date may constitute acceptance where permitted by law.',
            ],
        },
        {
            heading: 'Contact',
            paragraphs: [
                'For questions about these Terms, contact us through the support options provided in the app.',
            ],
        },
    ],
};

export const refundAndCancellation: LegalDocument = {
    title: 'Refund & Cancellation',
    lastUpdated: LEGAL_LAST_UPDATED,
    intro:
        'This policy explains how order cancellation, refunds, and credits work for purchases made through our app. It applies together with our Terms & Conditions and any checkout notices.',
    sections: [
        {
            heading: 'Cancellation by you',
            paragraphs: [
                'You may request cancellation of an order through the app while the order status allows cancellation (for example, before the kitchen has started preparing the order). Once preparation or fulfilment has begun, cancellation may not be available.',
                'If cancellation is accepted before charge or capture, no payment will be taken or a pending authorisation will be released according to your bank’s timelines.',
                'If you paid and cancellation is accepted after payment, we will initiate a refund as described below.',
            ],
        },
        {
            heading: 'Cancellation or changes by us or the kitchen',
            paragraphs: [
                'We or the kitchen may cancel or modify an order if an item is unavailable, there is a pricing or system error, delivery is not feasible, or for safety, legal, or operational reasons.',
                'In such cases you will not be charged for undelivered items, or if already charged, a refund or account credit will be issued as applicable.',
            ],
        },
        {
            heading: 'Refunds',
            paragraphs: [
                'Approved refunds are typically processed to the original payment method. Processing times depend on banks and payment partners and may take several business days after we initiate the refund.',
                'If you paid using app credits or wallet balance, refunds may be restored to your in-app balance unless otherwise required by law or stated at checkout.',
                'Partial refunds may apply when only part of an order could not be fulfilled.',
            ],
        },
        {
            heading: 'Quality and order issues',
            paragraphs: [
                'If you receive incorrect, missing, or materially defective items, report the issue promptly through the app’s support or order help flow with relevant details (order ID, photos if requested).',
                'We may offer a replacement, partial or full refund, or credit after review. Decisions are made in good faith based on order records and available evidence.',
            ],
        },
        {
            heading: 'Non-refundable cases',
            paragraphs: [
                'Generally, refunds are not provided for change of mind after food has been prepared or delivered, except where required by law or at our discretion.',
                'Promotional or third-party vouchers may be subject to separate rules shown at the time of purchase.',
            ],
        },
        {
            heading: 'Chargebacks',
            paragraphs: [
                'If you dispute a charge with your bank, please contact us first so we can try to resolve the issue. Unfounded chargebacks may affect your ability to use the service.',
            ],
        },
        {
            heading: 'Contact',
            paragraphs: [
                'For cancellation or refund requests, use the in-app order details and support channels. Include your order number for faster handling.',
            ],
        },
    ],
};

export const LEGAL_SLUGS = {
    PRIVACY: 'privacy-policy',
    TERMS: 'terms',
    REFUND: 'refund',
} as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[keyof typeof LEGAL_SLUGS];

export function getLegalDocument(slug: string): LegalDocument | null {
    switch (slug) {
        case LEGAL_SLUGS.PRIVACY:
            return privacyPolicy;
        case LEGAL_SLUGS.TERMS:
            return termsAndConditions;
        case LEGAL_SLUGS.REFUND:
            return refundAndCancellation;
        default:
            return null;
    }
}

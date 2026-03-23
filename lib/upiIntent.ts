import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export type UpiAppId = 'gpay' | 'phonepe' | 'paytm' | 'bhim';

export type UpiAppDefinition = {
  id: UpiAppId;
  label: string;
  /** Used with Linking.canOpenURL to detect install (best-effort). */
  probeUrl: string;
  /** Android package for intent:// UPI launch. */
  androidPackage?: string;
};

export const UPI_APP_DEFINITIONS: UpiAppDefinition[] = [
  {
    id: 'gpay',
    label: 'Google Pay',
    probeUrl: 'tez://',
    androidPackage: 'com.google.android.apps.nbu.paisa.user',
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    probeUrl: 'phonepe://',
    androidPackage: 'com.phonepe.app',
  },
  {
    id: 'paytm',
    label: 'Paytm',
    probeUrl: 'paytmmp://',
    androidPackage: 'net.one97.paytm',
  },
  {
    id: 'bhim',
    label: 'BHIM',
    probeUrl: 'bhim://',
    androidPackage: 'in.org.npci.upiapp',
  },
];

function buildUpiQuery(params: {
  pa: string;
  pn: string;
  amRupee: string;
  tr: string;
  tn: string;
}): string {
  const { pa, pn, amRupee, tr, tn } = params;
  return [
    `pa=${encodeURIComponent(pa)}`,
    `pn=${encodeURIComponent(pn)}`,
    `am=${encodeURIComponent(amRupee)}`,
    'cu=INR',
    `tr=${encodeURIComponent(tr)}`,
    `tn=${encodeURIComponent(tn)}`,
  ].join('&');
}

/**
 * Generic NPCI-style UPI link (opens app picker on many devices).
 */
export function buildUpiPayUrl(params: {
  merchantVpa: string;
  payeeName: string;
  amountRupee: string;
  transactionRef: string;
  note: string;
}): string {
  const q = buildUpiQuery({
    pa: params.merchantVpa,
    pn: params.payeeName,
    amRupee: params.amountRupee,
    tr: params.transactionRef,
    tn: params.note,
  });
  return `upi://pay?${q}`;
}

/**
 * Android: target a specific UPI app via intent URL (when package is known).
 */
export function buildAndroidAppUpiIntentUrl(
  androidPackage: string,
  params: {
    merchantVpa: string;
    payeeName: string;
    amountRupee: string;
    transactionRef: string;
    note: string;
  },
): string {
  const q = buildUpiQuery({
    pa: params.merchantVpa,
    pn: params.payeeName,
    amRupee: params.amountRupee,
    tr: params.transactionRef,
    tn: params.note,
  });
  return `intent://pay?${q}#Intent;scheme=upi;package=${androidPackage};end`;
}

export function buildLaunchUrlForUpiApp(
  app: UpiAppDefinition,
  baseParams: {
    merchantVpa: string;
    payeeName: string;
    amountRupee: string;
    transactionRef: string;
    note: string;
  },
): string {
  if (Platform.OS === 'android' && app.androidPackage) {
    return buildAndroidAppUpiIntentUrl(app.androidPackage, baseParams);
  }
  if (app.id === 'phonepe') {
    const q = buildUpiQuery({
      pa: baseParams.merchantVpa,
      pn: baseParams.payeeName,
      amRupee: baseParams.amountRupee,
      tr: baseParams.transactionRef,
      tn: baseParams.note,
    });
    return `phonepe://pay?${q}`;
  }
  if (app.id === 'paytm') {
    const q = buildUpiQuery({
      pa: baseParams.merchantVpa,
      pn: baseParams.payeeName,
      amRupee: baseParams.amountRupee,
      tr: baseParams.transactionRef,
      tn: baseParams.note,
    });
    return `paytmmp://pay?${q}`;
  }
  return buildUpiPayUrl({
    merchantVpa: baseParams.merchantVpa,
    payeeName: baseParams.payeeName,
    amountRupee: baseParams.amountRupee,
    transactionRef: baseParams.transactionRef,
    note: baseParams.note,
  });
}

export async function probeInstalledUpiApps(): Promise<UpiAppId[]> {
  const installed: UpiAppId[] = [];
  for (const app of UPI_APP_DEFINITIONS) {
    try {
      if (await Linking.canOpenURL(app.probeUrl)) {
        installed.push(app.id);
      }
    } catch {
      /* treat as not installed */
    }
  }
  return installed;
}

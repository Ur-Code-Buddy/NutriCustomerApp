import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { ChevronDown, ChevronUp, Smartphone } from 'lucide-react-native';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { usePaymentUpiReturn } from '../../context/PaymentUpiReturnContext';
import {
  isUserCancelledRazorpayError,
  openRazorpayCheckout,
  type RazorpayMethodRestriction,
  type RazorpaySuccessPayload,
} from '../../lib/razorpayCheckout';
import {
  buildLaunchUrlForUpiApp,
  probeInstalledUpiApps,
  UPI_APP_DEFINITIONS,
  type UpiAppId,
} from '../../lib/upiIntent';

export type PaymentSheetSession = {
  publicKey: string;
  razorpayOrderId: string;
  amountPaise: number;
  description: string;
  prefill: { email?: string; contact?: string; name?: string };
  themeColor?: string;
};

export type PaymentMethodSheetHandle = {
  open: (session: PaymentSheetSession) => void;
  dismiss: () => void;
};

type PaymentMethodSheetProps = {
  onPaid: (payload: RazorpaySuccessPayload) => Promise<void>;
  onCheckoutError: (err: unknown) => void;
  onUserCancelledRazorpay: () => void;
  /** User closed the sheet without completing a Razorpay flow (e.g. swipe down). */
  onSheetClosed: () => void;
};

function methodBlock(allowed: 'upi' | 'card' | 'netbanking'): RazorpayMethodRestriction {
  if (allowed === 'upi') {
    return { upi: true, card: false, netbanking: false, wallet: false };
  }
  if (allowed === 'card') {
    return { upi: false, card: true, netbanking: false, wallet: false };
  }
  return { upi: false, card: false, netbanking: true, wallet: false };
}

export const PaymentMethodSheet = forwardRef<PaymentMethodSheetHandle, PaymentMethodSheetProps>(
  function PaymentMethodSheet({ onPaid, onCheckoutError, onUserCancelledRazorpay, onSheetClosed }, ref) {
    const insets = useSafeAreaInsets();
    const bottomRef = useRef<BottomSheetModal>(null);
    const { subscribeUpiReturn } = usePaymentUpiReturn();

    const [session, setSession] = useState<PaymentSheetSession | null>(null);
    const pendingPresentRef = useRef(false);
    const [busy, setBusy] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [cardsOpen, setCardsOpen] = useState(false);
    const [netOpen, setNetOpen] = useState(false);
    const [installedApps, setInstalledApps] = useState<UpiAppId[] | null>(null);
    const [showResumeHint, setShowResumeHint] = useState(false);
    const launchedUpiIntentRef = useRef(false);
    const skipNextDismissNotificationRef = useRef(false);

    const merchantVpa = (Constants.expoConfig?.extra?.merchantUpiVpa as string | undefined)?.trim() ?? '';

    useEffect(() => {
      let cancelled = false;
      void probeInstalledUpiApps().then((ids) => {
        if (!cancelled) setInstalledApps(ids);
      });
      return () => {
        cancelled = true;
      };
    }, []);

    useLayoutEffect(() => {
      if (pendingPresentRef.current && session) {
        pendingPresentRef.current = false;
        bottomRef.current?.present();
      }
    }, [session]);

    useImperativeHandle(ref, () => ({
      open: (s) => {
        setSession(s);
        setUpiId('');
        setCardsOpen(false);
        setNetOpen(false);
        setShowResumeHint(false);
        pendingPresentRef.current = true;
        launchedUpiIntentRef.current = false;
      },
      dismiss: () => bottomRef.current?.dismiss(),
    }));

    useEffect(() => {
      return subscribeUpiReturn(() => setShowResumeHint(true));
    }, [subscribeUpiReturn]);

    useEffect(() => {
      const sub = AppState.addEventListener('change', (next) => {
        if (next === 'active' && launchedUpiIntentRef.current) {
          setShowResumeHint(true);
        }
      });
      return () => sub.remove();
    }, []);

    const amountRupee = useMemo(() => {
      if (!session) return '0.00';
      return (session.amountPaise / 100).toFixed(2);
    }, [session]);

    const baseRazorpayArgs = useCallback(() => {
      if (!session) throw new Error('No active payment session');
      return {
        key: session.publicKey,
        orderId: session.razorpayOrderId,
        amountPaise: session.amountPaise,
        description: session.description,
        prefill: session.prefill,
        themeColor: session.themeColor ?? Colors.dark.primary,
      };
    }, [session]);

    const runRazorpay = useCallback(
      async (extra: Parameters<typeof openRazorpayCheckout>[0]) => {
        setBusy(true);
        skipNextDismissNotificationRef.current = true;
        bottomRef.current?.dismiss();
        try {
          const payload = await openRazorpayCheckout(extra);
          await onPaid(payload);
        } catch (e) {
          if (isUserCancelledRazorpayError(e)) {
            onUserCancelledRazorpay();
          } else {
            onCheckoutError(e);
          }
        } finally {
          setBusy(false);
        }
      },
      [onPaid, onCheckoutError, onUserCancelledRazorpay],
    );

    const onSheetDismiss = useCallback(() => {
      if (skipNextDismissNotificationRef.current) {
        skipNextDismissNotificationRef.current = false;
        return;
      }
      onSheetClosed();
    }, [onSheetClosed]);

    const onUpiAppPress = useCallback(
      async (appId: UpiAppId) => {
        if (!session || !merchantVpa) return;
        const def = UPI_APP_DEFINITIONS.find((d) => d.id === appId);
        if (!def) return;
        const url = buildLaunchUrlForUpiApp(def, {
          merchantVpa,
          payeeName: 'NutriTiffin',
          amountRupee,
          transactionRef: session.razorpayOrderId,
          note: session.description.slice(0, 80),
        });
        try {
          launchedUpiIntentRef.current = true;
          const can = await Linking.canOpenURL(url);
          if (!can) {
            throw new Error('Cannot open this payment link on this device.');
          }
          await Linking.openURL(url);
        } catch (e) {
          launchedUpiIntentRef.current = false;
          onCheckoutError(e);
        }
      },
      [session, merchantVpa, amountRupee, onCheckoutError],
    );

    const onCompleteWithRazorpayUpi = useCallback(() => {
      if (!session) return;
      launchedUpiIntentRef.current = false;
      void runRazorpay({
        ...baseRazorpayArgs(),
        method: methodBlock('upi'),
      });
    }, [session, baseRazorpayArgs, runRazorpay]);

    const onManualUpi = useCallback(() => {
      const v = upiId.trim().toLowerCase();
      if (!v.includes('@') || !session) return;
      void runRazorpay({
        ...baseRazorpayArgs(),
        method: methodBlock('upi'),
        upiVpa: v,
      });
    }, [upiId, session, baseRazorpayArgs, runRazorpay]);

    const onCardPay = useCallback(() => {
      void runRazorpay({
        ...baseRazorpayArgs(),
        method: methodBlock('card'),
      });
    }, [baseRazorpayArgs, runRazorpay]);

    const onNetBankingPay = useCallback(() => {
      void runRazorpay({
        ...baseRazorpayArgs(),
        method: methodBlock('netbanking'),
      });
    }, [baseRazorpayArgs, runRazorpay]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.55} />
      ),
      [],
    );

    const snapPoints = useMemo(() => ['88%'], []);

    const visibleApps = UPI_APP_DEFINITIONS.filter((d) => installedApps?.includes(d.id));

    return (
      <BottomSheetModal
        ref={bottomRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={!busy}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
        android_keyboardInputMode="adjustResize"
        onDismiss={onSheetDismiss}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {!session ? (
            <View style={styles.emptySession}>
              <ActivityIndicator color={Colors.dark.primary} />
            </View>
          ) : null}
          {session ? <Text style={styles.title}>Choose payment method</Text> : null}
          {session ? (
            <Text style={styles.subtitle}>
              Total · ₹{amountRupee}
              {'\n'}
              <Text style={styles.orderRef}>Order {session.razorpayOrderId}</Text>
            </Text>
          ) : null}

          {session && showResumeHint ? (
            <View style={styles.resumeBox}>
              <Text style={styles.resumeText}>
                Returned from a UPI app? Complete this Razorpay order with UPI so we can verify payment on our
                server.
              </Text>
              <TouchableOpacity
                style={styles.resumeBtn}
                onPress={onCompleteWithRazorpayUpi}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Text style={styles.resumeBtnText}>Complete with Razorpay (UPI)</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {session ? <Text style={styles.sectionLabel}>UPI apps</Text> : null}
          {session && !merchantVpa ? (
            <Text style={styles.warningText}>
              Set <Text style={styles.mono}>EXPO_PUBLIC_MERCHANT_UPI_VPA</Text> or{' '}
              <Text style={styles.mono}>extra.merchantUpiVpa</Text> in app config to enable one-tap UPI intents.
            </Text>
          ) : null}
          {session && merchantVpa && visibleApps.length === 0 && installedApps !== null ? (
            <Text style={styles.muted}>No supported UPI apps detected. Use manual UPI or card below.</Text>
          ) : null}
          {session && merchantVpa && visibleApps.length > 0 ? (
            <View style={styles.iconRow}>
              {visibleApps.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.iconChip}
                  onPress={() => onUpiAppPress(app.id)}
                  disabled={busy || !merchantVpa}
                  activeOpacity={0.85}
                >
                  <Smartphone size={22} color={Colors.dark.primary} />
                  <Text style={styles.iconChipLabel}>{app.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {session ? <Text style={[styles.sectionLabel, styles.sectionSpaced]}>Enter UPI ID manually</Text> : null}
          {session ? (
            <BottomSheetTextInput
              style={styles.input}
              placeholder="you@paytm / you@ybl"
              placeholderTextColor={Colors.dark.muted}
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
          ) : null}
          {session ? (
            <TouchableOpacity
              style={[styles.primaryBtn, (!upiId.includes('@') || busy) && styles.primaryBtnDisabled]}
              onPress={onManualUpi}
              disabled={!upiId.includes('@') || busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color={Colors.dark.primaryForeground} />
              ) : (
                <Text style={styles.primaryBtnText}>Pay with UPI ID</Text>
              )}
            </TouchableOpacity>
          ) : null}

          {session ? (
            <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setCardsOpen((o) => !o)} activeOpacity={0.8}>
              <Text style={styles.collapsibleTitle}>Cards</Text>
              {cardsOpen ? <ChevronUp size={20} color={Colors.dark.text} /> : <ChevronDown size={20} color={Colors.dark.text} />}
            </TouchableOpacity>
          ) : null}
          {session && cardsOpen ? (
            <View style={styles.collapsibleBody}>
              <Text style={styles.muted}>Debit or credit card via Razorpay secure checkout.</Text>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onCardPay} disabled={busy} activeOpacity={0.85}>
                <Text style={styles.secondaryBtnText}>Continue with card</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {session ? (
            <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setNetOpen((o) => !o)} activeOpacity={0.8}>
              <Text style={styles.collapsibleTitle}>Net banking</Text>
              {netOpen ? <ChevronUp size={20} color={Colors.dark.text} /> : <ChevronDown size={20} color={Colors.dark.text} />}
            </TouchableOpacity>
          ) : null}
          {session && netOpen ? (
            <View style={styles.collapsibleBody}>
              <Text style={styles.muted}>Pay through your bank&apos;s net banking portal.</Text>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onNetBankingPay} disabled={busy} activeOpacity={0.85}>
                <Text style={styles.secondaryBtnText}>Continue with net banking</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  emptySession: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  sheetBg: {
    backgroundColor: Colors.dark.sheetTint,
  },
  handle: {
    backgroundColor: Colors.dark.borderLight,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  orderRef: {
    fontSize: 12,
    color: Colors.dark.muted,
  },
  resumeBox: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    padding: 12,
    marginBottom: 16,
  },
  resumeText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  resumeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resumeBtnText: {
    color: Colors.dark.primaryForeground,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionSpaced: {
    marginTop: 20,
  },
  warningText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: Colors.dark.text,
  },
  muted: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconChip: {
    minWidth: '22%',
    flexGrow: 1,
    maxWidth: '48%',
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  iconChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: Colors.dark.primaryForeground,
    fontSize: 16,
    fontWeight: '700',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  collapsibleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  collapsibleBody: {
    paddingBottom: 8,
  },
  secondaryBtn: {
    marginTop: 4,
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '600',
  },
});

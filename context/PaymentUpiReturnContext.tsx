import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import * as Linking from 'expo-linking';

type Listener = () => void;

type PaymentUpiReturnContextValue = {
  subscribeUpiReturn: (fn: Listener) => () => void;
};

const PaymentUpiReturnContext = createContext<PaymentUpiReturnContextValue | null>(null);

export function PaymentUpiReturnProvider({ children }: { children: React.ReactNode }) {
  const listeners = useRef(new Set<Listener>());

  const notify = useCallback(() => {
    listeners.current.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore listener errors */
      }
    });
  }, []);

  const subscribeUpiReturn = useCallback((fn: Listener) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      if (url.includes('payment/upi-return') || url.includes('payment%2Fupi-return')) {
        notify();
      }
    };
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    void Linking.getInitialURL().then(handleUrl);
    return () => sub.remove();
  }, [notify]);

  const value = useMemo(() => ({ subscribeUpiReturn }), [subscribeUpiReturn]);

  return <PaymentUpiReturnContext.Provider value={value}>{children}</PaymentUpiReturnContext.Provider>;
}

export function usePaymentUpiReturn(): PaymentUpiReturnContextValue {
  const ctx = useContext(PaymentUpiReturnContext);
  if (!ctx) {
    throw new Error('usePaymentUpiReturn must be used within PaymentUpiReturnProvider');
  }
  return ctx;
}

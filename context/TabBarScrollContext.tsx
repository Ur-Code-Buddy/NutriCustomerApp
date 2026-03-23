import { useFocusEffect } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBarHideTranslateY } from '../constants/tabBarLayout';
import {
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type TabBarScrollContextValue = {
  tabBarTranslateY: ReturnType<typeof useSharedValue<number>>;
  onTabScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  resetScrollTracking: () => void;
  showTabBar: () => void;
};

const TabBarScrollContext = createContext<TabBarScrollContextValue | null>(null);

/** Total downward distance before hiding (slow drags add small deltas each frame). */
const ACCUMULATE_DOWN_TO_HIDE = 14;
/** Total upward distance before showing again. */
const ACCUMULATE_UP_TO_SHOW = 12;
const ANIM_DURATION = 220;

export function TabBarScrollProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const hideDistance = tabBarHideTranslateY(insets.bottom);
  const tabBarTranslateY = useSharedValue(0);
  const lastOffsetY = useRef<number | undefined>(undefined);
  const accumulatedDown = useRef(0);
  const accumulatedUp = useRef(0);

  const showTabBar = useCallback(() => {
    tabBarTranslateY.value = withTiming(0, { duration: ANIM_DURATION });
  }, [tabBarTranslateY]);

  const resetScrollTracking = useCallback(() => {
    lastOffsetY.current = undefined;
    accumulatedDown.current = 0;
    accumulatedUp.current = 0;
    showTabBar();
  }, [showTabBar]);

  const onTabScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;

      if (y <= 8) {
        lastOffsetY.current = y;
        accumulatedDown.current = 0;
        accumulatedUp.current = 0;
        tabBarTranslateY.value = withTiming(0, { duration: ANIM_DURATION });
        return;
      }

      if (lastOffsetY.current === undefined) {
        lastOffsetY.current = y;
        accumulatedDown.current = 0;
        accumulatedUp.current = 0;
        return;
      }

      const delta = y - lastOffsetY.current;
      lastOffsetY.current = y;

      if (delta > 0) {
        accumulatedDown.current += delta;
        accumulatedUp.current = 0;
        if (accumulatedDown.current >= ACCUMULATE_DOWN_TO_HIDE) {
          accumulatedDown.current = 0;
          tabBarTranslateY.value = withTiming(hideDistance, { duration: ANIM_DURATION });
        }
      } else if (delta < 0) {
        accumulatedUp.current += -delta;
        accumulatedDown.current = 0;
        if (accumulatedUp.current >= ACCUMULATE_UP_TO_SHOW) {
          accumulatedUp.current = 0;
          tabBarTranslateY.value = withTiming(0, { duration: ANIM_DURATION });
        }
      }
    },
    [hideDistance, tabBarTranslateY]
  );

  const value = useMemo(
    () => ({
      tabBarTranslateY,
      onTabScroll,
      resetScrollTracking,
      showTabBar,
    }),
    [tabBarTranslateY, onTabScroll, resetScrollTracking, showTabBar]
  );

  return (
    <TabBarScrollContext.Provider value={value}>{children}</TabBarScrollContext.Provider>
  );
}

export function useTabBarScroll() {
  const ctx = useContext(TabBarScrollContext);
  if (!ctx) {
    throw new Error('useTabBarScroll must be used within TabBarScrollProvider');
  }
  return ctx;
}

/** Pass-through scroll props for list/scroll views on tab screens. */
export function useTabBarScrollProps() {
  const { onTabScroll } = useTabBarScroll();
  return useMemo(
    () => ({
      onScroll: onTabScroll,
      scrollEventThrottle: 16 as const,
    }),
    [onTabScroll]
  );
}

/** Call on tab screens nested under the same tab (e.g. profile stack) so scroll deltas are not stale. */
export function useTabBarScrollResetOnFocus() {
  const { resetScrollTracking } = useTabBarScroll();
  useFocusEffect(
    useCallback(() => {
      resetScrollTracking();
    }, [resetScrollTracking])
  );
}

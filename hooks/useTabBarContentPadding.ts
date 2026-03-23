import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBarContentPaddingBottom } from '../constants/tabBarLayout';

export function useTabBarContentPadding(): number {
  const insets = useSafeAreaInsets();
  return useMemo(
    () => tabBarContentPaddingBottom(insets.bottom),
    [insets.bottom]
  );
}

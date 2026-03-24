/**
 * Shared layout and elevation for in-app screens (post-auth).
 * Keeps cards and surfaces consistent with a premium delivery-app feel.
 */

import { Platform, type ViewStyle } from 'react-native';

export const SCREEN_PADDING_H = 20;

/** Primary cards — noticeable float */
export const premiumCardShadow: ViewStyle =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.38,
        shadowRadius: 22,
      }
    : { elevation: 12 };

/** Lighter elevation for dense lists */
export const premiumCardShadowSoft: ViewStyle =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      }
    : { elevation: 6 };

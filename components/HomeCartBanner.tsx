import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronRight, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import {
  HOME_CART_BANNER_GAP_ABOVE_TAB,
  PILL_TAB_BAR_BOTTOM_GAP,
  PILL_TAB_BAR_HEIGHT,
} from '../constants/tabBarLayout';
import { useCart } from '../context/CartContext';

const SPRING = { damping: 22, stiffness: 260 };
const HIDE_OFFSET = 160;

function triggerLightHaptic() {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function HomeCartBanner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const {
    count,
    totalAmount,
    kitchenName,
    kitchenImageUrl,
    kitchenId,
    clearCart,
  } = useCart();
  const translateY = useSharedValue(HIDE_OFFSET);

  const show = count > 0 && isFocused;

  useEffect(() => {
    translateY.value = withSpring(show ? 0 : HIDE_OFFSET, SPRING);
  }, [show, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const bottom =
    insets.bottom +
    PILL_TAB_BAR_BOTTOM_GAP +
    PILL_TAB_BAR_HEIGHT +
    HOME_CART_BANNER_GAP_ABOVE_TAB;

  const onViewMenu = () => {
    if (!kitchenId) return;
    triggerLightHaptic();
    router.push(`/kitchen/${kitchenId}`);
  };

  const onViewCart = () => {
    triggerLightHaptic();
    router.push('/cart');
  };

  const onClearPress = () => {
    triggerLightHaptic();
    Alert.alert(
      'Empty cart?',
      'Remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            void clearCart();
          },
        },
      ],
    );
  };

  const displayName = kitchenName?.trim() || 'Your kitchen';
  const initial = displayName.charAt(0).toUpperCase();

  if (count === 0) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={show ? 'box-none' : 'none'}
      style={[styles.wrap, { bottom }, animatedStyle]}
    >
      <View
        style={[
          styles.bar,
          Platform.OS === 'ios' ? styles.barShadowIOS : styles.barShadowAndroid,
        ]}
      >
        <View style={styles.thumbWrap}>
          {kitchenImageUrl ? (
            <Image
              source={{ uri: kitchenImageUrl }}
              style={styles.thumb}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Text style={styles.thumbLetter}>{initial}</Text>
            </View>
          )}
        </View>

        <View style={styles.mid}>
          <Text
            style={styles.kitchenName}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {displayName}
          </Text>
          <Pressable
            onPress={onViewMenu}
            disabled={!kitchenId}
            hitSlop={{ top: 6, bottom: 6 }}
            style={({ pressed }) => [
              styles.viewMenuRow,
              !kitchenId && styles.viewMenuDisabled,
              pressed && kitchenId && styles.viewMenuPressed,
            ]}
          >
            <Text style={styles.viewMenuText}>View menu</Text>
            <ChevronRight
              size={14}
              color={
                kitchenId ? Colors.dark.primary : Colors.dark.muted
              }
              strokeWidth={2.5}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={onViewCart}
          accessibilityRole="button"
          accessibilityLabel={`View cart, ${count} items, ${totalAmount.toFixed(0)} rupees`}
          style={({ pressed }) => [
            styles.viewCartPill,
            pressed && styles.viewCartPillPressed,
          ]}
        >
          <Text style={styles.viewCartTitle}>Cart</Text>
          <Text style={styles.viewCartSub} numberOfLines={1}>
            ₹{totalAmount.toFixed(0)} · {count} {count === 1 ? 'item' : 'items'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onClearPress}
          accessibilityRole="button"
          accessibilityLabel="Clear cart"
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.clearBtn,
            pressed && styles.clearBtnPressed,
          ]}
        >
          <X size={18} color={Colors.dark.textSecondary} strokeWidth={2.25} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const GLASS_BG = 'rgba(28, 28, 32, 0.94)';

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
    alignItems: 'center',
    paddingHorizontal: '6%',
  },
  bar: {
    width: '100%',
    maxWidth: 400,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 4,
    gap: 8,
    borderRadius: 999,
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  barShadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 22,
  },
  barShadowAndroid: {
    elevation: 26,
  },
  thumbWrap: {
    flexShrink: 0,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  thumbLetter: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark.muted,
  },
  mid: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 1,
  },
  kitchenName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.text,
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  viewMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 1,
    gap: 1,
  },
  viewMenuText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  viewMenuPressed: {
    opacity: 0.75,
  },
  viewMenuDisabled: {
    opacity: 0.45,
  },
  viewCartPill: {
    flexShrink: 0,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewCartPillPressed: {
    opacity: 0.9,
  },
  viewCartTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark.primaryForeground,
    letterSpacing: -0.2,
  },
  viewCartSub: {
    marginTop: 0,
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(245, 245, 247, 0.88)',
    textAlign: 'center',
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  clearBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});

import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ChevronRight, ShoppingBag } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import {
  HOME_CART_BANNER_GAP_ABOVE_TAB,
  HOME_CART_BANNER_HEIGHT,
  PILL_TAB_BAR_BOTTOM_GAP,
  PILL_TAB_BAR_HEIGHT,
} from '../constants/tabBarLayout';
import * as Haptics from 'expo-haptics';
import { useCart } from '../context/CartContext';

const SPRING = { damping: 22, stiffness: 260 };

export function HomeCartBanner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { count, totalAmount, kitchenName } = useCart();
  const translateY = useSharedValue(120);

  const show = count > 0 && isFocused;

  useEffect(() => {
    translateY.value = withSpring(show ? 0 : 120, SPRING);
  }, [show, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const bottom =
    insets.bottom +
    PILL_TAB_BAR_BOTTOM_GAP +
    PILL_TAB_BAR_HEIGHT +
    HOME_CART_BANNER_GAP_ABOVE_TAB;

  const onPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/cart');
  };

  if (count === 0) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={show ? 'box-none' : 'none'}
      style={[
        styles.wrap,
        { bottom, height: HOME_CART_BANNER_HEIGHT },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.bar,
          Platform.OS === 'ios' ? styles.barShadowIOS : styles.barShadowAndroid,
          pressed && styles.barPressed,
        ]}
      >
        <View style={styles.iconCircle}>
          <ShoppingBag size={20} color={Colors.dark.primaryForeground} strokeWidth={2} />
        </View>
        <View style={styles.mid}>
          <Text style={styles.title} numberOfLines={1}>
            {count} {count === 1 ? 'item' : 'items'}
            {kitchenName ? ` · ${kitchenName}` : ''}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            ₹{totalAmount.toFixed(0)} · View cart
          </Text>
        </View>
        <ChevronRight size={22} color={Colors.dark.primary} strokeWidth={2.5} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
    alignItems: 'center',
  },
  bar: {
    width: '88%',
    maxWidth: 400,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 14,
    gap: 10,
    borderRadius: 999,
    backgroundColor: Colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  barPressed: {
    opacity: 0.92,
  },
  barShadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  barShadowAndroid: {
    elevation: 24,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark.text,
    letterSpacing: -0.2,
  },
  sub: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
});

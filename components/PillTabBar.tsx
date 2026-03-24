import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import {
  PILL_TAB_BAR_BOTTOM_GAP,
  PILL_TAB_BAR_HEIGHT,
} from '../constants/tabBarLayout';
import { useTabBarScroll } from '../context/TabBarScrollContext';

const TAB_BAR_COLORS = {
  surfaceElevated: Colors.dark.cardElevated,
  borderLight: Colors.dark.borderLight,
  primary: Colors.dark.primary,
  textTertiary: Colors.dark.muted,
};

const TAB_ICONS: Record<
  string,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  index: { active: 'restaurant', inactive: 'restaurant-outline' },
  orders: { active: 'list', inactive: 'list-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

export function PillTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { tabBarTranslateY, resetScrollTracking } = useTabBarScroll();

  useEffect(() => {
    resetScrollTracking();
  }, [state.index, resetScrollTracking]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabBarTranslateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + PILL_TAB_BAR_BOTTOM_GAP },
        animatedContainerStyle,
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[styles.pill, Platform.OS === 'ios' ? styles.pillShadowIOS : styles.pillShadowAndroid]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconConfig = TAB_ICONS[route.name] ?? {
            active: 'ellipse',
            inactive: 'ellipse-outline',
          };

          const onPress = () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const color = isFocused ? TAB_BAR_COLORS.primary : TAB_BAR_COLORS.textTertiary;
          const iconName = isFocused ? iconConfig.active : iconConfig.inactive;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <Ionicons name={iconName} size={22} color={color} />
              <Text
                style={[
                  styles.label,
                  { color },
                ]}
                numberOfLines={1}
              >
                {options.title ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '88%',
    maxWidth: 400,
    height: PILL_TAB_BAR_HEIGHT,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: TAB_BAR_COLORS.surfaceElevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TAB_BAR_COLORS.borderLight,
  },
  pillShadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  pillShadowAndroid: {
    elevation: 30,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 2,
  },
});

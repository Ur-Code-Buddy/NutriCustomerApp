import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MapPin, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeCartBanner } from '../../components/HomeCartBanner';
import { premiumCardShadowSoft, SCREEN_PADDING_H } from '../../constants/appChrome';
import { Colors } from '../../constants/Colors';
import { homeCartBannerExtraPadding } from '../../constants/tabBarLayout';
import { useCart } from '../../context/CartContext';
import { useTabBarScrollProps } from '../../context/TabBarScrollContext';
import { useTabBarContentPadding } from '../../hooks/useTabBarContentPadding';
import { kitchenService } from '../../services/api';

export default function KitchensScreen() {
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarScrollProps = useTabBarScrollProps();
  const tabBarPadBottom = useTabBarContentPadding();
  const { count: cartCount } = useCart();
  const listPadBottom =
    tabBarPadBottom + homeCartBannerExtraPadding(cartCount > 0);

  const fetchKitchens = async () => {
    try {
      const data = await kitchenService.getAll();
      setKitchens(data);
    } catch (error) {
      console.error('Failed to fetch kitchens', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKitchens();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchKitchens();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchKitchens();
    }, [])
  );

  const renderKitchenItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, premiumCardShadowSoft]}
      onPress={() => router.push(`/kitchen/${item.id}`)}
      activeOpacity={0.92}
    >
      <View style={styles.imagePlaceholder}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.kitchenImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholderBlock}>
            <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text
            style={styles.kitchenName}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Star size={13} color={Colors.dark.primary} fill={Colors.dark.primary} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {item.details?.description || item.description}
        </Text>
        <View style={styles.footerRow}>
          <View style={styles.pinIconWrap}>
            <MapPin size={13} color={Colors.dark.primary} />
          </View>
          <Text style={styles.address} numberOfLines={2}>
            {item.details?.address || item.address || 'Address not available'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerEyebrow}>Order in</Text>
        <Text style={styles.headerTitle}>Discover kitchens</Text>
        <Text style={styles.headerSubtitle}>Home-style meals, scheduled delivery</Text>
        <View style={styles.highlightRow}>
          {['Trusted cooks', 'Fresh prep', 'Your schedule'].map((label) => (
            <View key={label} style={styles.highlightPill}>
              <Text style={styles.highlightPillText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <FlatList
        data={kitchens}
        renderItem={renderKitchenItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: listPadBottom }]}
        showsVerticalScrollIndicator={false}
        {...tabBarScrollProps}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>Pull down to refresh or check back soon.</Text>
          </View>
        }
      />
      <HomeCartBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: SCREEN_PADDING_H,
    marginBottom: 20,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginTop: 6,
    lineHeight: 22,
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  highlightPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.dark.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.dark.primaryBorder,
  },
  highlightPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 4,
  },
  card: {
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 22,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  imagePlaceholder: {
    height: 156,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  kitchenImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBlock: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.dark.muted,
    opacity: 0.5,
  },
  cardContent: {
    padding: 18,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  kitchenName: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.dark.text,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  ratingContainer: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.primaryBorder,
  },
  ratingText: {
    color: Colors.dark.primary,
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pinIconWrap: {
    marginTop: 1,
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  address: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

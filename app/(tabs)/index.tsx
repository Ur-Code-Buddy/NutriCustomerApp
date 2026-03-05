import { useFocusEffect, useRouter } from 'expo-router';
import { MapPin, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { kitchenService } from '../../services/api';

export default function KitchensScreen() {
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

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
      style={styles.card}
      onPress={() => router.push(`/kitchen/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.imagePlaceholder}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.kitchenImage} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.kitchenName}>{item.name}</Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Star size={14} color={Colors.dark.primary} fill={Colors.dark.primary} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.details?.description || item.description}</Text>
        <View style={styles.footerRow}>
          <MapPin size={14} color={Colors.dark.textSecondary} />
          <Text style={styles.address}>{item.details?.address || item.address || 'Address not available'}</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Kitchens</Text>
        <Text style={styles.headerSubtitle}>Home-cooked meals near you</Text>
      </View>
      <FlatList
        data={kitchens}
        renderItem={renderKitchenItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No kitchens found nearby.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    overflow: 'hidden',
  },
  kitchenImage: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.dark.muted,
    opacity: 0.8,
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kitchenName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
});

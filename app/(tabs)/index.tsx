import { useFocusEffect, useRouter } from 'expo-router';
import { MapPin, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        {/* Placeholder for Kitchen Image if API provides one later */}
        <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.kitchenName}>{item.name}</Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Star size={14} color="#eab308" fill="#eab308" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.footerRow}>
          <MapPin size={14} color={Colors.dark.textSecondary} />
          <Text style={styles.address}>{item.address}</Text>
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
    paddingHorizontal: 16,
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
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: Colors.dark.primary, // Using primary color as a nice background
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.dark.primaryForeground,
    opacity: 0.5,
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
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: '#eab308', // Yellow-500
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

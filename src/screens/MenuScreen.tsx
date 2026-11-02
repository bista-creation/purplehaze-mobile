import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api as typedApi, DishDto, CategoryDto } from '../services/api-client';
import { mobileRealtime } from '../services/realtime';
import { useCartStore } from '../stores/cart-store';
import { useI18n } from '../i18n';
import { Header, Badge } from '../components/ui';
import { colors, spacing, borderRadius } from '../theme';

export function MenuScreen({ navigation }: any) {
  const { t, formatCurrency } = useI18n();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [dishes, setDishes] = useState<DishDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  const loadMenu = async () => {
    try {
      const [catData, dishData] = await Promise.all([
        typedApi.menu.getCategories(),
        typedApi.menu.getDishes(),
      ]);
      setCategories(catData || []);
      setDishes(dishData || []);
    } catch (e) {
      console.warn('[MenuScreen] Error loading menu:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMenu();

    let unsubscribe: (() => void) | undefined;
    mobileRealtime
      .subscribeToMenu((payload) => {
        if (payload.type === 'dish_availability' && payload.dishId) {
          setDishes((prev) =>
            prev.map((d) =>
              d.id === payload.dishId
                ? { ...d, isAvailable: payload.isAvailable ?? d.isAvailable }
                : d
            )
          );
        }
      })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch(() => {});

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (selectedCategory && dish.categoryId !== selectedCategory) {
        return false;
      }
      if (vegOnly && !dish.isVeg) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          dish.name.toLowerCase().includes(q) ||
          (dish.description && dish.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [dishes, selectedCategory, vegOnly, searchQuery]);

  const handleQuickAdd = (dish: DishDto) => {
    if (!dish.isAvailable) return;
    if ((dish.variants && dish.variants.length > 0) || (dish.addOns && dish.addOns.length > 0)) {
      navigation.navigate('DishDetail', { dish });
      return;
    }

    addItem({
      dishId: dish.id,
      name: dish.name,
      slug: dish.slug,
      image: dish.image,
      basePrice: dish.price,
      variantPriceDelta: 0,
      addOns: [],
      quantity: 1,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading Purple Haze Menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      {/* Search & Veg toggle */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.menu.searchPlaceholder}
            placeholderTextColor={colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.vegToggle, vegOnly && styles.vegToggleActive]}
          onPress={() => setVegOnly(!vegOnly)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="leaf"
            size={16}
            color={vegOnly ? colors.veg : colors.textMuted}
          />
          <Text style={[styles.vegToggleText, vegOnly && styles.vegToggleTextActive]}>
            {t.menu.veg}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === null && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === null && styles.categoryPillTextActive,
              ]}
            >
              {t.menu.allCuisines}
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat.id && styles.categoryPillTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dishes List */}
      <FlatList
        data={filteredDishes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadMenu();
            }}
            tintColor={colors.gold}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.dishCard, !item.isAvailable && styles.dishDisabled]}
            onPress={() => navigation.navigate('DishDetail', { dish: item })}
            activeOpacity={0.8}
          >
            <View style={styles.dishInfo}>
              <View style={styles.dishBadgeRow}>
                <Badge
                  label={item.isVeg ? t.menu.veg : t.menu.nonVeg}
                  variant={item.isVeg ? 'veg' : 'nonVeg'}
                />
                {item.isSpicy ? (
                  <View style={styles.spicyTag}>
                    <Ionicons name="flame" size={13} color={colors.nonVeg} />
                    <Text style={styles.spicyText}>{t.menu.spicy}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.dishName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.dishDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={styles.dishPrice}>{formatCurrency(item.price)}</Text>
            </View>

            <View style={styles.dishImageWrapper}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.dishImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.dishImage, styles.placeholderImage]}>
                  <Ionicons name="restaurant-outline" size={28} color={colors.gold} />
                </View>
              )}

              {item.isAvailable ? (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleQuickAdd(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addButtonText}>
                    {(item.variants && item.variants.length > 0) ? t.menu.customizable : t.menu.addToCart}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.soldOutBadge}>
                  <Text style={styles.soldOutText}>Sold Out</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyText}>{t.menu.emptyCategory}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
  vegToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 4,
  },
  vegToggleActive: {
    borderColor: colors.veg,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  vegToggleText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  vegToggleTextActive: {
    color: colors.veg,
  },
  categoriesWrapper: {
    paddingVertical: spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  categoryPillActive: {
    backgroundColor: colors.purple,
    borderColor: colors.gold,
  },
  categoryPillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: colors.text,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  dishDisabled: {
    opacity: 0.5,
  },
  dishInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  dishBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  spicyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  spicyText: {
    color: colors.nonVeg,
    fontSize: 10,
    fontWeight: '700',
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  dishDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gold,
    marginTop: 2,
  },
  dishImageWrapper: {
    width: 105,
    alignItems: 'center',
  },
  dishImage: {
    width: 95,
    height: 95,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  addButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.purple,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 95,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  soldOutBadge: {
    marginTop: spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    width: 95,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  soldOutText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
});

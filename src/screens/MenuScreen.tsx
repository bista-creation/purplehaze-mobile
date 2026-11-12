import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api as typedApi, DishDto, CategoryDto } from '../services/api-client';
import { mobileRealtime } from '../services/realtime';
import { useCartStore } from '../stores/cart-store';
import { useFavoritesStore } from '../stores/favorites-store';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { Header, FloatingCartBar, MenuCardHorizontal } from '../components/ui';
import { ColorTheme, spacing, borderRadius, displayFontFamily } from '../theme';

export function MenuScreen({ navigation, route }: any) {
  const { t, isNepali } = useI18n();
  const { colors } = useTheme();
  const [categories, setCategories] = useState<CategoryDto[]>(() => typedApi.menu.getCachedCategories());
  const [dishes, setDishes] = useState<DishDto[]>(() => typedApi.menu.getCachedDishes());
  const requestedCategoryId = route?.params?.categoryId ?? null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(requestedCategoryId);
  const [previousRouteCategoryId, setPreviousRouteCategoryId] = useState<string | null>(requestedCategoryId);
  if (requestedCategoryId && requestedCategoryId !== previousRouteCategoryId) {
    setPreviousRouteCategoryId(requestedCategoryId);
    setSelectedCategory(requestedCategoryId);
  }
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'under-500'>('default');
  const [isLoading, setIsLoading] = useState(() => typedApi.menu.getCachedDishes()?.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cartItemCount = useCartStore((s) => s.getItemCount());
  const { favoriteDishIds, toggleFavorite, isFavorite } = useFavoritesStore();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadMenu = async (forceRefresh = false) => {
    try {
      const [catData, dishData] = await Promise.all([
        typedApi.menu.getCategories({ forceRefresh }),
        typedApi.menu.getDishes(undefined, { forceRefresh }),
      ]);
      if (catData?.length) setCategories(catData);
      if (dishData?.length) setDishes(dishData);
    } catch (e) {
      console.warn('[MenuScreen] Error loading menu:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([typedApi.menu.getCategories(), typedApi.menu.getDishes()])
      .then(([catData, dishData]) => {
        if (!active) return;
        if (catData?.length) setCategories(catData);
        if (dishData?.length) setDishes(dishData);
      })
      .catch((e) => console.warn('[MenuScreen] Error loading menu:', e))
      .finally(() => {
        if (active) setIsLoading(false);
      });

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
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredDishes = useMemo(() => {
    let list = dishes.filter((dish) => {
      if (showOnlyFavorites && !favoriteDishIds.includes(dish.id)) {
        return false;
      }
      if (!showOnlyFavorites && selectedCategory && dish.categoryId !== selectedCategory) {
        return false;
      }
      if (vegOnly && !dish.isVeg) {
        return false;
      }
      if (sortBy === 'under-500' && dish.price > 50000) {
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

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [dishes, selectedCategory, showOnlyFavorites, favoriteDishIds, vegOnly, sortBy, searchQuery]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>{t.menu.loadingMenu}</Text>
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

      {/* Category Pills & Favorites */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === null && !showOnlyFavorites && styles.categoryPillActive,
            ]}
            onPress={() => {
              setSelectedCategory(null);
              setShowOnlyFavorites(false);
            }}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === null && !showOnlyFavorites && styles.categoryPillTextActive,
              ]}
            >
              {t.menu.allCuisines}
            </Text>
          </TouchableOpacity>

          {/* Favorites Filter Chip */}
          <TouchableOpacity
            style={[
              styles.categoryPill,
              showOnlyFavorites && styles.categoryPillActiveFavorites,
            ]}
            onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            <View style={styles.pillInnerRow}>
              <Ionicons
                name={showOnlyFavorites ? 'heart' : 'heart-outline'}
                size={14}
                color={showOnlyFavorites ? '#EF4444' : colors.textMuted}
              />
              <Text
                style={[
                  styles.categoryPillText,
                  showOnlyFavorites && styles.categoryPillTextActive,
                ]}
              >
                {t.menu.favoritesFilter} {favoriteDishIds.length > 0 ? `(${favoriteDishIds.length})` : ''}
              </Text>
            </View>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && !showOnlyFavorites && styles.categoryPillActive,
              ]}
              onPress={() => {
                setSelectedCategory(cat.id);
                setShowOnlyFavorites(false);
              }}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat.id && !showOnlyFavorites && styles.categoryPillTextActive,
                ]}
              >
                {/chef|recommend/i.test(cat.slug) ? (isNepali ? 'शेफका सिफारिस' : "Chef's Specials") : /nepali/i.test(cat.slug) ? t.menu.nepali : /indian|tandoor|curry/i.test(cat.slug) ? t.menu.indian : /asian/i.test(cat.slug) ? t.menu.asian : /continental|sizzler/i.test(cat.slug) ? t.menu.continental : /beverage|drink|bar/i.test(cat.slug) && isNepali ? 'पेय पदार्थ' : cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sorting & Quick Filters */}
      <View style={styles.sortWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'default' && styles.sortChipActive]}
            onPress={() => setSortBy('default')}
          >
            <Text style={[styles.sortChipText, sortBy === 'default' && styles.sortChipTextActive]}>{t.menu.recommendedSort}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'price-asc' && styles.sortChipActive]}
            onPress={() => setSortBy(sortBy === 'price-asc' ? 'default' : 'price-asc')}
          >
            <Ionicons name="arrow-up" size={12} color={sortBy === 'price-asc' ? colors.gold : colors.textMuted} />
            <Text style={[styles.sortChipText, sortBy === 'price-asc' && styles.sortChipTextActive]}>{t.menu.priceLowHigh}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'price-desc' && styles.sortChipActive]}
            onPress={() => setSortBy(sortBy === 'price-desc' ? 'default' : 'price-desc')}
          >
            <Ionicons name="arrow-down" size={12} color={sortBy === 'price-desc' ? colors.gold : colors.textMuted} />
            <Text style={[styles.sortChipText, sortBy === 'price-desc' && styles.sortChipTextActive]}>{t.menu.priceHighLow}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'under-500' && styles.sortChipActive]}
            onPress={() => setSortBy(sortBy === 'under-500' ? 'default' : 'under-500')}
          >
            <Text style={[styles.sortChipText, sortBy === 'under-500' && styles.sortChipTextActive]}>{t.menu.underPrice}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Dishes List */}
      <FlatList
        data={filteredDishes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: cartItemCount > 0 ? 140 : 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadMenu(true);
            }}
            tintColor={colors.gold}
          />
        }
        renderItem={({ item }) => (
          <MenuCardHorizontal
            dish={item}
            onPress={() => navigation.navigate('DishDetail', { dish: item })}
            onOptionsPress={() => navigation.navigate('DishDetail', { dish: item })}
            isFavorited={isFavorite(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyText}>{t.menu.emptyCategory}</Text>
          </View>
        }
      />

      {/* Floating Cart Bar (Persistent summary when cart has items) */}
      <FloatingCartBar onPress={() => navigation.navigate('Cart')} />
    </View>
  );
}

const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
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
    paddingTop: spacing.screenTop,
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
  categoryPillActiveFavorites: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  pillInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryPillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 90,
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
    position: 'relative',
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
    fontFamily: displayFontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  dishDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.purple,
    marginTop: 2,
  },
  dishImageWrapper: {
    width: 105,
    alignItems: 'center',
    position: 'relative',
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
  favoriteButton: {
    position: 'absolute',
    top: 6,
    right: 10,
    backgroundColor: 'rgba(19, 11, 29, 0.75)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    color: colors.textSecondary,
    fontSize: 15,
  },
  sortWrapper: {
    paddingBottom: spacing.sm,
  },
  sortScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sortChipActive: {
    backgroundColor: colors.purpleMuted,
    borderColor: colors.gold,
  },
  sortChipText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: colors.purple,
    fontWeight: '700',
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 76 : 70,
    left: 16,
    right: 16,
    backgroundColor: colors.purple,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.purpleDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  floatingCartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  floatingCartCount: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  floatingCartTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  floatingCartSubtotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingCartAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
  },
  floatingCartActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

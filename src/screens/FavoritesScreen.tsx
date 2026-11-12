import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api as typedApi, DishDto } from '../services/api-client';
import { useCartStore } from '../stores/cart-store';
import { useFavoritesStore } from '../stores/favorites-store';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { Header, FloatingCartBar, MenuCardHorizontal } from '../components/ui';
import { ColorTheme, spacing, borderRadius } from '../theme';

export function FavoritesScreen({ navigation }: any) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { favoriteDishIds, toggleFavorite } = useFavoritesStore();
  const cartItemCount = useCartStore((s) => s.getItemCount());

  const styles = useMemo(() => createStyles(colors), [colors]);

  const [dishes, setDishes] = useState<DishDto[]>(() => typedApi.menu.getCachedDishes());
  const [isLoading, setIsLoading] = useState(() => typedApi.menu.getCachedDishes()?.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDishes = async (forceRefresh = false) => {
    try {
      const data = await typedApi.menu.getDishes(undefined, { forceRefresh });
      if (data?.length) setDishes(data);
    } catch (e) {
      console.warn('[FavoritesScreen] Failed to load dishes:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    typedApi.menu.getDishes()
      .then((data) => {
        if (active && data?.length) setDishes(data);
      })
      .catch((e) => console.warn('[FavoritesScreen] Failed to load dishes:', e))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const favoriteDishes = dishes.filter((d) => favoriteDishIds.includes(d.id));

  return (
    <View style={styles.container}>
      <Header showTagline={false} showLocation={false} />

      <View style={styles.headerTitleRow}>
        <View>
          <Text style={styles.pageTitle}>{t.favorites.title}</Text>
          <Text style={styles.pageSubtitle}>
            {favoriteDishes.length} {favoriteDishes.length === 1 ? t.favorites.dishSingular : t.favorites.dishPlural} {t.favorites.savedCount}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      ) : favoriteDishes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyHeartCircle}>
            <Ionicons name="heart-dislike-outline" size={48} color={colors.purple} />
          </View>
          <Text style={styles.emptyTitle}>{t.favorites.emptyTitle}</Text>
          <Text style={styles.emptySubtitle}>
            {t.favorites.emptySubtitle}
          </Text>
          <TouchableOpacity
            style={styles.exploreMenuBtn}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.85}
          >
            <Text style={styles.exploreMenuBtnText}>{t.favorites.exploreMenu}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favoriteDishes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: cartItemCount > 0 ? 140 : 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadDishes(true);
              }}
              tintColor={colors.purple}
            />
          }
          renderItem={({ item }) => (
            <MenuCardHorizontal
              dish={item}
              onPress={() => navigation.navigate('DishDetail', { dish: item })}
              onOptionsPress={() => navigation.navigate('DishDetail', { dish: item })}
              isFavorited
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
        />
      )}

      {/* Floating Persistent Cart Summary Bar */}
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
  headerTitleRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.screenTop,
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: 12,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dishLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  vegIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vegText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.purple,
    marginTop: 2,
    marginBottom: 4,
  },
  dishDescription: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  dishRight: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  dishImage: {
    width: 84,
    height: 84,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeFavBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  addButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.purple,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.purple,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyHeartCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  exploreMenuBtn: {
    backgroundColor: colors.purple,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: borderRadius.xl,
  },
  exploreMenuBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
